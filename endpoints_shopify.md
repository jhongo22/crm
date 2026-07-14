# Documentación de la API de Shopify — Telocalizo

**Versión de API vigente: `2026-07`** (estable, más reciente disponible en julio 2026)
Próxima versión: `2026-10` (release candidate, aún no recomendada para producción)

---

## 0. Datos base de conexión

| Campo                | Valor                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| Dominio de la tienda | `telocalizo-tags.myshopify.com`                                        |
| Base GraphQL         | `https://telocalizo-tags.myshopify.com/admin/api/2026-07/graphql.json` |
| Base REST            | `https://telocalizo-tags.myshopify.com/admin/api/2026-07`              |
| Header auth          | `X-Shopify-Access-Token: {access_token}`                               |
| Content-Type         | `application/json`                                                     |

Shopify libera una versión nueva cada 3 meses (enero, abril, julio, octubre). Cada versión estable se soporta mínimo 12 meses. Conviene fijar la versión explícitamente en la URL (no usar `unstable` en producción) y planear la migración a `2026-10` quien la vaya adoptando cuando salga de release candidate.

---

## 1. API GraphQL (recomendada)

### 1.1 Queries de pedidos

#### A. Listado de pedidos (`orders`)

```graphql
query getOrders($first: Int, $query: String) {
  orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
    edges {
      node {
        id
        name
        createdAt
        displayFinancialStatus
        displayFulfillmentStatus
        totalPriceSet {
          presentmentMoney {
            amount
            currencyCode
          }
        }
        customer {
          firstName
          lastName
          email
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Filtros útiles en `query`: `financial_status:paid`, `fulfillment_status:unfulfilled`, `created_at:>=2026-01-01`, `status:open`, `tag:'nano-track'`.

#### B. Detalle de un pedido (`order`)

```graphql
query getOrderDetails($id: ID!) {
  order(id: $id) {
    id
    name
    note
    createdAt
    displayFinancialStatus
    displayFulfillmentStatus
    shippingAddress {
      address1
      city
      province
      zip
      country
    }
    lineItems(first: 50) {
      edges {
        node {
          title
          quantity
          sku
        }
      }
    }
  }
}
```

### 1.2 Mutaciones de pedidos

| Mutación                                                                              | Uso                                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `orderMarkAsPaid`                                                                     | Marca un pedido como pagado manualmente                       |
| `orderClose`                                                                          | Cierra (archiva) un pedido                                    |
| `orderOpen`                                                                           | Reabre un pedido cerrado                                      |
| `orderCancel`                                                                         | Cancela un pedido (con `reason`, `refund`, `restock`)         |
| `orderUpdate`                                                                         | Edita campos como notas, tags, dirección de envío             |
| `orderCapture`                                                                        | Captura un pago autorizado previamente                        |
| `orderCreate`                                                                         | Crea un pedido manualmente vía API (draft-to-order o directo) |
| `orderInvoiceSend`                                                                    | Reenvía la factura del pedido al cliente                      |
| `orderEditBegin` / `orderEditAddVariant` / `orderEditSetQuantity` / `orderEditCommit` | Flujo para editar líneas de un pedido ya existente            |
| `orderRiskAssessmentCreate`                                                           | Agrega una evaluación de riesgo de fraude al pedido           |

```graphql
mutation cancelOrder(
  $orderId: ID!
  $reason: OrderCancelReason!
  $refund: Boolean!
  $restock: Boolean!
) {
  orderCancel(
    orderId: $orderId
    reason: $reason
    refund: $refund
    restock: $restock
    notifyCustomer: true
  ) {
    job {
      id
      done
    }
    userErrors {
      field
      message
    }
  }
}
```

```graphql
mutation markAsPaid($id: ID!) {
  orderMarkAsPaid(input: { id: $id }) {
    order {
      id
      displayFinancialStatus
    }
    userErrors {
      field
      message
    }
  }
}
```

### 1.3 Fulfillment Orders (unidad moderna de preparación)

Desde hace varias versiones, Shopify separó la preparación logística en **FulfillmentOrder** (la "orden de trabajo" para un local/servicio) y **Fulfillment** (el envío ya ejecutado). Todo pedido nuevo genera automáticamente uno o más `FulfillmentOrder`.

#### Queries

- `fulfillmentOrders(first, query, includeClosed, sortKey)` — lista todas las fulfillment orders visibles según los scopes de la app.
- `assignedFulfillmentOrders` — solo las asignadas a las ubicaciones/servicio de tu app.
- `fulfillmentOrder(id)` — detalle puntual.

```graphql
query listOpenFulfillmentOrders($first: Int, $query: String) {
  fulfillmentOrders(first: $first, query: $query) {
    nodes {
      id
      status
      requestStatus
      order {
        name
      }
      assignedLocation {
        name
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### Mutaciones del ciclo de vida de una Fulfillment Order

| Mutación                                     | Qué hace                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `fulfillmentOrderAccept`                     | Acepta una solicitud de preparación entrante                                  |
| `fulfillmentOrderReject`                     | Rechaza la solicitud                                                          |
| `fulfillmentOrderClose`                      | Cierra la fulfillment order (ya no se puede seguir preparando)                |
| `fulfillmentOrderCancel`                     | Cancela la fulfillment order                                                  |
| `fulfillmentOrderHold`                       | Pone la orden en espera (`ON_HOLD`)                                           |
| `fulfillmentOrderReleaseHold`                | Libera un hold específico (recomendado sobre el REST `release_hold` genérico) |
| `fulfillmentOrderMove`                       | Mueve la orden a otra ubicación                                               |
| `fulfillmentOrderMerge`                      | Fusiona varias fulfillment orders compatibles                                 |
| `fulfillmentOrderSplit`                      | Divide líneas de una fulfillment order en varias                              |
| `fulfillmentOrderLineItemsPreparedForPickup` | Marca líneas como listas para retiro en tienda                                |
| `fulfillmentOrderSubmitFulfillmentRequest`   | Envía la solicitud de preparación a un servicio externo                       |
| `fulfillmentOrderSubmitCancellationRequest`  | Solicita cancelar una preparación ya enviada a un servicio externo            |
| `fulfillmentOrderRescheduleFulfillment`      | Reprograma la fecha estimada de preparación (`new_fulfill_at`)                |

### 1.4 Fulfillments (envío ejecutado) y tracking

```graphql
mutation createFulfillment($fulfillment: FulfillmentV2Input!) {
  fulfillmentCreateV2(fulfillment: $fulfillment) {
    fulfillment {
      id
      status
      trackingInfo {
        number
        url
        company
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

Variables ejemplo:

```json
{
  "fulfillment": {
    "lineItemsByFulfillmentOrder": [
      { "fulfillmentOrderId": "gid://shopify/FulfillmentOrder/1234567" }
    ],
    "trackingInfo": {
      "number": "1Z999AA10123456784",
      "url": "https://tracking.example.com/1Z999AA10123456784",
      "company": "UPS"
    },
    "notifyCustomer": true
  }
}
```

| Mutación                          | Uso                                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `fulfillmentCreateV2`             | Crea el fulfillment (reemplaza a `fulfillmentCreate`, que sigue existiendo pero es la versión previa) |
| `fulfillmentTrackingInfoUpdateV2` | Actualiza número de guía / transportadora de un fulfillment ya creado                                 |
| `fulfillmentCancel`               | Cancela un fulfillment ya creado                                                                      |
| `fulfillmentEventCreate`          | Agrega un evento de tracking manual (ej. "en tránsito", "entregado")                                  |

---

## 2. API REST (alternativa, sigue vigente)

Base: `https://telocalizo-tags.myshopify.com/admin/api/2026-07`

### 2.1 Pedidos (`Order`)

| Método | Path                             | Uso                                                                                                |
| ------ | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | `/orders.json`                   | Listar pedidos (`limit`, `status`, `financial_status`, `fulfillment_status`, `created_at_min/max`) |
| GET    | `/orders/{order_id}.json`        | Obtener un pedido                                                                                  |
| GET    | `/orders/count.json`             | Contar pedidos según filtros                                                                       |
| PUT    | `/orders/{order_id}.json`        | Actualizar campos (notas, tags, etc.)                                                              |
| POST   | `/orders/{order_id}/close.json`  | Cerrar pedido                                                                                      |
| POST   | `/orders/{order_id}/open.json`   | Reabrir pedido                                                                                     |
| POST   | `/orders/{order_id}/cancel.json` | Cancelar pedido                                                                                    |
| DELETE | `/orders/{order_id}.json`        | Eliminar pedido (solo si no tiene pagos ni fulfillments)                                           |
| GET    | `/orders/{order_id}/risks.json`  | Evaluaciones de riesgo/fraude                                                                      |

### 2.2 Fulfillment Orders

| Método | Path                                         | Uso                                                                              |
| ------ | -------------------------------------------- | -------------------------------------------------------------------------------- |
| GET    | `/orders/{order_id}/fulfillment_orders.json` | Fulfillment orders de un pedido                                                  |
| GET    | `/fulfillment_orders/{id}.json`              | Detalle                                                                          |
| GET    | `/assigned_fulfillment_orders.json`          | Asignadas a tu app/ubicación                                                     |
| POST   | `/fulfillment_orders/{id}/cancel.json`       | Cancelar                                                                         |
| POST   | `/fulfillment_orders/{id}/close.json`        | Cerrar                                                                           |
| POST   | `/fulfillment_orders/{id}/hold.json`         | Poner en espera                                                                  |
| POST   | `/fulfillment_orders/{id}/release_hold.json` | Liberar espera (usa la mutación GraphQL si necesitas liberar un hold específico) |
| POST   | `/fulfillment_orders/{id}/move.json`         | Mover a otra ubicación                                                           |
| POST   | `/fulfillment_orders/{id}/reschedule.json`   | Reprogramar fecha de preparación (`new_fulfill_at`)                              |

Ejemplo real (formato vigente 2026-07):

```
POST https://telocalizo-tags.myshopify.com/admin/api/2026-07/fulfillment_orders/1046000821/cancel.json
Body: {}
```

### 2.3 Fulfillments y tracking

| Método | Path                                                           | Uso                                          |
| ------ | -------------------------------------------------------------- | -------------------------------------------- |
| GET    | `/fulfillment_orders/{fulfillment_order_id}/fulfillments.json` | Listar fulfillments de una fulfillment order |
| POST   | `/fulfillments.json`                                           | Crear un fulfillment                         |
| GET    | `/fulfillments/{id}.json`                                      | Detalle                                      |
| POST   | `/fulfillments/{id}/update_tracking.json`                      | Actualizar número de guía                    |
| POST   | `/fulfillments/{id}/cancel.json`                               | Cancelar fulfillment                         |
| POST   | `/fulfillments/{id}/events.json`                               | Crear evento de tracking manual              |

Body para crear fulfillment (formato vigente):

```json
{
  "fulfillment": {
    "line_items_by_fulfillment_order": [{ "fulfillment_order_id": 1045934593 }],
    "tracking_info": {
      "number": "1Z999AA10123456784",
      "company": "UPS",
      "url": "https://tracking.example.com/1Z999AA10123456784"
    },
    "notify_customer": true
  }
}
```

---

## 3. Catálogo general de otros grupos de endpoints (Admin API)

Tu documento original solo cubría Orders/Fulfillment. Como pediste "todo lo que sea posible hacer", aquí el mapa completo de los demás recursos disponibles en el Admin API (GraphQL es la vía recomendada para todos; REST sigue existiendo para casi todos salvo las áreas más nuevas):

- **Productos y catálogo:** `products`, `productVariants`, `productCreate/Update/Delete`, `collections`, `productBundles`, `media` (imágenes/video 3D).
- **Inventario:** `inventoryItems`, `inventoryLevels`, `locations`, `inventoryAdjustQuantities`, `inventoryTransfer` (con soporte de metafields directos desde 2026-07).
- **Clientes:** `customers`, `customerCreate/Update`, `customerAddresses`, `customerSegmentMembers`, `customerMerge`.
- **Descuentos y precios:** `discountCodeBasic/BxGy/FreeShipping`, `priceRules` (legado), `automaticDiscounts`.
- **Checkout / Carrito (Storefront):** la Checkout API clásica está deprecada; el flujo vigente es **Storefront Cart API** + **Checkout UI Extensions**.
- **Draft Orders:** `draftOrders`, `draftOrderCreate`, `draftOrderComplete` (útil para armar un pedido manual antes de convertirlo en `Order`).
- **Pagos y transacciones:** `orderTransactions`, `refunds`, `refundCreate`.
- **Metafields y metaobjects:** `metafieldsSet`, `metaobjects`, ahora también aplicables directamente a inventory transfers.
- **Webhooks:** `webhookSubscriptions` — eventos clave para tu caso: `orders/create`, `orders/updated`, `orders/cancelled`, `fulfillments/create`, `fulfillments/update`, `fulfillment_orders/fulfillment_request_submitted`.
- **Apps y Functions:** `Shopify Functions` (lógica de descuentos, envío, validaciones corriendo en el edge), `appInstallations`, `appSubscriptions` (facturación de apps).
- **POS:** POS UI Extensions API (nota: desde 2026-07 los descuentos `FixedAmount` por línea deben calcularse **por unidad**, ya no se autoconvierte desde el total — si automatizas descuentos vía POS revisa esto).
- **Markets y mercados internacionales:** `markets`, `marketWebPresences`, y desde 2026-07 soporte de "channel markets" en GraphQL.
- **Shipping:** `deliveryProfiles` (incluye el nuevo campo `coversAllItems` en 2026-07 para perfiles de apps que aplican tarifas a todos los productos sin asignación manual).

Si quieres, puedo profundizar cualquiera de estos bloques (por ejemplo, Draft Orders o Webhooks de fulfillment) con el mismo nivel de detalle que Orders/Fulfillment.

---

## 4. Notas operativas importantes

- **Costo de queries GraphQL:** cada campo tiene un costo en puntos; el límite estándar es de 1000 puntos/segundo (bucket que se recarga con el tiempo). Pedidos con muchas `lineItems` anidadas son las que más consumen — pagina con `first` moderado (25–50).
- **Versionado:** fija siempre la versión en la URL. No dejes `unstable` en producción bajo ningún escenario, ni en n8n ni en scripts.
- **Deprecaciones activas a vigilar:** Checkout API clásica (usar Storefront Cart API), `--force` en CLI de scripts (reemplazar por `--allow-updates`).
