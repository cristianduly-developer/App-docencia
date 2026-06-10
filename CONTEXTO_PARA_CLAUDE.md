# Contexto para Claude — App Aye Docentes

Este documento resume el estado actual de la app para retomar trabajo en una nueva sesión sin perder contexto.

---

## 1. Qué es la app

App web PWA para docentes de educación especial. Permite gestionar alumnos, escuelas, docentes, registros pedagógicos, informes, alertas y mapa diario de horarios. Deployada en Vercel.

**Stack:** React 18 + Vite · Express (server.js) · Supabase (datos) · PWA con Service Worker

---

## 2. Estructura del proyecto

```
aye-app/
├── server.js              # Servidor Express — API + auth + mapeo DB
├── vite.config.js         # Build config, publicDir: 'static', plugin sw-version
├── static/sw.js           # Service Worker (cache versioning dinámico)
├── dist/                  # Build commiteado — Vercel lo sirve desde el bundle
├── src/
│   ├── App.jsx            # Root: estado global, funciones de datos, rutas
│   ├── constants.js       # Colores, utilidades UI
│   └── components/
│       ├── alumnos/       # FichaAlumno, SecAlumnosPanel, FormAlumno
│       ├── directorio/    # Directorio.jsx — Escuelas, Docentes, Profesionales
│       ├── mapa/          # MapaDia.jsx — horarios del día con alertas inline
│       ├── alertas/       # Avisos.jsx
│       ├── reportes/      # Reportes.jsx — VistaAlumno con registros
│       └── ui/            # Card, Confirm, componentes reutilizables
└── seed_test_data.js      # Script para cargar/borrar datos de prueba
```

---

## 3. Arquitectura de datos

### Dual Supabase
- **Supabase Central** (`ngymvfvlknaltsvsrvjm.supabase.co`) — suscripciones, orgs, planes
- **Supabase App** (`wazxnwskfozazsjofugo.supabase.co`) — datos de cada usuario (alumnos, docentes, registros, etc.)

### Tablas en Supabase App
| Tabla | Campos clave |
|---|---|
| `escuelas` | id, org_id, nombre, nivel, color, direccion, eoe[], activo, eliminado, ciclo_archivado |
| `docentes` | id, org_id, nombre, materia, escuela_id, telefono, mail, activo, eliminado |
| `profesionales` | id, org_id, nombre, rol, telefono, mail, eliminado |
| `alumnos` | id, org_id, nombre, escuela_id, curso, diagnostico, horarios[], tutores[], terapias[], profesional_ids[], cud, activo, eliminado, ciclo_archivado, salud (JSONB) |
| `registros` | id, org_id, alumno_id, fecha, materia, asistencia, avance, acuerdo, docente, tipo, eliminado |
| `avisos` | id, org_id, alumno_id, texto, fecha, prioridad, eliminado |
| `documentos` | id, org_id, alumno_id, ... |

### Mapeo camelCase ↔ snake_case
El servidor (`server.js`) hace toda la conversión. La app siempre trabaja en camelCase.
Funciones: `escParaDB/escDesdeDB`, `docParaDB/docDesdeDB`, `aluParaDB/aluDesdeDB`, `regParaDB/regDesdeDB`

---

## 4. Autenticación y sesiones

- Login con **Google OAuth** via Supabase Central
- Al login: llama RPC `verificar_acceso_email(email, 'docentes')` → devuelve `{ tiene_acceso, ret_org_id, nombre_docente, estado, dias_restantes, plan }`
- Server genera **token HMAC** (TTL: 2h) con `{ email, nombre, foto, orgId, plan }`
- Todas las rutas `/api/db/*` requieren header `x-session-token`
- Todas las queries filtran por `org_id` del token

### Planes
| Plan | Límite alumnos | CoPiloto IA |
|---|---|---|
| `basico` | 15 | No |
| `profesional` | 25 | Sí |
| `premium` | Ilimitado | Sí |
| `sincargo` | Ilimitado | Sí (sin cobro) |

---

## 5. Deploy

- **Vercel** con `@vercel/node` — el `server.js` maneja todo
- `dist/` está commiteado en git (no en .gitignore) para que Vercel lo incluya en el bundle serverless
- `vite.config.js` tiene `publicDir: 'static'` para evitar que `public/index.html` interfiera con el build
- Variables de entorno en Vercel (Production): `SUPABASE_URL`, `SUPABASE_KEY`, `CENTRAL_SUPABASE_URL`, `CENTRAL_SUPABASE_SERVICE_KEY`, `SESSION_SECRET`, `ANTHROPIC_API_KEY`

### Para deployar
```bash
npm run build   # genera dist/
git add dist/
git commit -m "..."
git push        # Vercel redeploya automáticamente
```

---

## 6. Service Worker

- Archivo: `static/sw.js` → se copia a `dist/sw.js` en el build
- Cache name: `aye-v__BUILD__` donde `__BUILD__` se reemplaza por `Date.now()` en build time via plugin en `vite.config.js`
- Solo cachea `/assets/` (archivos hasheados por Vite), nunca `index.html`
- Cada deploy tiene cache name único → limpia la versión anterior automáticamente

---

## 7. Funciones clave en App.jsx

```js
// Archiva alumnos (y opcionalmente docentes) de una escuela
archivarAlumnosEsc(escId, ciclo, tambienDocentes)
// → alumnos.activo = false, cicloArchivado = ciclo
// → si tambienDocentes: docentes.activo = false
// → NO reactiva alumnos al reactivar la escuela (flujo correcto)

// Toggle activo/inactivo
toggleActivoEsc(id)   // escuelas
toggleActivoDoc(id)   // docentes
toggleActivoAlu(id)   // alumnos
```

---

## 8. Directorio — flujo de archivado

### Escuelas
- **🗓 Cerrar ciclo lectivo** → archiva alumnos + docentes, escuela sigue activa
- **📦 Archivar escuela completa** → archiva alumnos + docentes + escuela
- **▶ Reactivar** → reactiva solo la escuela (alumnos del ciclo anterior quedan archivados — es intencional). El mensaje de confirmación lo aclara explícitamente.
- Vista "📦 Archivadas" muestra escuelas con `activo === false`

### Docentes
- Desde la ficha: botón **📦 Archivar** / **▶ Reactivar** con confirmación
- Vista "📦 Arch." muestra docentes con `activo === false`
- `toggleActivoDoc(id)` en App.jsx — igual que `toggleActivoEsc`, persiste en DB
- Se pasa como prop: `App → Directorio (toggleActivoDoc) → SecDocentes (onToggleActivo) → FichaDocente (onToggleActivo)`
- ⚠️ La columna `activo` en tabla `docentes` se agregó manualmente (no estaba en el schema original):
  ```sql
  ALTER TABLE docentes ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
  ```

### Alumnos
- Vista "📦 Archivados" ya existía en `SecAlumnosPanel`

---

## 9. Datos de prueba

Cuenta: `quinchodebere@gmail.com` — org_id: `fa754111-fd17-426e-a671-f575fcded035`

Script: `seed_test_data.js`
```bash
node seed_test_data.js           # carga datos
node seed_test_data.js --borrar  # borra todo
```

Datos cargados:
- 4 escuelas (Primaria, Secundaria, Inicial, Especial — Buenos Aires)
- 30 docentes distribuidos por escuela
- 20 alumnos con diagnósticos, horarios, tutores, obra social
- 4 profesionales externos
- ~217 registros pedagógicos

---

## 10. Bugs conocidos / resueltos en sesiones anteriores

| Bug | Causa | Fix |
|---|---|---|
| Crash en Alertas (mobile) | `.localeCompare` sobre `fecha` undefined | `(a.fecha \|\| "").localeCompare(...)` |
| MIME type error service worker | Cache name fijo `'aye-v1'` nunca cambiaba | Plugin Vite inyecta `Date.now()` en build |
| Ver ficha en Reportes → ficha vacía | `onVerAlumno(alumno)` pasaba objeto, App esperaba id | Cambiado a `onVerAlumno(alumno.id)` |
| Registros vacíos en Reportes | VistaAlumno fetcheaba independiente, lento/fallaba | Usa prop `registros` como fuente primaria |
| Docentes no se archivaban al cerrar ciclo | Tabla `docentes` no tenía columna `activo` | Columna agregada vía SQL |
| Alertas aparecían arriba del mapa diario | Bloque extra en MapaDia.jsx | Bloque removido, alertas solo dentro de bloques |

---

## 11. SaaS — Panel Admin

Ver `C:\Users\payef\OneDrive\Desktop\saas-admin-panel\CONTEXTO_PARA_CLAUDE.md` para documentación completa del panel de control de suscripciones.

Resumen:
- Panel React en `saas-admin-panel/` — solo entra `cristianduly@gmail.com`
- Gestiona orgs, suscripciones, pagos, alertas, reportes financieros
- Auto-logout 30min inactividad
- Avatar abre menú con "Cerrar sesión"
- El email del cliente en `email_contacto` es suficiente para que pueda loguearse — no hace falta agregarlo como empleado
