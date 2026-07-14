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
