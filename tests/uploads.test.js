const { expect } = require('chai');
const path = require('node:path');
const { readFile, readdir, writeFile } = require('node:fs/promises');
const config = require('../src/config');
const User = require('../src/models/user.model');
const Delivery = require('../src/models/delivery.model');
const { api, expectError, createCustomer, missingId } = require('./helpers/api');

const pdf = Buffer.from('%PDF-1.4\n% ShipNow test\n%%EOF\n');
const options = { filename: 'prueba.pdf', contentType: 'application/pdf' };
const userPath = (id) => `/api/users/${id}/documents`;
const proofPath = (id) => `/api/deliveries/${id}/proofs`;

async function expectFile(metadata, folder, documentType) {
  expect(metadata).to.have.all.keys(
    'originalName', 'filename', 'path', 'mimeType', 'size', 'documentType', 'uploadedAt',
  );
  expect(metadata.originalName).to.equal(options.filename);
  expect(metadata.filename).to.match(/^[a-f0-9-]{36}\.pdf$/);
  expect(metadata.path).to.equal(`uploads/${folder}/${metadata.filename}`);
  expect(metadata.mimeType).to.equal(options.contentType);
  expect(metadata.size).to.equal(pdf.length);
  expect(metadata.documentType).to.equal(documentType);
  expect(new Date(metadata.uploadedAt).toISOString()).to.equal(metadata.uploadedAt);

  const stored = await readFile(path.join(config.uploadsDir, folder, metadata.filename));
  expect(stored.equals(pdf)).to.equal(true);
}

describe('Carga de archivos', () => {
  it('guarda un documento en disco y asocia solo sus metadatos al usuario', async () => {
    const customer = await createCustomer();
    const response = await api.post(userPath(customer._id))
      .field('documentType', 'IDENTITY')
      .attach('file', pdf, options)
      .expect(201);

    expect(response.body.user._id).to.equal(customer._id);
    expect(response.body.user.documents).to.have.lengthOf(1);
    const [document] = response.body.user.documents;
    await expectFile(document, 'user-documents', 'IDENTITY');

    const saved = await User.findById(customer._id).lean();
    expect(saved.documents.map((file) => ({ ...file, uploadedAt: file.uploadedAt.toISOString() })))
      .to.deep.equal([document]);
  });

  it('almacena las licencias en su propia carpeta y conserva los documentos anteriores', async () => {
    const customer = await createCustomer();
    await api.post(userPath(customer._id))
      .field('documentType', 'IDENTITY').attach('file', pdf, options).expect(201);
    const response = await api.post(userPath(customer._id))
      .attach('file', pdf, options).field('documentType', 'LICENSE').expect(201);
    expect(response.body.user.documents).to.have.lengthOf(2);
    expect(response.body.user.documents[0].documentType).to.equal('IDENTITY');
    await expectFile(response.body.user.documents[1], 'licenses', 'LICENSE');
  });

  it('guarda un comprobante y lo asocia a una entrega', async () => {
    await api.post('/api/mocks/seed').query({ qty: 1, collection: 'all' }).expect(201);
    const list = await api.get('/api/deliveries').expect(200);
    const [delivery] = list.body;
    const result = await api.post(proofPath(delivery._id)).attach('file', pdf, options).expect(201);

    expect(result.body.delivery._id).to.equal(delivery._id);
    expect(result.body.delivery.orderId).to.equal(delivery.orderId);
    expect(result.body.delivery.proofs).to.have.lengthOf(1);
    const [proof] = result.body.delivery.proofs;
    await expectFile(proof, 'delivery-proofs', 'DELIVERY_PROOF');

    const saved = await Delivery.findById(delivery._id).lean();
    expect(saved.proofs.map((file) => ({ ...file, uploadedAt: file.uploadedAt.toISOString() })))
      .to.deep.equal([proof]);
  });

  it('rechaza un formulario sin archivo', async () => {
    const customer = await createCustomer();
    const response = await api.post(userPath(customer._id)).field('documentType', 'IDENTITY').expect(400);
    expectError(response, 'FILE_REQUIRED', 'Debes enviar un archivo en el campo file.');
  });

  it('rechaza un tipo de documento no permitido', async () => {
    const customer = await createCustomer();
    const response = await api.post(userPath(customer._id))
      .field('documentType', 'PASSPORT').attach('file', pdf, options).expect(400);
    expectError(response, 'INVALID_DOCUMENT_TYPE', 'El tipo de documento debe ser IDENTITY o LICENSE.');
  });

  it('rechaza un nombre de campo distinto de file', async () => {
    const customer = await createCustomer();
    const response = await api.post(userPath(customer._id))
      .field('documentType', 'IDENTITY').attach('archivo', pdf, options).expect(400);
    expectError(response, 'INVALID_FILE_FIELD', 'Envía un solo archivo en el campo file.');
  });

  it('rechaza un MIME no permitido y un PDF que no coincide con su firma', async () => {
    const customer = await createCustomer();
    const text = Buffer.from('Texto plano');
    for (const attachment of [options, { filename: 'prueba.txt', contentType: 'text/plain' }]) {
      const response = await api.post(userPath(customer._id))
        .field('documentType', 'IDENTITY').attach('file', text, attachment).expect(415);
      expectError(response, 'INVALID_FILE_TYPE', 'El archivo debe ser PDF, JPEG o PNG y coincidir con su tipo declarado.');
    }
  });

  it('acepta exactamente 2 MiB y rechaza un byte adicional con el error documentado', async () => {
    const customer = await createCustomer();
    const atLimit = Buffer.alloc(2 * 1024 * 1024);
    pdf.copy(atLimit);
    const accepted = await api.post(userPath(customer._id))
      .field('documentType', 'IDENTITY').attach('file', atLimit, options).expect(201);
    expect(accepted.body.user.documents[0].size).to.equal(atLimit.length);

    const tooBig = Buffer.concat([atLimit, Buffer.from('x')]);
    const rejected = await api.post(userPath(customer._id))
      .field('documentType', 'IDENTITY').attach('file', tooBig, options).expect(413);
    expectError(rejected, 'FILE_TOO_LARGE', 'El archivo no debe superar los 2 MiB.');
  });

  it('responde 404 si el usuario o la entrega no existen y no escribe un archivo', async () => {
    const user = await api.post(userPath(missingId))
      .field('documentType', 'IDENTITY').attach('file', pdf, options).expect(404);
    expectError(user, 'USER_NOT_FOUND', 'El usuario no existe.');

    const delivery = await api.post(proofPath(missingId)).attach('file', pdf, options).expect(404);
    expectError(delivery, 'DELIVERY_NOT_FOUND', 'La entrega no existe.');
    const files = await readdir(config.uploadsDir).catch((error) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    expect(files).to.deep.equal([]);
  });

  it('responde con el error común cuando falla la escritura en disco', async () => {
    const user = await createCustomer();
    await writeFile(config.uploadsDir, 'Un archivo bloquea la creación de la carpeta.');
    const response = await api.post(userPath(user._id))
      .field('documentType', 'IDENTITY').attach('file', pdf, options).expect(500);
    expectError(response, 'FILE_SAVE_FAILED', 'No se pudo guardar y asociar el archivo.');
    const saved = await User.findById(user._id).lean();
    expect(saved).not.to.have.property('documents');
  });

  it('limpia el archivo si MongoDB rechaza la asociación', async () => {
    const user = await createCustomer();
    const collection = User.collection.name;
    await User.db.db.command({ collMod: collection, validator: { documents: { $exists: false } } });
    try {
      const response = await api.post(userPath(user._id))
        .field('documentType', 'IDENTITY').attach('file', pdf, options).expect(500);
      expectError(response, 'FILE_SAVE_FAILED', 'No se pudo guardar y asociar el archivo.');
      expect(await readdir(path.join(config.uploadsDir, 'user-documents'))).to.deep.equal([]);
    } finally {
      await User.db.db.command({ collMod: collection, validator: {} });
    }
  });

  it('publica los campos multipart esperados en Swagger', async () => {
    const response = await api.get('/api/docs/openapi.json').expect(200);
    const spec = response.body;
    const user = spec.paths['/api/users/{id}/documents'].post.requestBody.content['multipart/form-data'].schema;
    const proof = spec.paths['/api/deliveries/{id}/proofs'].post.requestBody.content['multipart/form-data'].schema;
    expect(user.required).to.deep.equal(['file', 'documentType']);
    expect(user.properties.documentType.enum).to.deep.equal(['IDENTITY', 'LICENSE']);
    expect(proof.required).to.deep.equal(['file']);
    expect(proof.properties.file.format).to.equal('binary');
  });
});
