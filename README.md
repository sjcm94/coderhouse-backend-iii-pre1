# ShipNow Pruebas

## Módulo 1 | Estructura profesional de ShipNow

API de productos y usuarios hecha con Node.js, Express y MongoDB.

### Correr el proyecto localmente

1. Instala Node.js 20 o superior y ten una instancia de MongoDB en ejecución.
2. Abre una terminal en la carpeta del proyecto y ejecuta `npm ci`.
3. Copia `.env.example` como `.env`. Para una base local de prueba, puedes usar esta configuración:

   ```dotenv
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/shipnow_pruebas
   NODE_ENV=development
   ```

4. Ejecuta `npm start`. Con el puerto del ejemplo, la API queda en `http://localhost:3000`.

La app valida las tres variables al arrancar. Si quieres comprobarlo, borra temporalmente `MONGODB_URI` de tu `.env` y ejecuta `npm start`. Aparecerá un mensaje indicando qué variable falta y el servidor HTTP no se iniciará.

### Endpoints

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/products` | Lista de productos con stock (200). |
| POST | `/api/products` | Crea un producto (201). |
| GET | `/api/users` | Lista de usuarios (200). |
| POST | `/api/users` | Crea un usuario con el rol `USER` (201). |

Para enviar un POST, selecciona JSON como tipo de contenido (`Content-Type: application/json`).

- Producto: `{"name":"Caja mediana","price":12.5,"stock":3}`
- Usuario: `{"name":"Ana Pérez","email":"ana@example.com"}`

Los datos inválidos devuelven 400. Un correo duplicado devuelve 409. Un producto con stock cero se guarda con estado `OUT_OF_STOCK` y queda fuera del listado.

### Por qué separé las capas

El Router conecta cada ruta con su Controller. El Controller lee la petición, llama al Service y envía la respuesta con su código HTTP.

En el Service dejé las reglas del negocio. Por ejemplo, ahí decido el estado del producto a partir del stock, filtro el listado y asigno el rol inicial a los usuarios. En el Repository dejé las consultas de Mongoose, el orden y los campos que se devuelven. Así puedo cambiar la consulta sin tocar la regla de stock. Los modelos solo definen los esquemas.

## Módulo 2 | Mocking y carga de datos de prueba

Este módulo permite generar y cargar datos de prueba.

### Probar los mocks

Con el servidor encendido, puedes abrir los GET en el navegador. Para el POST, usa Postman o envía el método POST desde la terminal. Usa una base de prueba, como `shipnow_pruebas` en el ejemplo de configuración.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/mocks/users?qty=2` | Genera dos usuarios, un cliente y un repartidor. Devuelve `nombre`, `email` y `rol`. |
| GET | `/api/mocks?qty=3` | Genera tres clientes, tres repartidores, tres pedidos y tres entregas relacionados. Devuelve los campos de los modelos y sus IDs. |
| POST | `/api/mocks/seed?qty=10` | Guarda 10 usuarios con roles de cliente y repartidor. |
| POST | `/api/mocks/seed?qty=3&collection=all` | Guarda un lote relacionado de 12 registros, tres por tipo. |

Los GET no guardan datos. Cada POST genera un lote nuevo, responde con el código 201 y devuelve la cantidad guardada. Por ejemplo, al ejecutar:

```bash
curl -X POST "http://localhost:3000/api/mocks/seed?qty=10"
```

La respuesta es:

```json
{ "insertados": 10, "coleccion": "usuarios" }
```

En PowerShell puedes usar `curl.exe` en el mismo comando. Si omites `qty`, se usa 10. Solo se aceptan enteros de 1 a 100. El POST permite `collection=users` (por defecto) y `collection=all`. Los parámetros inválidos devuelven 400 y en producción la carga devuelve 403.

Los repartidores se guardan en `users` con el rol `DRIVER` y los clientes con `USER`. Cada pedido apunta a un cliente por `userId`. Cada entrega apunta a un pedido por `orderId` y, cuando se asigna, a un repartidor por `driverId`. El Service genera los datos y sus relaciones usando las constantes del proyecto. El Repository guarda el lote en MongoDB.

## Módulo 3 | Manejo profesional de errores

Los servicios lanzan un `AppError` cuando detectan un caso como un correo duplicado o una cantidad de mocks inválida. El diccionario en `src/errors/dictionary.js` asocia cada código con su mensaje y su estado HTTP. Express 5 envía los errores de controladores síncronos y asíncronos al middleware global en `src/middlewares/error.middleware.js`. El middleware también maneja rutas inexistentes, JSON inválido y errores inesperados.

El cuerpo de error siempre tiene el objeto `error` con `code` y `message`. Por ejemplo, al llamar a `GET /api/mocks/users?qty=-1`, la API devuelve HTTP 400:

```json
{
  "error": {
    "code": "INVALID_MOCK_QUANTITY",
    "message": "qty debe ser un número entero entre 1 y 100."
  }
}
```

### Probar los errores

Con el servidor encendido, abre los GET en el navegador o usa Postman para revisar el código HTTP y el JSON. Envía los POST de Productos y Usuarios con `Content-Type: application/json`.

| Prueba | HTTP | Código de error |
| --- | --- | --- |
| GET `/api/mocks/users?qty=-1` o `/api/mocks?qty=101` | 400 | `INVALID_MOCK_QUANTITY` |
| POST `/api/mocks/seed?qty=0` o `/api/mocks/seed?qty=2.5` | 400 | `INVALID_MOCK_QUANTITY` |
| POST `/api/mocks/seed?qty=2&collection=orders` | 400 | `INVALID_MOCK_COLLECTION` |
| POST `/api/mocks/seed?qty=2` con el servidor iniciado en `NODE_ENV=production` | 403 | `MOCK_SEED_FORBIDDEN` |
| POST `/api/users` con un correo inválido | 400 | `INVALID_EMAIL` |
| POST `/api/users` dos veces con el mismo correo válido | 409 en el segundo POST | `EMAIL_ALREADY_EXISTS` |
| POST `/api/products` con nombre, precio válido y stock `-1` | 400 | `INVALID_PRODUCT_STOCK` |
| POST `/api/users` con un cuerpo JSON incompleto, como `{` | 400 | `INVALID_JSON` |
| GET `/api/ruta-inexistente` | 404 | `ROUTE_NOT_FOUND` |

Si la generación o la escritura de un lote falla durante un POST de mocks, la API responde HTTP 500 con el código `MOCK_SEED_FAILED`. La respuesta pública contiene un mensaje general. El repositorio intenta limpiar los registros del lote si una escritura falla.

## Módulo 4 | Logging y monitoreo básico

ShipNow usa Winston. La configuración está en `src/config/logger.js`. Cada línea incluye fecha, hora, nivel y mensaje. Los logs registran el arranque, la conexión a MongoDB, las solicitudes HTTP, la generación y carga de mocks y los errores capturados por el middleware del Módulo 3.

| Nivel | Uso |
| --- | --- |
| `debug` | Diagnóstico en desarrollo. |
| `http` | Método, ruta, estado HTTP y duración de la solicitud. |
| `info` | Arranque, conexión y operaciones exitosas. |
| `warning` | Errores esperados, como una cantidad de mocks inválida o una ruta inexistente. |
| `error` | Fallas de servidor, como un error al guardar un lote en MongoDB. |
| `fatal` | Fallas que impiden el arranque. |

En `development` y `test`, la consola muestra los seis niveles. En `production` muestra `info`, `warning`, `error` y `fatal`. En los tres entornos, `logs/error.log` guarda solo `error` y `fatal`. Winston rota el archivo por tamaño, cerca de 1 MiB, y conserva hasta tres archivos en total, incluido el actual. `.gitignore` excluye toda la carpeta `logs/`.

### Probar el logger

1. Configura `NODE_ENV=development` en `.env` y ejecuta `npm start`.
2. Abre `http://localhost:3000/api/logger/test` o envía un GET desde Postman. La API responde 200 y la terminal muestra un mensaje de prueba por cada nivel. La prueba de nivel `fatal` registra un mensaje y el servidor sigue atendiendo solicitudes.
3. Abre `logs/error.log`. De esa prueba solo deben aparecer las líneas `[error]` y `[fatal]`.
4. Abre `http://localhost:3000/api/mocks/users?qty=-1`. Recibirás el HTTP 400 del Módulo 3 y verás un `[warning]` en la terminal.

La ruta de prueba está habilitada en `development` y `test`. En producción devuelve HTTP 404.

## Módulo 5 | Documentación de API con Swagger

Levanta el servidor con `npm ci`, tu archivo `.env` y `npm start`, como se explica en el Módulo 1. Abre **http://localhost:3000/api/docs/** con el puerto de tu configuración. El documento OpenAPI está disponible en `/api/docs/openapi.json`.

Swagger agrupa los endpoints en **Users, Orders, Deliveries, Mocks, Logger y Products**. En cada operación, usa **Try it out** y luego **Execute** para enviar una solicitud y revisar el código HTTP y la respuesta. Selecciona el servidor actual si usas un puerto distinto del ejemplo.

### Probar pedidos, entregas y errores

1. En **Mocks**, ejecuta `POST /api/mocks/seed` con `qty=3` y `collection=all`. Deja el body vacío. La carga está habilitada en desarrollo y pruebas.
2. En **Orders** o **Deliveries**, ejecuta el listado y copia un `_id` para probar la consulta por ID. Puedes filtrar ambos listados con `status`. Los pedidos generados incluyen un item de ejemplo.
3. Para ver `INVALID_STATUS` (400), prueba `GET /api/orders?status=invalido` o `GET /api/deliveries?status=invalido` en el navegador. Swagger ofrece solo estados válidos en el selector.
4. Para ver `INVALID_MOCK_QUANTITY` (400), prueba `GET /api/mocks/users?qty=-1`. Para los seis niveles de logs, ejecuta `GET /api/logger/test` en `development` o `test`.

Los GET de Mocks generan vistas previas. Para consultar pedidos y entregas en MongoDB, usa los IDs que aparecen en los listados después de la carga.

## Módulo 6 | Testing funcional con Mocha, Chai y Supertest

La suite usa **Mocha** para ejecutar las pruebas, **Chai** para validar los cuerpos de respuesta y **Supertest** para enviar solicitudes al importar `src/app.js`. Para correrla, ejecuta `npm ci` y luego `npm test`. No hace falta iniciar ShipNow ni elegir un puerto para las solicitudes de prueba.

### Base de datos y entorno de testing

- Usa una instancia de MongoDB local o dedicada a pruebas. Por defecto la suite conecta a `mongodb://127.0.0.1:27017`.
- Si usas otra instancia, copia `.env.test.example` como `.env.test` y define `TEST_MONGODB_URI` con su URI. También puedes suministrar esa variable en la terminal.
- El script establece `NODE_ENV=test` y crea una base temporal con un nombre que comienza con `shipnow_test_`. El nombre se genera en cada ejecución, aunque la URI incluya otro nombre de base. La cuenta de MongoDB debe permitir crear y eliminar esa base temporal.
- Los hooks limpian las colecciones de prueba antes de cada caso, eliminan la base temporal al terminar y cierran la conexión. La suite genera sus propios usuarios, pedidos y mocks.

### Qué se prueba

Se prueban los listados de usuarios y productos, la creación y consulta de pedidos, las entregas, los filtros de estado, la generación y carga de mocks, el endpoint de logger, Swagger y el formato común de errores. Los casos negativos validan el código HTTP, el código interno y el mensaje.

La creación se prueba con `POST /api/orders`. El body incluye `userId` de un cliente existente e `items` con nombre y cantidad de cada artículo. El pedido se crea en `PENDING` y admite `priority` opcional. El filtro por estado se prueba en los listados. Swagger incluye el contrato del POST y sus errores.

## Módulo 7 | Carga de archivos, documentos y comprobantes

La API recibe un archivo en el campo `file` como `multipart/form-data`. Acepta PDF, JPEG y PNG de hasta 2 MiB. Multer valida el campo, el tamaño y el tipo declarado, y el servicio comprueba la firma inicial del archivo.

| Endpoint | Campos del formulario | Carpeta |
| --- | --- | --- |
| `POST /api/users/{id}/documents` | `file` y `documentType` con valor `IDENTITY` o `LICENSE`. | `uploads/user-documents/` o `uploads/licenses/` |
| `POST /api/deliveries/{id}/proofs` | `file`. La API asigna el tipo `DELIVERY_PROOF`. | `uploads/delivery-proofs/` |

### Cómo probar las cargas

1. Inicia la API y abre `http://localhost:3000/api/docs/`. Para un documento, crea un usuario en **Users** y copia su `_id`. Para un comprobante, carga un lote en **Mocks** con `qty=1` y `collection=all`, lista las entregas y copia el `_id` de una.
2. En la operación de carga en Swagger, pulsa **Try it out**, completa el ID y elige un archivo de prueba. Para un documento, elige también `IDENTITY` o `LICENSE`. En Postman, usa **Body → form-data** y marca `file` como tipo **File**.
3. El HTTP 201 devuelve el usuario con `documents` o la entrega con `proofs`. Cada registro contiene el nombre original y generado, la ruta relativa, el MIME, el tamaño en bytes, el tipo de documento y la fecha de carga. MongoDB guarda esos metadatos. El contenido del archivo queda en disco.

Los errores usan `{ error: { code, message } }`. Prueba sin archivo o con un campo incorrecto para obtener 400, con un ID inexistente para obtener 404, con un archivo demasiado grande para obtener 413 o con un tipo de archivo no permitido para obtener 415. El logger registra las asociaciones exitosas y los errores de carga.

La carpeta `uploads/` se crea al guardar el primer archivo y queda fuera de Git. Si necesitas otro directorio en tu entorno, define el valor opcional `UPLOADS_DIR` en `.env`. `npm test` ejecuta los casos de carga en una carpeta temporal que se limpia durante la suite.

## Módulo 8 | Performance, escalabilidad y Docker

Los listados de usuarios, productos, pedidos y entregas aceptan `page` (1 a 1000) y `limit` (1 a 100). Por defecto devuelven la primera página con hasta 20 registros y mantienen el formato de lista. Por ejemplo, `GET /api/orders?page=2&limit=10&status=PENDING` aplica el filtro y la paginación en MongoDB. Un parámetro inválido devuelve 400 con `INVALID_PAGINATION`.

Los listados usan proyecciones e índices. El catálogo filtra el stock en MongoDB. Las cargas mantienen un máximo de 2 MiB por archivo y se validan antes de escribir a disco. Los adjuntos se conservan mientras estén asociados a su entidad. Si dejas de necesitarlos, revisa conjuntamente el archivo y sus metadatos antes de retirarlos.

### Variables y ejecución local

Copia `.env.example` a `.env`, configura las variables y ejecuta `npm ci` y `npm start`. Para ejecutar la suite, usa `npm test` con el entorno y MongoDB de pruebas del Módulo 6.

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto HTTP obligatorio. El ejemplo usa `3000`. |
| `MONGODB_URI` | URI obligatoria de MongoDB. Usa una base distinta por entorno. |
| `NODE_ENV` | Obligatoria. Acepta `development`, `test` o `production`. |
| `LOG_LEVEL` | Umbral opcional de consola. Por defecto `debug` en desarrollo y pruebas e `info` en producción. El archivo conserva solo `error` y `fatal`. |
| `SWAGGER_ENABLED` | Opcional. Acepta `true` o `false`. |
| `UPLOADS_DIR` | Ruta opcional de almacenamiento. Por defecto usa la carpeta `uploads/` del proyecto. |
| `TEST_MONGODB_URI` | URI de la instancia para `npm test`, configurada en `.env.test` o en la terminal. |

MongoDB es el único servicio externo de esta versión. La API del proyecto aún funciona sin JWT. Si falta una variable obligatoria o su valor es inválido, ShipNow interrumpe el arranque con un mensaje de error.

### Health check y rutas internas

- `GET /api/health` informa el estado del proceso, el entorno, el uptime en segundos y la fecha. Es una comprobación de que la API responde y no consulta MongoDB.
- En `development` y `test` están disponibles las rutas de mocks y la prueba de logger. En `production`, los GET de mocks y `/api/logger/test` devuelven 404, y la carga `POST /api/mocks/seed` devuelve 403.
- Swagger está en `/api/docs/`, con su JSON en `/api/docs/openapi.json`. Por defecto se habilita en desarrollo y pruebas. En producción devuelve 404 salvo que actives `SWAGGER_ENABLED=true` para una revisión controlada.

### Construir y ejecutar con Docker

Desde la raíz del repo, construye la imagen:

```bash
docker build -t shipnow-api .
```

Para una prueba con MongoDB en otro contenedor, crea una red y levanta una base de prueba en esa red. Su puerto queda dentro de Docker.

```bash
docker network create shipnow-net
docker run -d --name shipnow-mongo --network shipnow-net -v shipnow-mongo-data:/data/db mongo:7
```

Cuando MongoDB esté listo, crea un archivo local `.env.docker` para esta prueba:

```dotenv
PORT=3000
MONGODB_URI=mongodb://shipnow-mongo:27017/shipnow_pruebas
NODE_ENV=production
LOG_LEVEL=info
SWAGGER_ENABLED=true
```

Ejecuta la API con ese archivo. El puerto se publica en tu equipo, y los volúmenes conservan los logs y adjuntos al reemplazar el contenedor:

```bash
docker run --rm --name shipnow-api --network shipnow-net --env-file .env.docker -p 127.0.0.1:3000:3000 -v shipnow-logs:/app/logs -v shipnow-uploads:/app/uploads shipnow-api
```

Abre `http://localhost:3000/api/health`, `http://localhost:3000/api/users` y `http://localhost:3000/api/docs/` para comprobar el contenedor. Si cambias `PORT`, ajusta el puerto interno de `-p`. Con una instancia de MongoDB accesible desde Docker, usa su URI en `.env.docker` y omite el contenedor de MongoDB del ejemplo.

La imagen instala las dependencias de ejecución desde el lockfile y ejecuta `src/server.js`, el mismo punto de entrada de `npm start`. Docker ejecuta el proceso como usuario `node` y usa `/api/health` para la comprobación de salud. Consulta la consola con `docker logs shipnow-api`. Los logs de error rotan en `/app/logs`; los adjuntos quedan en `/app/uploads`.

El repo excluye `node_modules/`, archivos de entorno reales, `logs/`, `uploads/` y `coverage/`. `.dockerignore` también excluye estos archivos del contexto de construcción, junto con `.git`, tests y archivos temporales.
