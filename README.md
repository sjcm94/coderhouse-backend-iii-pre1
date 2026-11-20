# ShipNow · Pre-entrega del Módulo 2

API de productos y usuarios hecha con Node.js, Express y MongoDB. Incluye un módulo para generar y cargar datos de prueba.

## Correr el proyecto localmente

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

## Probar los mocks

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
