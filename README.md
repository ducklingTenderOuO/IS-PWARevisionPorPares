# RevisionAR · PWA de Revisión por Pares

Sistema offline-first para gestión editorial de revistas académicas.

## Estructura del proyecto

```
pwa-review-system/
├── index.html              ← Pantalla de login / selección de rol
├── portal-editor.html      ← Panel del editor (Dr. Carlos Fernández)
├── portal-revisor.html     ← Panel del revisor (Ing. Sofía Mendoza)
├── portal-autor.html       ← Portal del autor (Mtra. Andrea López)
├── manifest.json           ← Configuración PWA (instalación, iconos)
├── sw.js                   ← Service Worker (cache, sync, push)
├── css/
│   └── shared.css          ← Estilos compartidos (paleta editorial)
├── js/
│   └── db.js               ← IndexedDB: artículos, revisiones, sync queue
├── icons/                  ← Iconos generados (72px → 512px)
└── generar-iconos.py       ← Script para regenerar iconos
```

## Probar localmente

Las PWA requieren HTTPS o `localhost`. Usa cualquiera de estas opciones:

### Opción A — Python (más simple)
```bash
cd pwa-review-system
python3 -m http.server 8080
# Abre: http://localhost:8080
```

### Opción B — Node.js con live-reload
```bash
npm install -g live-server
live-server --port=8080
```

### Opción C — VS Code
Instala la extensión **Live Server** y haz clic en "Go Live".

### Opción D — HTTPS real con ngrok (para probar en móvil)
```bash
# Con Python corriendo en :8080
ngrok http 8080
# Copia la URL https://xxx.ngrok.io → abre en tu celular
```

## Flujo de demostración

### Como Editor
1. Abre `http://localhost:8080` → selecciona **Editor** → Ingresar
2. Ve los 3 artículos demo con sus estados
3. Haz clic en **Asignar** en ART-2026-002 (pendiente)
4. Selecciona revisores → Confirmar asignación
5. Observa cómo cambia el estado y progreso

### Como Revisor
1. Regresa al login → selecciona **Revisor** → Ingresar
2. Ve "ART-2026-001" asignado con plazo
3. Clic en **Iniciar revisión →**
4. Completa el formulario: recomendación, puntajes, comentarios
5. Desconecta internet → escribe más comentarios → reconecta → se sincroniza

### Como Autor
1. Regresa al login → selecciona **Autor** → Ingresar
2. Tab **Estado de revisión** → código `ART-2026-001` / clave `autor123`
3. Ve el progreso, puntajes y línea de tiempo
4. Tab **Responder comentarios** → responde al revisor 1
5. Tab **Enviar artículo** → completa el formulario

## Probar modo offline

1. Abre Chrome DevTools → Application → Service Workers
2. Activa **Offline** checkbox
3. Navega entre secciones → la app sigue funcionando
4. Completa un formulario de revisión → se guarda en IndexedDB
5. Desactiva offline → los cambios se sincronizan

## Instalar como PWA

En Chrome desktop o móvil, la app mostrará un banner de instalación.
También: barra de direcciones → ícono de instalación (⊕).

## Arquitectura de datos (IndexedDB)

| Store          | Clave       | Descripción                          |
|----------------|-------------|--------------------------------------|
| `articulos`    | `codigo`    | Manuscritos con metadata y estado    |
| `revisiones`   | `id` (auto) | Asignaciones revisor↔artículo        |
| `comentarios`  | `id` (auto) | Hilo de comentarios por artículo     |
| `sync_queue`   | `id` (auto) | Operaciones pendientes de subir      |
| `revisores`    | `email`     | Perfil y carga de cada revisor       |

## Próximos pasos para producción

1. **Backend**: API REST (Node.js/FastAPI) + PostgreSQL
2. **Autenticación**: JWT con refresh tokens
3. **Almacenamiento de archivos**: S3/MinIO para PDFs
4. **Push notifications**: servidor con web-push
5. **Cifrado local**: Web Crypto API para datos sensibles en IndexedDB
