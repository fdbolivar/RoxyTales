# RoxyTales — Estudio Editorial de Libros Personalizados 8×8" (24 Páginas)

Aplicación full-stack (**HTML/JS + FastAPI + ReportLab 300 DPI**) para la personalización interactiva de cuentos infantiles de colección, generación de borradores y edición final en PDF, y flujo de pedidos de prueba.

---

## 1. Estado de la versión de pruebas

> **IMPORTANTE PARA EL EQUIPO DE QA:**
> - **Checkout en modo simulación (`TEST_MODE=true`):** No se realizan cobros reales con tarjeta.
> - **Stripe (`STRIPE_ENABLED=false`) y Gelato POD (`GELATO_ENABLED=false`) aún no están configurados** en esta etapa y quedan diferidos para una fase posterior.
> - **Integración ERP/CRM opcional:** Si no configuras claves en `.env`, el backend y el frontend operan 100 % en modo de prueba local/simulado sin lanzar errores ni bloquear ninguna pantalla.

### Funcionalidades activas en esta versión
- Personalización completa del protagonista (nombre, edad por micro-etapas `0–6 m`, `7–12 m`, `13–24 m`, dedicatoria, año, fotografía del bebé y mascota / Roxy oficial).
- Visor editorial interactivo de **24 páginas** (bilingüe ES / EN, guías opcionales de sangrado 3 mm y zona segura 6 mm).
- Generación real de **PDF 8×8" (24 páginas) + cubierta envolvente** con ReportLab (muestra digital con sello de cortesía y edición limpia tras compra simulada).
- Carrito y resumen de compra de prueba con descuentos escalonados por cantidad (`2` libros `-10%`, `3` libros `-15%`, `4+` libros `-20%`), cupones (`NAVIDAD20`, `WAITLIST10`, `ROXY5USD`), lista de espera y registro/seguimiento local o sincronizado con el entorno sandbox cuando está configurado.

---

## 2. Requisitos previos e instalación local

- **Python 3.11+** (`pip` y `venv`)
- **Node.js 18+** (opcional, solo si editas los `.js` fuente para regenerar `roxytales.bundle.js`)

### Pasos de configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/fdbolivar/RoxyTales.git
   cd RoxyTales
   ```

2. **Crear entorno virtual e instalar dependencias Python:**
   ```bash
   python -m venv .venv
   # En Windows (PowerShell):
   .\.venv\Scripts\Activate.ps1
   # En macOS / Linux:
   # source .venv/bin/activate

   pip install -r requirements.txt
   ```

3. **Configurar variables de entorno:**
   ```bash
   # En Windows:
   copy .env.example .env
   # En macOS / Linux:
   # cp .env.example .env
   ```
   - Por defecto `.env.example` viene listo para pruebas locales (`TEST_MODE="true"`, `STRIPE_ENABLED="false"`, `GELATO_ENABLED="false"`, `ROXY_SCENE_MODE="fast_composite"`).
   - Opcionalmente, si vas a probar generación IA en vivo o sincronización con el entorno sandbox ERP, reemplaza `GEMINI_API_KEY` y `ODOO_API_KEY` únicamente dentro de tu `.env` local (**nunca subas `.env` ni claves reales a Git**).

---

## 3. Cómo arrancar la aplicación (Backend + Frontend)

Abre **dos terminales** en la raíz del proyecto:

### Terminal 1 — Backend FastAPI (`http://127.0.0.1:8000`)
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Verificación rápida de salud:
- Abrir `http://127.0.0.1:8000/api/health` (debe responder `"status": "healthy"`, `"test_mode": true`, `"stripe_enabled": false`, `"gelato_enabled": false`).

### Terminal 2 — Frontend estático (`http://127.0.0.1:4173`)
```bash
python -m http.server 4173
```
Abre en tu navegador: **`http://127.0.0.1:4173/index.html`**

### Si modificas archivos `.js` fuente (`app.js`, `config.js`, `odooService.js`, `admin.js`, `adminService.js`)
Regenera el bundle universal y valida los IDs del DOM antes de probar o hacer commit:
```bash
node build_bundle.js
node verify_dom.js
node --check roxytales.bundle.js
```

---

## 4. Checklist rápido para el tester (QA)

1. **Personalización y micro-etapas (`ES` / `EN`):**
   - Cambia nombre del bebé, edad (`4 meses`, `10 meses`, `18 meses`), nombre/sonido de la mascota y dedicatoria.
   - Verifica en el visor que el texto cambia dinámicamente según la edad y que las páginas avanzan de `1` a `24` (portada sin folio, `2 / 24` a `23 / 24` en interior, dedicatoria y sello en página `24`).
2. **Vista previa y descarga de PDF de prueba:**
   - Sube una foto (o usa los sprites locales), desbloquea la vista previa con un nombre/correo de prueba y pulsa **"Descargar muestra gratis"**.
   - Confirma que se descarga un PDF de 24 páginas con marca de agua sutil al pie y sin errores en consola.
3. **Flujo de compra simulado (sin Stripe ni Gelato POD):**
   - Prueba cambiar la cantidad a `2` o `3` ejemplares (descuento `-10%` / `-15%`) y aplicar el cupón `NAVIDAD20` o `WAITLIST10`.
   - Abre **"Finalizar Compra"**, completa una dirección ficticia, confirma que aparece el aviso **"Modo Prueba · •••• 4242"** y envía el pedido.
   - Comprueba la pantalla de confirmación exitosa, la tarjeta de referencia/seguimiento del pedido y la descarga limpia post-compra (**"Descargar mi libro digital completo"**).
4. **Lista de espera y panel de auditoría editorial:**
   - Prueba registrar un correo en una colección *"Próximamente"* (aplica cupón `WAITLIST10`).
   - Abre el acceso de **Estudio Admin** para inspeccionar leads, lista de espera, órdenes simuladas y el payload estructurado de la orden.

---

## 5. Estructura principal del proyecto

```text
├── index.html                  # Interfaz principal RoxyTales
├── styles.css                  # Estilos tipográficos editoriales
├── config.js / app.js / ...    # Módulos fuente JS del cliente
├── roxytales.bundle.js         # Bundle universal cargado por index.html
├── build_bundle.js             # Empaquetador JS + sincronizador de blueprint 24p
├── verify_dom.js               # Validador automático de IDs HTML/JS
├── assets/                     # Láminas 24p, sprites y fixtures de prueba
├── PublishingImprint/          # Medallón oficial RoxyTales Publishing Imprint
├── backend/
│   ├── main.py                 # API FastAPI (render, PDF 300 DPI, CRM/órdenes)
│   ├── pdf_layout_engine.py    # Motor ReportLab 8×8" (24 páginas + cubierta)
│   ├── image_engine.py         # Composición local / GenAI opcional
│   ├── odoo_client.py          # Cliente JSON-2 (solo activo si se configura clave)
│   ├── odoo_service.py         # Lógica CRM, órdenes independientes y bóveda PDF
│   └── setup_odoo_sandbox.py   # Provisionamiento idempotente para entorno ERP sandbox
├── .env.example                # Plantilla segura de variables de entorno
└── requirements.txt            # Dependencias Python
```
