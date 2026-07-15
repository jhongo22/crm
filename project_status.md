# Estado del Proyecto: Winners Hub

Este documento describe la arquitectura, la configuración actual, el estado del desarrollo y los pasos para el mantenimiento y ejecución de la aplicación **Winners Hub**.

---

## 1. Descripción General
**Winners Hub** es un CRM especializado para comercio electrónico, optimizado para gestionar leads, mensajería de soporte multi-canal, y el seguimiento de pedidos directos desde una tienda en **Shopify**.

El proyecto fue migrado exitosamente desde un entorno de desarrollo **Vite (SPA)** hacia **Next.js (App Router)** para soportar un backend robusto de forma segura, respetando la velocidad y el diseño visual premium.

---

## 2. Stack Tecnológico Actual
* **Framework principal:** Next.js 16.2.x (App Router)
* **Librería de UI:** React 19.x (con soporte para Server Components)
* **Estilos y Diseño:** Tailwind CSS v4 (procesado por PostCSS)
* **Base de Datos / Backend:** Supabase (Auth, Database y Realtime)
* **Lenguaje:** TypeScript
* **Servidor Local / HMR:** Turbopack (Next.js)

---

## 3. Estructura de Directorios Clave

```
CRM/
├── .env                         # Variables de entorno (Token de Shopify, Supabase, etc.)
├── log.log                      # Archivo de logs del CRM (estilo Laravel)
├── next.config.ts               # Configuración de Next.js
├── postcss.config.mjs           # Configuración de procesamiento de Tailwind v4
├── endpoints_shopify.md         # Documentación de la API de Shopify de referencia
├── public/                      # Recursos estáticos (Logotipo e iconos de marca)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Layout principal (HTML shell, prevención de flash y AppProvider)
│   │   ├── manifest.ts          # Manifiesto de la PWA (Configuración móvil)
│   │   ├── page.tsx             # Punto de entrada SPA protegido con guard de montaje
│   │   └── api/
│   │       ├── shopify/
│   │       │   └── route.ts     # Proxy de API seguro para consultas GraphQL a Shopify
│   │       └── hoko/
│   │           └── route.ts     # Endpoint de integración para Hoko
│   ├── components/
│   │   ├── layout/              # Sidebar (colapsable), Header, MobileNav
│   │   ├── orders/              # OrdersDashboard (KPIs y Tabla) y OrderDetailView
│   │   ├── chat/                # Bandeja de mensajería (Chatwoot style)
│   │   ├── contacts/            # Listado de contactos de clientes
│   │   ├── dashboard/           # Métricas generales del CRM
│   │   ├── tasks/               # Kanban/Lista de tareas operativas
│   │   └── shared/              # Avatares, botones y badges reutilizables
│   ├── context/
│   │   └── AppContext.tsx       # Estado global de React (seguro ante SSR)
│   ├── utils/
│   │   └── logger.ts            # Utilidad de registro de logs
│   └── types.ts                 # Definición de interfaces y tipos TypeScript del CRM
```

---

## 4. Integración con Shopify (GraphQL)

Para proteger las credenciales confidenciales de la tienda, la integración utiliza un proxy local:
* **Endpoint Proxy:** `POST /api/shopify`
* **Envío al Servidor:** Los componentes de React envían sus consultas GraphQL al proxy.
* **Procesamiento de Servidor:** El endpoint en el servidor intercepta la petición, le inyecta de forma segura el `X-Shopify-Access-Token` desde las variables de entorno, consulta a la API oficial de Shopify en la versión establecida por `SHOPIFY_API_VERSION` y retorna la respuesta limpia al cliente.

### Acciones Habilitadas en el Módulo de Pedidos:
1. **Panel Principal (`OrdersDashboard.tsx`):**
   - KPI's globales sobre pedidos del día, artículos y estados.
   - Buscador en tiempo real por número de orden o nombre de cliente.
   - Filtros de estado de pago (Pagado, Pendiente, Reembolsado) y preparación (Preparado, No preparado).
2. **Ficha de Detalle (`OrderDetailView.tsx`):**
   - Resumen financiero de la orden (Subtotal, envío, total).
   - Datos del cliente, origen de canal de ventas y dirección física de entrega.
   - Botón **"Marcar como pagado"** (Ejecuta mutación de pago en Shopify).
   - Botón **"Solicitar preparación"** (Fulfillment) que genera un envío usando el `fulfillmentOrderId` de forma automática.

---

## 5. Sistema de Registro de Logs (`log.log`)
Se implementó un logger local en `src/utils/logger.ts` que escribe registros en formato Laravel directamente en `log.log` en el directorio raíz.
* **Qué se registra:**
  - Envío de consultas GraphQL (con query y variables).
  - Respuestas obtenidas de Shopify (incluyendo mensajes de éxito o errores estructurales de GraphQL).
  - Excepciones y caídas de servidor.
* **Formato del Log:**
  `[2026-07-13 16:54:00] local.INFO: Shopify GraphQL Request Sent {"query": "..."}`

---

## 6. PWA y Adaptabilidad Móvil (Implementado recientemente)
* **Manifiesto Móvil (`manifest.ts`):** Configurado para permitir la instalación de la web como app nativa a pantalla completa (`standalone`) en iOS y Android, utilizando la paleta oficial y los iconos en la carpeta pública.
* **Optimización de Carga Visual (Prevención de Flash):** Añadido un script en línea sincrónico en `<head>` que previene el destello oscuro al arrancar la web, aplicando el tema correspondiente (`light` / `dark`) instantáneamente antes de que el navegador pinte el HTML.
* **Login Autoadaptativo (`page.tsx`):** La pantalla de login ahora responde dinámicamente al tema preferido, mostrando un look limpio en tema claro y el clásico look de alto rendimiento en modo oscuro.
* **Menú Móvil Rediseñado (`MobileNav.tsx`):** 
  - Barra de 4 accesos directos principales en la parte inferior.
  - Botón **"Más"** que despliega un panel deslizante a pantalla completa con toda la navegación del CRM (contactos, pedidos shopify/chat, stocks, guías, reportes y configuración), organizada por grupos.

---

## 7. Próximos Pasos (Planificación de la Próxima Semana)
* **Integración Oficial de WhatsApp Cloud API:**
  - **Configuración de Variables de Entorno:** Integrar `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_VERIFY_TOKEN` en `.env`.
  - **Creación de Webhook de Recepción (`api/whatsapp/route.ts`):** 
    - Crear endpoint `GET` para verificar el handshake de Meta.
    - Crear endpoint `POST` para parsear los mensajes entrantes (número de teléfono del cliente, nombre, tipo de mensaje y contenido).
  - **Persistencia en Supabase:** Almacenar los mensajes entrantes en las tablas correspondientes (`crm_conversaciones` y `crm_mensajes`) y activar disparadores de Supabase Realtime para refrescar la bandeja de entrada al instante.
  - **Integración de Envío en UI:** Habilitar el botón de envío en el chat (`ChatInbox.tsx`) para invocar a la API de Graph de Meta y mandar mensajes de WhatsApp reales de forma bidireccional.

---

## 8. Comandos Operativos

### Iniciar servidor de desarrollo
Inicia el entorno de desarrollo local (con Turbopack rápido y HMR configurado).
```bash
npm run dev
```

### Compilar para Producción
Verifica tipos de TypeScript y optimiza el empaquetado final de Next.js para Cloud Run / Servidor.
```bash
npm run build
```

### Iniciar producción
Ejecuta la build optimizada.
```bash
npm run start
```
