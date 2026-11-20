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
