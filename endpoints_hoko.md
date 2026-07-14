# Documentación de la API de Hoko

Esta documentación detalla los endpoints de la API de **Hoko** para gestionar órdenes de venta, guías de envío, listados de ciudades y cotización de fletes.

---

## 0. Datos Base de Conexión

Hoko opera en dos entornos según el país de destino. Aunque los parámetros y servicios son idénticos, existen diferencias importantes en las transportadoras disponibles, listados de ciudades y el formato de la moneda (COP / USD).

| País | URL Base | Moneda |
| :--- | :--- | :--- |
| **Colombia** | `https://hoko.com.co/api` | COP |
| **Ecuador** | `https://hoko.com.ec/api` | USD |

### Autenticación
Los endpoints restringidos requieren un token de autenticación del tipo **Bearer Token** enviado en las cabeceras de la solicitud HTTP:
```http
Authorization: Bearer {tu_token_de_seguridad}
Accept: application/json
```

---

## 1. Endpoints de Órdenes (`Orders`)

### 1.1 Listado de Órdenes (List Orders)
Retorna todas las órdenes vinculadas a la tienda en formato paginado.

* **Método:** `GET`
* **Ruta:** `/member/order`
* **Query Params:**
  * `page` (opcional): Número de página para navegar los resultados (ej. `?page=2`).

#### Parámetros Importantes en la Respuesta:
* `id`: ID único de la orden.
* `delivery_state`: Estado de la orden (ver tabla de estados abajo).
* `cellar_id`: ID de la bodega.
* `courier_id`: ID de la transportadora.
* `warranty`: Tiempo de garantía de la orden de venta.
* `payment`: Tipo de pago. (`0` = Contraentrega / Recaudo, `1` = Crédito / Pago por adelantado).
* `measures`: Medidas físicas del paquete.
* `prev_page_url` / `next_page_url`: Enlaces para navegar entre páginas.

#### Estados de la Orden:
| Código | Estado |
| :---: | :--- |
| **1** | Creada |
| **2** | En proceso |
| **3** | Despachada |
| **4** | Finalizada |
| **5** | Cancelada |
| **6** | En Novedad |

> [!NOTE]
> Los estados de la orden son distintos a los estados de la guía. La guía se genera y vincula a la orden posteriormente.

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://hoko.com.co/api/member/order' \
--header 'Authorization: Bearer {tu_token}'
```

---

### 1.2 Detalle de Orden y Guía (Order by ID and Guide)
Obtiene los detalles actualizados de una orden en específico junto con los detalles de su guía de envío vinculada.

* **Método:** `GET`
* **Ruta:** `/member/order/{id}` (reemplazar `{id}` por el ID de la orden, ej: `/member/order/1`)

#### Parámetros Importantes de la Guía:
* `ID`: ID único de la guía.
* `number`: Número o referencia única de la guía de la transportadora.
* `state`: Código de estado de la guía.
* `total_freight_store`: Costo total de transporte para la tienda.

#### Estados de la Guía (Colombia):
| Código | Estado | Código | Estado |
| :---: | :--- | :---: | :--- |
| **0** | CANCELADA | **12** | EN PROCESAMIENTO |
| **1** | ACTIVA | **13** | RECIBIDO DEL CLIENTE |
| **2** | DESPACHADA | **14** | REDIRECCIONADO |
| **3** | ENTREGADA | **15** | EN ESPERA DE RUTA DOMESTICA |
| **4** | ANULADA | **16** | MERCANCIA RECOGIDA |
| **5** | GENERADA | **17** | PAGADO |
| **6** | EN NOVEDAD | **18** | ERROR POR SALDO |
| **7** | EN REPARTO | **19** | PAGADO A TIENDA |
| **8** | EN BODEGA | **20** | DEVOLUCION COBRADO |
| **9** | REEXPEDICIÓN | **21** | ERROR POR API |
| **10** | SOLUCIONADA EN MALLA | **22** | TRANSPORTADORA INVALIDA |
| **11** | DEVOLUCIÓN | | |

#### Estados de la Guía (Ecuador):
| Código | Estado | Código | Estado |
| :---: | :--- | :---: | :--- |
| **0** | CANCELADA | **8** | BODEGA |
| **1** | ACTIVA | **9** | TRANSITO |
| **2** | DESPACHADA | **11** | DEVOLUCION |
| **3** | ENTREGADA | **17** | PAGADO |
| **5** | GENERADA | **18** | SALDO INSUFICIENTE |
| **6** | NOVEDAD | **7** | REPARTO |

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://hoko.com.co/api/member/order/1' \
--header 'Authorization: Bearer {tu_token}'
```

---

### 1.3 Crear Orden V2 (Create Order)
Permite ingresar una nueva orden de venta al sistema utilizando los identificadores de **Stocks** (inventarios en bodegas) en lugar del ID general de producto.

* **Método:** `POST`
* **Ruta:** `/member/order/create`
* **Formato:** `multipart/form-data`

#### Reglas de Producto y Precios (Para el localizador GPS):
* **ID de Stock Activo:** `55134` (Accesorio localizador)
* **Precios Unitarios vigentes por cantidad comprada:**
  * **1 unidad:** `199,000 COP` por unidad.
  * **2 unidades:** `159,200 COP` por unidad.
  * **3 unidades:** `139,300 COP` por unidad.

> [!IMPORTANT]
> El parámetro `stocks` debe enviarse con el **precio unitario**, no con el valor total acumulado de la compra.

#### Parámetros del Formulario:

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :---: | :---: | :--- |
| **customer** | JSON String | **Sí** | Datos del destinatario: `{"name":"Juan Perez","email":"juan@correo.com", "identification":"12345678", "phone":"300000000","address":"Calle 123 #45-67", "city_id":"1"}` |
| **stocks** | JSON String | **Sí** | Mapeo de `stock_id` (ej: `"55134"`) con cantidad y precio unitario: `{"55134":{"amount":2,"price":159200}}` |
| **payment** | Integer | **Sí** | Tipo de pago: `0` = Contraentrega/Recaudo (Pending), `1` = Crédito/Pago anticipado (Paid) |
| **courier_id** | Integer | **Sí** | ID de la transportadora asociada (obtenida cotizando fletes) |
| **contain** | String | **Sí** | Descripción del contenido (ej: `"Accesorio localizador "`, máx. 39 caracteres) |
| **measures** | JSON String | **Sí** | Dimensiones y peso: `{"height":"10","width":"10","length":"10","weight":"1"}` |
| **declared_value**| String/Int | No | Valor declarado. Por defecto usar `"100000"`. Min: `10000` (COP) / `10` (USD) |
| **external_id** | String | No | ID de la orden en sistemas externos (ej: Shopify external_order_id). Máx. 24 caracteres |

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://hoko.com.co/api/member/order/create' \
--header 'Authorization: Bearer {tu_token}' \
--form 'customer="{\"name\":\"Nombre y apellido\",\"email\":\"email@prueba.com\", \"identification\":\"1120364446\", \"phone\":\"3008475970\",\"address\":\"carrera 85a # 47dd 49\", \"city_id\":\"1\"}"' \
--form 'stocks="{\"55134\":{\"amount\":2,\"price\":159200}}"' \
--form 'payment="0"' \
--form 'courier_id="44"' \
--form 'contain="Accesorio localizador "' \
--form 'measures="{\"height\":\"10\",\"width\":\"10\",\"length\":\"10\",\"weight\":\"1\"}"' \
--form 'declared_value="100000"' \
--form 'external_id="123456"'
```

---

### 1.4 Actualizar Orden (Update Order)
Permite actualizar información básica de envío de una orden existente que no tenga guía de envío generada ni esté en proceso.

* **Método:** `POST`
* **Ruta:** `/member/order/update/{id}`
* **Formato:** `application/x-www-form-urlencoded` o `multipart/form-data`

#### Parámetros del Cuerpo:
* `customer`: JSON String con la información actualizada del destinatario (ej. `{"name": "Julio Cesar", "email": "juliocesar@gmail.com", "identification": "", "phone": "3143646682", "address": "Diagonal 26b 16 15", "city_id": "3"}`).
* `contain`: Descripción del contenido (ej: `"gps"`).
* `measures`: Medidas y peso actualizados (ej: `{"height":"10","width":"10","length":"10","weight":"1"}`).

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://hoko.com.co/api/member/order/update/885974' \
--header 'Authorization: Bearer {tu_token}' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'customer={"name":"Julio Cesar Cañadas Cuesta","email":"juliocesarcanadas@gmail.com\",\"identification\":\"\",\"phone\":\"3143646682\",\"address\":\"Diagonal 26b 16 15, Barrio Cohimbra\",\"city_id\":\"3\"}' \
--data-urlencode 'contain=gps' \
--data-urlencode 'measures={"height":"10","width":"10","length":"10","weight":"1"}'
```

---

### 1.5 Cancelar Orden (Cancel Order)
Cancela una orden que no tenga guía de envío generada.

* **Método:** `POST`
* **Ruta:** `/member/order/cancel/{id}`

#### Ejemplo de Solicitud (cURL):
```bash
curl --location --request POST 'https://hoko.com.co/api/member/order/cancel/651462' \
--header 'Authorization: Bearer {tu_token}'
```

---

### 1.6 Generar Guía (Generate Guide)
Envía la solicitud a Hoko para generar la guía física de transporte.

* **Método:** `POST`
* **Ruta:** `/member/order/generate-guide/{id}`

#### Ejemplo de Respuesta (200 OK):
```json
{
  "status": "success",
  "code": "GUIDE_REQUESTED",
  "message": "Solicitud de generación de guia enviada correctamente"
}
```

---

## 2. Endpoints de Ciudades y Cotizaciones (`Cities & Quotations`)

### 2.1 Obtener IDs de Ciudades (Get Cities)
Retorna la lista de ciudades disponibles en Hoko para realizar búsquedas del `city_id` del cliente.

* **Método:** `GET`
* **Ruta:** `https://v4.hoko.com.co/api/member/get-cities`

> [!NOTE]
> Este endpoint utiliza el subdominio **`v4.hoko.com.co`** en lugar del dominio estándar. Requiere cabecera de autenticación.

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://v4.hoko.com.co/api/member/get-cities' \
--header 'Authorization: Bearer {tu_token}'
```

---

### 2.2 Cotizar Envío (Quote Shipping)
Permite consultar los costos de envío y las transportadoras disponibles para un destino y stock específicos.

* **Método:** `POST`
* **Ruta:** `/member/stock/quotation`
* **Formato:** `application/json` o `application/x-www-form-urlencoded`

#### Parámetros del Cuerpo:
* `stock_ids`: Identificador del stock (ej: `"55134"`).
* `city_to`: ID de la ciudad destino (obtenido desde el endpoint de ciudades).
* `payment`: Tipo de pago (`0` = Contraentrega / Pending, `1` = Crédito / Paid).
* `declared_value`: Valor declarado para asegurar el envío (ej: `"10000"`).
* `width`: Ancho en cm (ej: `10`).
* `height`: Alto en cm (ej: `10`).
* `length`: Largo en cm (ej: `10`).
* `weight`: Peso en kg (ej: `1`).

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://hoko.com.co/api/member/stock/quotation' \
--header 'Authorization: Bearer {tu_token}' \
--header 'Content-Type: application/json' \
--data '{
    "stock_ids": "55134",
    "city_to": "3",
    "payment": 0,
    "declared_value": "10000",
    "width": "10",
    "height": "10",
    "length": "10",
    "weight": "1"
}'
```

---

## 3. Endpoints de Inventarios y Productos (`Stocks & Products`)

### 3.1 Listar Stocks (List Stocks)
Retorna todos los stocks vinculados a la tienda.

* **Método:** `POST`
* **Ruta:** `/member/stock/list`
* **Formato:** `multipart/form-data` o `application/json`
* **Parámetros:**
  * `search` (opcional): Filtra coincidencias por texto de búsqueda.
  * `category` (opcional): Filtra resultados por ID de categoría.
  * `sortBy` (opcional): Criterio de ordenamiento:
    * `1` => Más reciente
    * `2` => Más antiguo
    * `3` => Precio (de mayor a menor)
    * `4` => Precio (de menor a mayor)
    * `5` => Más Vendido
    * `6` => Mayor Stock
    * `7` => Menor Stock
  * `stockID` (opcional): Filtra la búsqueda por número de stock similar.

#### Parámetros Importantes en la Respuesta:
* `id`: ID del stock único (usado al crear la orden).
* `product_id`: ID del producto vinculado.
* `amount`: Cantidad de stock disponible en bodega.
* `minimal_price`: Precio mínimo de venta.
* `price_by_unit`: Precio sugerido de venta.
* `measures`: Medidas físicas del paquete.

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://hoko.com.co/api/member/stock/list' \
--form 'search="landing"' \
--form 'category="8"' \
--form 'sortBy="1"' \
--form 'stockID="5424"'
```

---

### 3.2 Obtener Stock por ID (Stock by ID)
Obtiene la información principal de un stock, del producto y de las transportadoras vinculadas a la bodega del stock.

* **Método:** `GET`
* **Ruta:** `/member/stock/detail`
* **Query Params:**
  * `id` (obligatorio): ID del stock que se desea consultar.

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://hoko.com.co/api/member/stock/detail?id=20'
```

---

### 3.3 Listar Productos (List Products)
Retorna todos los productos vinculados a la tienda.

* **Método:** `GET`
* **Ruta:** `/member/product/list`

#### Parámetros Importantes en la Respuesta:
* `tax`: Tipo de impuesto:
  * **Colombia:** `1` => IVA 19%, `2` => IVA exento, `3` => IVA 5%, `4` => IVA excluido.
  * **Ecuador:** `1` => IVA 12%, `2` => IVA exento.
* `cost`: Costo del producto.
* `minimal_price`: Precio mínimo de venta.
* `price_by_amount`: Precio mayorista.
* `price_dropshipping`: Precio dropshipping.
* `price_by_unit`: Precio sugerido de venta.

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://hoko.com.co/api/member/product/list'
```

---

### 3.4 Crear Producto (Create Product)
Crea y asigna un nuevo producto en la bodega primaria de la tienda. Todos los campos son obligatorios.

* **Método:** `POST`
* **Ruta:** `/member/product/create`
* **Formato:** `multipart/form-data`
* **Parámetros:**
  * `name`: Nombre del producto (máx. 255 caracteres).
  * `reference`: Código de referencia alfanumérico sin espacios (máx. 255 caracteres).
  * `description`: Descripción larga del producto.
  * `warranty`: Términos de garantía (máx. 255 caracteres).
  * `height` / `width` / `length` / `weight`: Medidas físicas (enteros).
  * `cost` / `minimal_price` / `price_by_amount` / `price_dropshipping` / `price_by_unit`: Precios (decimales).
  * `tax`: Tipo de impuesto (entero según país).
  * `stock`: Cantidad inicial mayor a 0 (entero).

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://hoko.com.co/api/member/product/create' \
--form 'name="Producto de prueba"' \
--form 'reference="abc123"' \
--form 'description="Esto es una prueba"' \
--form 'warranty="30 dias"' \
--form 'height="10"' \
--form 'width="15"' \
--form 'length="5"' \
--form 'weight="1"' \
--form 'cost="20.5"' \
--form 'minimal_price="50"' \
--form 'price_by_amount="40"' \
--form 'price_dropshipping="55.7"' \
--form 'price_by_unit="75"' \
--form 'tax="1"' \
--form 'stock="1"'
```

---

### 3.5 Actualizar Producto (Update Product)
Realiza la actualización de un producto vinculado a la tienda.

* **Método:** `GET` / `POST`
* **Ruta:** `/member/product/update`
* **Query Params:** Todos los campos de creación son obligatorios (ej. `?product_id=1&name=...&reference=...`).

#### Ejemplo de Solicitud (cURL):
```bash
curl --location 'https://hoko.com.co/api/member/product/update?product_id=1&name=Producto%20de%20prueba&reference=abc123&description=Esto%20es%20una%20prueba&warranty=30%20dias&height=10&width=15&length=5&weight=1&cost=20.5&minimal_price=50&price_by_amount=40&price_dropshipping=55.7&price_by_unit=75&tax=1&stock=1'
```

---

### 3.6 Eliminar Producto (Delete Product)
Elimina un producto. Acción irreversible.

* **Método:** `DELETE`
* **Ruta:** `/member/product/delete`
* **Query Params:**
  * `product_id`: ID del producto que se desea borrar.

#### Ejemplo de Solicitud (cURL):
```bash
curl --location --request DELETE 'https://hoko.com.co/api/member/product/delete?product_id=1'
```

