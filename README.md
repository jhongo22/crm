# Winners Hub CRM

<div align="center">
  <img src="/icono-fabrica-winners-sin-fondo.png" width="120" height="120" alt="Winners Hub Logo" />
  <h3>Sistema de gestión de clientes y pedidos en tiempo real</h3>
</div>

**Winners Hub** es un CRM de alto rendimiento optimizado para comercio electrónico. Integra la bandeja de mensajería multicanal, el seguimiento de clientes y la gestión de pedidos directamente desde tiendas **Shopify** e integraciones logísticas.

---

## 🚀 Características Principales

* **Integración Shopify (GraphQL):** Visualización en tiempo real de pedidos, estados de pago y mutaciones para marcar como pagado o solicitar envíos.
* **Bandeja Omnicanal (Chatwoot style):** Centralización de mensajes y chats de soporte.
* **PWA (Progressive Web App):** Instalable en tu móvil (Android e iOS) directamente desde el navegador, funcionando en pantalla completa y adaptado a dispositivos móviles.
* **Tema Adaptativo:** Soporte completo e inmediato para tema Claro y Oscuro con prevención de parpadeo (flash) de tema en la carga inicial.
* **Bitácora de Logs:** Registro en formato Laravel (`log.log`) para depuración y monitoreo de API's.

---

## 🛠️ Stack Tecnológico

* **Frontend:** Next.js 16.2 (App Router) y React 19.
* **Estilos:** Tailwind CSS v4 con PostCSS.
* **Base de datos:** Supabase (Database, Auth y Realtime).
* **Compilación:** Turbopack para desarrollo rápido.

---

## 💻 Desarrollo Local

### Requisitos Previos
* Node.js (v18 o superior recomendado)
* npm o pnpm

### Pasos para iniciar

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Variables de Entorno:**
   Crea o edita tu archivo `.env` en la raíz del proyecto y define los valores necesarios:
   ```env
   # Shopify
   SHOPIFY_SHOP_NAME="tu-tienda.myshopify.com"
   X_SHOPIFY_ACCESS_TOKEN="shpat_..."
   SHOPIFY_API_VERSION="2024-04"

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="https://..."
   NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
   ```

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

---

## 📦 Producción y Compilación

Para compilar y optimizar la app para su despliegue en Vercel, Cloud Run u otros proveedores:

```bash
npm run build
```

Una vez finalizada la build estática, puedes probarla localmente con:
```bash
npm run start
```
