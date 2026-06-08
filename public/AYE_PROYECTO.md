# AYE — Documentación Completa del Proyecto
**App para Ayelén Florentin · Maestra Integradora · Educación Especial PBA**
*Última actualización: Junio 2026*

---

## 1. VISIÓN GENERAL

### ¿Qué es Aye?
Una app móvil progresiva (PWA) diseñada específicamente para Ayelén Florentin, Maestra Integradora de Educación Especial de la Provincia de Buenos Aires. La app centraliza toda la gestión de su trabajo diario: mapa de clases, registro de intervenciones, seguimiento de alumnos, comunicación con docentes y generación de documentos pedagógicos oficiales.

### Paradigma pedagógico
**Modelo social de la discapacidad — PBA 2026.**
- ❌ Evitar: dificultad, problema, déficit, trastorno
- ✅ Usar: intervención, ajuste razonable, facilitador, trayectoria, acompañamiento
- Todos los prompts de Claude incluyen este paradigma automáticamente

### Usuario principal
- **Nombre:** Ayelén Florentin
- **Rol:** Maestra Integradora de Educación Especial
- **Email:** ayelen.florentin@gmail.com
- **Uso:** Primariamente móvil (celular Android/iOS), secundariamente escritorio

---

## 2. INFRAESTRUCTURA

### Deploy
- **URL producción:** https://aye-app-one.vercel.app
- **Proyecto Vercel:** ayelenmaestraespecial-s-projects2/aye-app
- **Plataforma:** Vercel (deploy con `vercel --prod --force`)

### Base de datos
- **Supabase:** https://wazxnwskfozazsjofugo.supabase.co
- **Estrategia:** Dual — guarda simultáneamente en Supabase Y localStorage como fallback
- **Sincronización:** Al iniciar la app carga desde Supabase; si falla usa localStorage

### Variables de entorno (Vercel)
```
ANTHROPIC_API_KEY=<clave API de Anthropic>
SUPABASE_URL=https://wazxnwskfozazsjofugo.supabase.co
SUPABASE_KEY=sb_publishable_SJFmyA5VpEcglJIsurVLBw_dbuxZfzI
```

### Archivos del proyecto
```
C:\Users\payef\OneDrive\Desktop\App aye\aye-app\
├── public\
│   └── index.html          ← App completa (único archivo, ~263KB)
├── server.js               ← Proxy Anthropic API + endpoints Supabase
├── package.json
└── vercel.json
```

### server.js
Actúa como proxy para:
- `POST /api/claude` → Anthropic API (evita exponer la API key en el cliente)
- `POST /api/db/:tabla` → Supabase (guardar registros)
- `GET /api/db/:tabla` → Supabase (cargar registros)

---

## 3. ARQUITECTURA DE LA APP

### Stack tecnológico
- **React 18** (cargado via CDN unpkg, sin build step)
- **Babel Standalone** (transpila JSX en el browser)
- **Un solo archivo HTML** de ~263KB que contiene toda la app
- Sin bundler, sin webpack, sin node_modules en producción

### Por qué un solo HTML
La app fue construida iterativamente en esta conversación. Los archivos JSX fuente originales (aye-final-v9.jsx, aye-cfg-v4.jsx, aye-docs.jsx) quedaron desactualizados. Todo el desarrollo posterior se hizo directamente sobre el index.html unificado. **El index.html ES la fuente de verdad.**

### Persistencia de datos
```javascript
const DB = {
  save(tabla, obj) // guarda en Supabase + localStorage
  load(tabla, def) // carga desde Supabase, fallback a localStorage
}

// Claves localStorage
aye_escuelas, aye_docentes, aye_profesionales, aye_alumnos
aye_registros, aye_avisos, aye_sesion
aye_docs_{alumnoId}_{año}  // documentos PPI/informes por alumno
```

---

## 4. NAVEGACIÓN (Bottom Nav de 5 pestañas)

```
👤 Alumnos | 🏫 Directorio | 🗺 MAPA* | 📊 Reportes | 🔔 Alertas
                              ↑ central elevado, arranca aquí
```

### Pestaña por pestaña

#### 👤 Alumnos
- Lista de alumnos con buscador y filtro por nivel (Primaria / Secundaria agrupa todas las escuelas de ese nivel)
- Toggle Activos / Archivados
- Botones por alumno: Ver ficha → Editar → Archivar/Reactivar → Eliminar (con confirmación doble)
- Al tocar un alumno abre su **Ficha completa** con tabs: Info · Docentes · Historial · Horarios · Actividades
- Botón "+ Nuevo" abre FormAlumno completo

#### 🏫 Directorio
- Tres tabs: **Escuelas · Docentes · Profesionales**
- **Solo lectura + edición** (ABM completo)
- Escuelas: ver info detallada (director, secretaría con WA/Mail, EOE, docentes, alumnos integrados), editar, archivar, **Cierre de ciclo lectivo**
- Docentes: buscador por nombre/materia, filtro por escuela, WA y Mail en cada card
- Profesionales: WA y Mail en cada card

#### 🗺 Mapa (central)
- **Pantalla de inicio por defecto**
- Selector de día de la semana (navegable)
- Reloj en vivo + fecha del día
- Alertas del día integradas (🔴 alta, 🟡 media, 🟢 baja) — solo cuando es hoy
- Grilla de eventos: cada bloque horario del alumno con docente y materia
- "Sin clases hoy" — al tocar el nombre va a la ficha del alumno
- Al tocar un bloque → VistaClase (registrar intervención)
- Botón ✨ (CoPilot) abre el asistente de IA

#### 📊 Reportes
- Selector de alumno
- Filtro de materia (chips por materia única)
- Filtro de fechas Desde/Hasta
- Historial de registros filtrado
- Botón 👤 Ver ficha → navega a la ficha
- Botón 🖨️ Imprimir ficha → genera PDF con datos personales + tabla de registros

#### 🔔 Alertas
- Lista de avisos/tareas pendientes
- Colores por prioridad: 🔴 roja / 🟡 amarilla / 🟢 verde
- Badge en el nav con cantidad de alertas de alta prioridad **de hoy**

---

## 5. MODELOS DE DATOS

### Escuela
```javascript
{
  id: "e1",
  nombre: "Escuela Primaria N° 12",
  nivel: "Primaria",           // "Primaria" | "Secundaria" | "Inicial" | "Especial"
  color: "#2D6A4F",            // color identificador (hex)
  direccion: "",
  director: "",
  telefonoDirector: "",
  mailDirector: "",
  secretaria: "",
  telefonoSecretaria: "",
  mailSecretaria: "",
  eoe: [],                     // array de miembros del EOE
  activo: true,
  eliminado: false,
  cicloArchivado: null         // año de cierre si fue archivada
}
```

### Miembro EOE
```javascript
{
  id: "eoe1",
  nombre: "Lic. Nombre",
  rol: "Orientadora Educacional",
  diasPresencia: "Lunes y miércoles",
  telefono: "",
  mail: "",
  eliminado: false
}
```

### Docente
```javascript
{
  id: "d1",
  nombre: "Prof. Ana Gómez",
  materia: "Matemática",
  escuelaId: "e1",
  telefono: "",
  mail: "",
  eliminado: false,
  activo: true
}
```

### Profesional Externo
```javascript
{
  id: "p1",
  nombre: "Lic. Paula Herrera",
  rol: "Psicóloga",
  telefono: "",
  mail: "",
  diasPresencia: "",
  eliminado: false
}
```

### Alumno
```javascript
{
  id: "a1",
  nombre: "Sofía Martínez",
  escuelaId: "e1",
  // Curso: separado en año + división para evitar errores de reagrupamiento
  anio: "3°",                  // "1°" a "7°" (Primaria) o "1°" a "5°" (Secundaria)
  division: "A",               // "A", "B", "C", "1ra", "2da"...
  curso: "3° A",               // campo compuesto para compatibilidad
  // Datos personales
  dni: "",
  cuil: "",
  fechaNacimiento: "",
  direccion: "",
  telefonoCasa: "",
  // Salud
  diagnostico: "",
  medicacion: "",
  cud: false,
  cudNumero: "",
  cudVencimiento: "",
  obraSocial: "",
  nroAfiliado: "",
  // Familia
  tutores: [{ nombre: "", relacion: "", telefono: "", principal: true }],
  // Apoyos
  terapias: [{ nombre: "", frecuencia: "", profesional: "" }],
  profesionalIds: [],          // IDs de profesionales externos asociados
  // Trayectoria escolar
  trayectoria: [{ ciclo: "2026", institucion: "", nivel: "", notas: "" }],
  // Horarios semanales (la parte más importante)
  horarios: [],                // ver estructura abajo
  // Estado
  activo: true,
  eliminado: false,
  cicloArchivado: null
}
```

### Bloque Horario (dentro del alumno)
```javascript
{
  dia: 1,                      // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  horaInicio: "08:00",         // input type="time"
  horaFin: "09:00",
  docenteId: "d1",             // docente de esa clase (null si recreo)
  aula: "Aula 3",
  esRecreo: false
}
```

### Registro de clase
```javascript
{
  id: "r1",
  fecha: "2026-05-15",         // ISO date string
  materia: "Matemática",
  asistencia: "presente",      // "presente" | "ausente" | "tarde"
  avance: "Trabajamos fracciones con material concreto...",
  acuerdo: "La docente va a preparar la guía adaptada para el jueves",
  docente: "Prof. Ana Gómez",
  tipo: "clase",
  eliminado: false
}
// Se guardan en: registros[alumnoId] = [reg1, reg2, ...]
```

### Aviso / Tarea pendiente
```javascript
{
  id: "rc1",
  alumnoId: "a1",              // puede ser null para avisos generales
  texto: "Reunión con Lic. Paula Herrera el viernes 6/6",
  fecha: "2026-06-06",         // fecha en que aparece en el mapa
  prioridad: "alta",           // "alta" | "media" | "baja"
  eliminado: false
}
```

### Documento (PPI / Informe)
```javascript
// Se guarda en localStorage bajo clave: aye_docs_{alumnoId}_{año}
{
  ppi: {
    situacionActual: "",       // generado por Claude o escrito manualmente
    objetivos: "",
    estrategias: "",
    // ... otros campos del PPI
  },
  medio: {
    contenido: "",             // Informe de Medio Año
  },
  final: {
    contenido: "",             // Informe Final Anual
  }
}
```

---

## 6. COMPONENTES PRINCIPALES

### App (función principal)
- Estado global: escuelas, docentes, pros, alumnos, registros, recs
- Sincronización con Supabase al iniciar
- Handlers: saveEsc, saveDoc, savePro, saveAlu, delAlu, toggleActivoAlu, archivarAlumnosEsc
- Login check: si no hay sesión en localStorage → PantallaLogin

### MapaDia
- Props: alumnos, docentes, escuelas, registros, recs, dia, diaReal, minActual, fechaHoy, onCambioDia, onVerClase, onVerAlumno
- Construye array `evs` filtrando horarios del alumno por `h.dia === dia`
- Marca evento actual (esRef) para scroll automático
- Muestra alertas del día si `esHoy`

### FichaAlumno
- Tabs: info · docentes · historial · horarios · actividades
- Tab Info: datos personales, CUD, tutores, terapias, profesionales, trayectoria
- Tab Horarios: grilla semanal visual
- Tab Actividades: TabActividades (generación IA de materiales adaptados)
- **NO tiene tab Docs** — los documentos se acceden desde Reportes

### VistaClase
- Se abre al tocar un evento en el Mapa
- Permite registrar: asistencia, avance, acuerdo, nota rápida, adaptar tarea con foto
- `onFicha` navega a la ficha del alumno en la pestaña Alumnos

### FormAlumno
- 6 secciones: datos básicos, datos personales, salud, familia/tutores, terapias/profesionales, horarios
- **Horarios**: tabla con día (selector), hora inicio/fin (type="time"), docente (selector nombre+materia), aula, es recreo
- Solo se pueden cargar horarios después de seleccionar la escuela del alumno

### Reportes
- Selector de alumno → filtro materia → filtro fechas (desde/hasta)
- Muestra historial filtrado
- Botón imprimir → PDF con datos personales + tabla de registros

### CoPilot
- Botón ✨ flotante en el Mapa (abierto=false por defecto)
- Al abrir: chat con Claude que conoce todo el contexto (alumnos, registros, horarios, avisos)
- Usa voz (SpeechRecognition) o texto
- Modo simulador cuando no hay API

### EditorPPI / EditorInforme
- Formularios para PPI, Informe Medio Año e Informe Final
- Botón "Generar con IA" → llama a Claude con el historial de registros del alumno
- Generación respeta el paradigma del modelo social
- Botón "Imprimir/PDF" → abre ventana de impresión

### CierreCicloEsc
- Modal dentro de cada escuela en el Directorio
- Archiva masivamente todos los alumnos activos de esa escuela
- Pregunta si también archivar los docentes
- Guarda el ciclo lectivo que se cierra (ej: "2026")

---

## 7. FLUJOS PRINCIPALES

### Flujo diario de Aye
1. Abre la app → Mapa del día actual
2. Ve alertas del día arriba (si las hay)
3. Ve su grilla horaria con los alumnos y materias
4. Toca un bloque → VistaClase → registra lo que pasó
5. Al finalizar el día, revisa las alertas y tareas pendientes

### Flujo de alta de alumno nuevo
1. 👤 Alumnos → "+ Nuevo"
2. FormAlumno: nombre + escuela (mínimo para crear)
3. Completa datos personales, CUD, familia
4. Agrega bloques horarios (primero selecciona escuela → aparecen docentes de esa escuela)
5. Asocia profesionales externos
6. Guarda → sincroniza a Supabase

### Flujo de registro de clase
1. 🗺 Mapa → toca bloque horario del alumno
2. VistaClase → completa asistencia, avance, acuerdo
3. Opcionalmente: adaptar tarea con foto (sube imagen → Claude genera adaptación)
4. Guardar → aparece en el historial del alumno

### Flujo de generación de informe
1. 📊 Reportes → selecciona alumno
2. Revisa historial (puede filtrar por materia y fechas)
3. Para imprimir ficha completa: botón 🖨️
4. Para PPI/Informes: ir a la ficha del alumno (👤 Alumnos → ficha → tab Docs)

### Flujo de cierre de ciclo
1. 🏫 Directorio → Escuelas → selecciona una escuela → "Ver info"
2. "Cerrar ciclo" → confirma el año
3. Elige si también archivar docentes
4. Todos los alumnos activos de esa escuela pasan a "Archivados"
5. Al año siguiente se reactivan desde 👤 Alumnos → Archivados

---

## 8. INTEGRACIÓN CON CLAUDE (IA)

### Endpoint
`POST /api/claude` (proxy en server.js) → `https://api.anthropic.com/v1/messages`

### Modelo
`claude-sonnet-4-20250514` con `max_tokens: 1000`

### Usos de IA en la app

| Función | Descripción |
|---------|-------------|
| CoPilot | Asistente de consulta general con contexto completo |
| Adaptar tarea | Sube foto de tarea, Claude genera 3 versiones adaptadas |
| Nota rápida | Dicta con voz, Claude lo formatea como registro pedagógico |
| Generar PPI | Claude redacta la situación actual basada en el historial |
| Informe Medio Año | Claude redacta informe narrativo por materia |
| Informe Final | Claude redacta síntesis anual |

### Paradigma en todos los prompts
```
"Modelo social de la discapacidad, PBA 2026. 
Evitar: dificultad, problema, déficit. 
Usar: intervención, ajuste razonable, facilitador, trayectoria."
```

---

## 9. COLORES Y DISEÑO

### Paleta base
```javascript
const G   = "#2D6A4F"  // verde principal (Aye)
const GR  = "#64748b"  // gris texto
const GL  = "#94a3b8"  // gris claro
const BD  = "#e2e8f0"  // borde
const TX  = "#1a202c"  // texto oscuro
const FO  = "#f1f5f9"  // fondo
```

### Colores de escuelas (asignables)
```
#2D6A4F  verde
#1D3557  azul marino
#7c3aed  violeta
#b45309  ámbar
#0e7490  celeste
#be185d  rosa
```

### Tipografía
Georgia (serif) — elegante, diferente a apps genéricas

### Componentes UI base
- `Card` — tarjeta blanca con sombra suave, border-radius 16
- `Btn` — botón con variantes: filled, outline, small, full
- `SecT` — título de sección en mayúsculas
- `Tag` — etiqueta pill de color
- `Avatar` — iniciales del nombre en círculo de color
- `Confirm` — modal de confirmación sí/no
- `Fld` — campo de texto con label
- `Sel` — selector con label

---

## 10. DECISIONES DE DISEÑO IMPORTANTES

### Por qué un solo HTML
Simplifica el deploy a Vercel al máximo. Aye puede agregar la app a la pantalla de inicio del celular como PWA sin necesidad de tiendas de apps.

### Dual persistence (Supabase + localStorage)
Si Aye está sin conexión puede seguir usando la app. Cuando vuelve la conexión los datos ya están en localStorage y se sincronizan.

### Alumnos en pestaña propia (no en Directorio)
Aye entra a sus alumnos muchísimo más seguido que a las escuelas o docentes. Tenerlos en el segundo slot del nav (cerca del Mapa) reduce los taps.

### Directorio solo para escuelas/docentes/profesionales
Separar el "quién trabaja con quién" del "mis alumnos" hace la app más clara. El Directorio es como una agenda de contactos profesionales.

### Documentos (PPI/Informes) fuera del Mapa y Reportes
Los documentos oficiales se acceden poco (2-3 veces por año). Tenerlos en la ficha de cada alumno evita contaminar las pantallas de uso diario.

### Cierre de ciclo por escuela (no global)
Aye puede tener alumnos en varias escuelas con calendarios diferentes. El cierre por escuela permite más granularidad.

---

## 11. ESTADO ACTUAL Y PENDIENTES

### Funcionando ✅
- Navegación de 5 pestañas con Mapa central elevado
- Mapa diario con grilla horaria, selector de día, reloj, fecha
- Alertas del día en el Mapa (filtradas por fecha)
- VistaClase: registro de intervenciones
- Ficha del alumno con 5 tabs (sin docs)
- ABM completo de alumnos con filtro por nivel
- ABM completo en Directorio (escuelas, docentes, profesionales)
- WA y Mail en docentes y profesionales
- "Ver info" de escuela con EOE, docentes, alumnos
- Cierre de ciclo por escuela
- Reportes por alumno con filtro materia + fechas + impresión
- CoPilot (asistente IA) como botón flotante
- Login con sesión persistente en localStorage
- Persistencia dual Supabase + localStorage

### Bugs conocidos / pendientes 🔧
- Error `Unexpected token` al cerrar FichaAlumno (en proceso de fix)
- Docente nuevo: verificar que se guarda correctamente con la nueva escuela
- Horarios en FormAlumno: verificar que los type="time" funcionan en todos los navegadores móviles
- Directorio > Escuelas: el botón "Ver info" y "Editar" pueden necesitar ajuste visual en móvil

### Segunda fase 🚀 (futuro)
- Panel de licencias: otras maestras integradoras pueden suscribirse
- Modelo de datos ya incluye `activo`, `fechaVencimiento`, `plan` en usuarios
- Firebase Auth para login real con Google
- Notificaciones push para alertas importantes

---

## 12. CÓMO EDITAR CON CLAUDE CODE

### Setup
1. Abrí Claude Code (Desktop)
2. Abrí la carpeta: `C:\Users\payef\OneDrive\Desktop\App aye\aye-app\`
3. El archivo a editar es siempre `public\index.html`

### Workflow de fix
1. Copiá el mensaje de error de la consola del navegador
2. En Claude Code: "Tengo este error en index.html: [pegar error]"
3. Claude Code edita directamente el archivo con el contexto completo
4. Guardás el archivo
5. `vercel --prod --force` en la terminal

### Comandos útiles
```bash
# Deploy
vercel --prod --force

# Ver logs
vercel logs

# Verificar que el archivo está actualizado
ls -la public/index.html
```

### Tips para Claude Code
- Siempre decirle que es un único archivo HTML con React/Babel inline
- Mencionar que NO hay build step — el JSX se transpila en el browser
- Si hay error de sintaxis, pedirle que busque el patrón exacto antes de editar
- Después de cada fix importante, pedirle que verifique que no hay duplicados de `const` o `function` a nivel global

---

## 13. HISTORIAL DE SESIONES

Esta app fue construida en múltiples sesiones de Claude (chat) a lo largo de varias semanas. Los hitos principales:

1. **Sesión original**: Arquitectura inicial, 3 archivos JSX separados (app, config, docs)
2. **Deploy inicial**: Vercel + Supabase conectados
3. **Unificación**: Todo en un solo index.html con nav inferior de 5 tabs
4. **Reestructuración de nav**: Alumnos · Directorio · Mapa (central) · Reportes · Alertas
5. **ABM completo**: Crear/editar/archivar/eliminar desde todas las secciones
6. **Directorio**: Escuelas/Docentes/Profesionales con WA/Mail y fichas de escuela
7. **Reportes mejorados**: Filtro por alumno + materia + fechas + impresión PDF
8. **CierreCicloEsc**: Archivo masivo de alumnos por escuela al final del ciclo

---

*Documento generado automáticamente desde la conversación de desarrollo.*
*Para actualizar: pedirle a Claude que regenere este archivo con los cambios recientes.*
