# ShipNow · Pre-entrega del Módulo 1

API de productos y usuarios hecha con Node.js, Express y MongoDB.

## Correr el proyecto localmente

1. Instala Node.js 20 o superior y ten una instancia de MongoDB en ejecución.
2. Abre una terminal en la carpeta del proyecto y ejecuta `npm ci`.
3. Copia `.env.example` como `.env`. Para una base local de prueba, puedes usar esta configuración:

   ```dotenv
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/shipnow
   NODE_ENV=development
   ```

4. Ejecuta `npm start`. Con el puerto del ejemplo, la API queda en `http://localhost:3000`.

La app valida las tres variables al arrancar. Si quieres comprobarlo, borra temporalmente `MONGODB_URI` de tu `.env` y ejecuta `npm start`. Aparecerá un mensaje indicando qué variable falta y el servidor HTTP no se iniciará.

## Endpoints

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

## Por qué separé las capas

El Router conecta cada ruta con su Controller. El Controller lee la petición, llama al Service y envía la respuesta con su código HTTP.

En el Service dejé las reglas del negocio. Por ejemplo, ahí decido el estado del producto a partir del stock, filtro el listado y asigno el rol inicial a los usuarios. En el Repository dejé las consultas de Mongoose, el orden y los campos que se devuelven. Así puedo cambiar la consulta sin tocar la regla de stock. Los modelos solo definen los esquemas.
