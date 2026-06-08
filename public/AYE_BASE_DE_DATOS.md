# AYE — Esquema de Base de Datos (Supabase / PostgreSQL)

**Proyecto Supabase:** wazxnwskfozazsjofugo.supabase.co  
**Estrategia de borrado:** Soft delete — nunca `DELETE`, siempre `eliminado = true`  
**Sincronización:** upsert por `id` (la app genera IDs con `uid()` en el cliente)

---

## SQL COMPLETO — Copiar y ejecutar en Supabase SQL Editor

```sql
-- ══════════════════════════════════════════════════════════════
-- TABLA: escuelas
-- ══════════════════════════════════════════════════════════════
create table if not exists escuelas (
  id                    text primary key,
  nombre                text not null,
  nivel                 text,             -- 'Primaria' | 'Secundaria' | 'Inicial' | 'Especial'
  color                 text,             -- hex color ej: '#2D6A4F'
  direccion             text,
  director              text,
  telefono_director     text,
  mail_director         text,
  secretaria            text,
  telefono_secretaria   text,
  mail_secretaria       text,
  eoe                   jsonb default '[]',   -- array de miembros del EOE
  activo                boolean default true,
  eliminado             boolean default false,
  ciclo_archivado       text,             -- año de cierre ej: '2026'
  created_at            timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- TABLA: docentes
-- ══════════════════════════════════════════════════════════════
create table if not exists docentes (
  id            text primary key,
  nombre        text not null,
  materia       text,
  escuela_id    text references escuelas(id),
  telefono      text,
  mail          text,
  activo        boolean default true,
  eliminado     boolean default false,
  created_at    timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- TABLA: profesionales
-- ══════════════════════════════════════════════════════════════
create table if not exists profesionales (
  id               text primary key,
  nombre           text not null,
  rol              text,                 -- 'Psicóloga' | 'Fonoaudiólogo' | etc.
  telefono         text,
  mail             text,
  dias_presencia   text,
  eliminado        boolean default false,
  created_at       timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- TABLA: alumnos
-- ══════════════════════════════════════════════════════════════
create table if not exists alumnos (
  id                text primary key,
  nombre            text not null,
  escuela_id        text references escuelas(id),
  -- Curso (separado para evitar errores de reagrupamiento)
  anio              text,                -- '1°' a '7°'
  division          text,               -- 'A' | 'B' | '1ra' | etc.
  curso             text,               -- campo compuesto 'anio division' ej: '3° A'
  -- Datos personales
  dni               text,
  cuil              text,
  fecha_nacimiento  date,
  direccion         text,
  telefono_casa     text,
  -- Salud
  diagnostico       text,
  medicacion        text,
  cud               boolean default false,
  cud_numero        text,
  cud_vencimiento   date,
  obra_social       text,
  nro_afiliado      text,
  -- Familia (array de tutores)
  tutores           jsonb default '[]',
  -- Trayectoria
  trayectoria       jsonb default '[]',
  -- Apoyos
  terapias          jsonb default '[]',
  profesional_ids   jsonb default '[]',  -- array de IDs de profesionales externos
  -- Horarios semanales (array de bloques)
  horarios          jsonb default '[]',
  -- Estado
  activo            boolean default true,
  eliminado         boolean default false,
  ciclo_archivado   text,
  created_at        timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- TABLA: registros
-- Historial de intervenciones de Aye en cada clase
-- ══════════════════════════════════════════════════════════════
create table if not exists registros (
  id            text primary key,
  alumno_id     text references alumnos(id),
  fecha         date not null,
  materia       text,
  asistencia    text,                   -- 'presente' | 'ausente' | 'tarde'
  avance        text,                   -- descripción de lo trabajado
  acuerdo       text,                   -- acuerdo con el docente
  docente       text,                   -- nombre del docente (snapshot)
  tipo          text default 'clase',   -- 'clase' | 'nota' | 'adaptacion'
  eliminado     boolean default false,
  created_at    timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- TABLA: avisos
-- Alertas y tareas pendientes
-- ══════════════════════════════════════════════════════════════
create table if not exists avisos (
  id          text primary key,
  alumno_id   text references alumnos(id),  -- null = aviso general
  texto       text not null,
  fecha       date,                          -- fecha en que aparece en el mapa
  prioridad   text default 'media',          -- 'alta' | 'media' | 'baja'
  eliminado   boolean default false,
  created_at  timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- TABLA: documentos
-- PPI e Informes de cada alumno por ciclo lectivo
-- ══════════════════════════════════════════════════════════════
create table if not exists documentos (
  id          text primary key,
  alumno_id   text references alumnos(id),
  ciclo       text not null,            -- año lectivo ej: '2026'
  tipo        text not null,            -- 'ppi' | 'medio' | 'final'
  contenido   jsonb default '{}',       -- campos del documento según tipo
  eliminado   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- TABLA: usuarios
-- Para la futura segunda fase (licencias para otras maestras)
-- ══════════════════════════════════════════════════════════════
create table if not exists usuarios (
  id                text primary key,
  nombre            text,
  email             text unique,
  foto              text,               -- URL foto de perfil Google
  rol               text default 'maestra',  -- 'maestra' | 'admin'
  plan              text default 'free',      -- 'free' | 'pro' | 'trial'
  activo            boolean default true,
  fecha_vencimiento date,
  created_at        timestamptz default now()
);
```

---

## ESTRUCTURA DE LOS CAMPOS JSONB

### `escuelas.eoe` — Array de miembros del EOE
```json
[
  {
    "id": "eoe1",
    "nombre": "Lic. Nombre Apellido",
    "rol": "Orientadora Educacional",
    "diasPresencia": "Lunes y miércoles",
    "telefono": "11-1234-5678",
    "mail": "correo@edu.ar",
    "eliminado": false
  }
]
```

### `alumnos.tutores` — Array de contactos familiares
```json
[
  {
    "nombre": "María García",
    "relacion": "Madre",
    "telefono": "11-1234-5678",
    "principal": true
  }
]
```

### `alumnos.terapias` — Array de apoyos terapéuticos
```json
[
  {
    "nombre": "Psicopedagogía",
    "frecuencia": "2 veces por semana",
    "profesional": "Lic. Paula Herrera"
  }
]
```

### `alumnos.trayectoria` — Historial escolar
```json
[
  {
    "ciclo": "2025",
    "institucion": "Escuela Primaria N° 12",
    "nivel": "Primaria",
    "notas": "Completó 2° grado con apoyo de integración"
  }
]
```

### `alumnos.profesional_ids` — IDs de profesionales externos
```json
["p1", "p2"]
```

### `alumnos.horarios` — Bloques horarios semanales
```json
[
  {
    "dia": 1,
    "horaInicio": "08:00",
    "horaFin": "09:00",
    "docenteId": "d1",
    "aula": "Aula 3",
    "esRecreo": false
  },
  {
    "dia": 3,
    "horaInicio": "10:00",
    "horaFin": "11:00",
    "docenteId": "d2",
    "aula": "",
    "esRecreo": false
  }
]
```
**Días:** 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb

### `documentos.contenido` según tipo

**PPI:**
```json
{
  "situacionActual": "Texto de la situación actual...",
  "objetivos": "Objetivos pedagógicos...",
  "estrategias": "Estrategias de intervención...",
  "acuerdos": "Acuerdos con la institución..."
}
```

**Informe Medio Año o Final:**
```json
{
  "contenido": "Texto narrativo del informe..."
}
```

---

## ÍNDICES RECOMENDADOS

```sql
-- Para búsquedas frecuentes por escuela
create index if not exists idx_docentes_escuela_id on docentes(escuela_id);
create index if not exists idx_alumnos_escuela_id  on alumnos(escuela_id);

-- Para el mapa diario (filtrar por activo y no eliminado)
create index if not exists idx_alumnos_activo on alumnos(activo, eliminado);

-- Para historial de registros por alumno
create index if not exists idx_registros_alumno_id on registros(alumno_id, fecha desc);

-- Para avisos del día
create index if not exists idx_avisos_fecha on avisos(fecha, eliminado);

-- Para documentos por alumno y ciclo
create index if not exists idx_documentos_alumno_ciclo on documentos(alumno_id, ciclo, tipo);
```

---

## ROW LEVEL SECURITY (opcional, segunda fase)

```sql
-- Habilitar RLS en todas las tablas
alter table escuelas      enable row level security;
alter table docentes      enable row level security;
alter table profesionales enable row level security;
alter table alumnos       enable row level security;
alter table registros     enable row level security;
alter table avisos        enable row level security;
alter table documentos    enable row level security;
alter table usuarios      enable row level security;

-- Por ahora: acceso público (la auth la maneja la app con localStorage)
create policy "acceso publico" on escuelas      for all using (true);
create policy "acceso publico" on docentes      for all using (true);
create policy "acceso publico" on profesionales for all using (true);
create policy "acceso publico" on alumnos       for all using (true);
create policy "acceso publico" on registros     for all using (true);
create policy "acceso publico" on avisos        for all using (true);
create policy "acceso publico" on documentos    for all using (true);
create policy "acceso publico" on usuarios      for all using (true);
```

---

## NOTAS IMPORTANTES

### Naming convention
El cliente JavaScript usa **camelCase** (`escuelaId`, `fechaNacimiento`), pero Supabase recomienda **snake_case** (`escuela_id`, `fecha_nacimiento`). La app actual guarda los objetos tal como los maneja React, así que los nombres en Supabase coinciden con los del código JavaScript (camelCase) para evitar transformaciones.

Si en algún momento se migra a snake_case en la DB, habrá que agregar una capa de transformación en server.js.

### Soft delete
Nunca se elimina un registro físicamente. Siempre se actualiza `eliminado = true`. Esto permite:
- Recuperar datos accidentalmente borrados
- Mantener el historial de registros aunque se archive un alumno
- Auditoría de cambios

### IDs
Los IDs son generados en el cliente con la función `uid()`:
```javascript
const uid = () => Math.random().toString(36).slice(2, 10);
// Ejemplo: "k3m9pqrx"
```
No son UUIDs estándar pero son suficientemente únicos para el volumen de datos esperado.
