// v2
const express  = require('express');
const cors     = require('cors');
const fetch    = require('node-fetch');
const path     = require('path');
const crypto   = require('crypto');
const { createClient }  = require('@supabase/supabase-js');
const { OAuth2Client }  = require('google-auth-library');

const app    = express();
const PORT   = process.env.PORT || 3000;

// ── Rate limiting persistente via Supabase ───────────────────
// Usa tabla rate_limits en Supabase — persiste entre invocaciones serverless
// Fallback en memoria si Supabase no está disponible (desarrollo local)
const _rl = new Map();
async function rateLimit(key, maxReqs, windowMs) {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_max: maxReqs,
      p_window_seconds: Math.floor(windowMs / 1000),
    });
    if (!error) return data === true;
  } catch {}
  // Fallback en memoria
  const now = Date.now();
  const entry = _rl.get(key) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
  entry.count++;
  _rl.set(key, entry);
  return entry.count > maxReqs;
}
const GOOGLE_CLIENT_ID = "117583093488-94tk32l3502mj4c3vff7fci9oclcvvhn.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ── Cliente Supabase central (SaaS) — service role ────────────
const stripBOM = s => (s || '').replace(/^﻿/, '').trim();
const CENTRAL_URL = 'https://ngymvfvlknaltsvsrvjm.supabase.co';
const CENTRAL_KEY = process.env.CENTRAL_SUPABASE_KEY || 'sb_publishable_CJQPQElcEzA9CACfuNllYg_Pe9lwvXy';

async function verificarAccesoCentral(email, appId) {
  const res = await fetch(`${CENTRAL_URL}/rest/v1/rpc/verificar_acceso_email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': CENTRAL_KEY,
      'Authorization': `Bearer ${CENTRAL_KEY}`,
    },
    body: JSON.stringify({ email_param: email, app_id_param: appId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || JSON.stringify(data));
  return data;
}

// ── CORS: solo dominios permitidos ───────────────────────────
const ORIGINS_PERMITIDOS = [
  'https://aye-app-one.vercel.app',
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ORIGINS_PERMITIDOS.includes(origin)) cb(null, true);
    else cb(new Error('CORS: origen no permitido'));
  }
}));

app.use(express.json({ limit: '512kb' }));
app.use(require('express').static(require('path').join(__dirname, 'dist')));

// Cliente global con service key — para operaciones admin y fallback
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

// ── RLS Fase 2: cliente por request con JWT que lleva org_id ──
// Supabase verifica este JWT con SUPABASE_JWT_SECRET y aplica RLS por org
function _firmarJWTOrg(orgId) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'supabase', role: 'authenticated',
    org_id: orgId || '',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function getDb(orgId) {
  const anonKey   = process.env.SUPABASE_ANON_KEY;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (anonKey && jwtSecret && orgId) {
    const token = _firmarJWTOrg(orgId);
    if (token) return createClient(process.env.SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth:   { persistSession: false },
    });
  }
  return supabase; // fallback: service key (admin sin org o env vars no configuradas)
}

// ── Admins globales del sistema ───────────────────────────────
const ADMINS = (process.env.ADMIN_EMAILS || 'cristianduly@gmail.com')
  .split(',').map(e => e.trim()).filter(Boolean);

// ── Token HMAC firmado — sin estado en servidor (funciona en serverless) ──
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) throw new Error('SESSION_SECRET env var es requerida');

function crearToken(email, nombre, foto, orgId, plan) {
  const payload = JSON.stringify({ email, nombre, foto, orgId: orgId || null, plan: plan || 'basico', exp: Date.now() + SESSION_TTL_MS });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig  = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

function validarToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('hex');
  // Comparación en tiempo constante para evitar timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (Date.now() > payload.exp) return null; // expirado
    return payload;
  } catch { return null; }
}

// ── Middleware de autenticación ───────────────────────────────
function requireAuth(req, res, next) {
  const token = req.headers['x-session-token'];
  const session = validarToken(token);
  if (!session) return res.status(401).json({ error: 'Sesión inválida o expirada. Volvé a iniciar sesión.' });
  req.session = session;
  req.orgId   = session.orgId || null; // disponible en los handlers
  next();
}

// ══════════════════════════════════════════════════════════════
// MAPEO camelCase (app) <-> snake_case (Supabase)
// La app siempre trabaja en camelCase.
// El servidor hace la conversión en ambas direcciones.
// ══════════════════════════════════════════════════════════════

// ── ESCUELAS ─────────────────────────────────────────────────
function _turnoParaDB(t) {
  t = t || {};
  return {
    secretaria:         t.secretaria          || '',
    telefonoSecretaria: t.telefonoSecretaria   || '',
    mailSecretaria:     t.mailSecretaria        || '',
    preceptor:          t.preceptor             || '',
    telefonoPreceptor:  t.telefonoPreceptor     || '',
    mailPreceptor:      t.mailPreceptor          || '',
    eoe:                t.eoe                   || [],
  };
}
function escParaDB(e) {
  return {
    id:        e.id,
    nombre:    e.nombre    || '',
    nivel:     e.nivel     || '',
    color:     e.color     || '#2D6A4F',
    direccion: e.direccion || '',
    eoe:       [],
    activo:    e.activo    !== false,
    eliminado: e.eliminado || false,
    ciclo_archivado: e.cicloArchivado || null,
    contactos: {
      telefono:             e.telefono              || '',
      director:             e.director              || '',
      telefonoDirector:     e.telefonoDirector       || '',
      mailDirector:         e.mailDirector           || '',
      vicedirector:         e.vicedirector           || '',
      telefonoVicedirector: e.telefonoVicedirector   || '',
      mailVicedirector:     e.mailVicedirector        || '',
      turnoDia:   _turnoParaDB(e.turnoDia),
      turnoTarde: _turnoParaDB(e.turnoTarde),
    },
  };
}
function escDesdeDB(r) {
  const c  = r.contactos || {};
  const td = c.turnoDia   || {};
  const tt = c.turnoTarde || {};
  const base = {
    id:             r.id,
    nombre:         r.nombre,
    nivel:          r.nivel,
    color:          r.color || '#2D6A4F',
    direccion:      r.direccion,
    activo:         r.activo !== false,
    eliminado:      r.eliminado || false,
    cicloArchivado: r.ciclo_archivado,
  };
  // Si contactos está vacío (registro anterior a la migración), no pisamos los campos
  // de contacto — db.js los preserva desde localStorage hasta que el usuario guarde de nuevo.
  if (!r.contactos || Object.keys(c).length === 0) return base;
  return {
    ...base,
    telefono:             c.telefono              || '',
    director:             c.director              || '',
    telefonoDirector:     c.telefonoDirector       || '',
    mailDirector:         c.mailDirector           || '',
    vicedirector:         c.vicedirector           || '',
    telefonoVicedirector: c.telefonoVicedirector   || '',
    mailVicedirector:     c.mailVicedirector        || '',
    turnoDia: {
      secretaria:         td.secretaria          || '',
      telefonoSecretaria: td.telefonoSecretaria   || '',
      mailSecretaria:     td.mailSecretaria        || '',
      preceptor:          td.preceptor             || '',
      telefonoPreceptor:  td.telefonoPreceptor     || '',
      mailPreceptor:      td.mailPreceptor          || '',
      eoe:                td.eoe                   || [],
    },
    turnoTarde: {
      secretaria:         tt.secretaria          || '',
      telefonoSecretaria: tt.telefonoSecretaria   || '',
      mailSecretaria:     tt.mailSecretaria        || '',
      preceptor:          tt.preceptor             || '',
      telefonoPreceptor:  tt.telefonoPreceptor     || '',
      mailPreceptor:      tt.mailPreceptor          || '',
      eoe:                tt.eoe                   || [],
    },
  };
}

// ── DOCENTES ─────────────────────────────────────────────────
function docParaDB(d) {
  return {
    id:         d.id,
    nombre:     d.nombre    || '',
    materia:    d.materia   || '',
    escuela_id: d.escuelaId || null,
    telefono:   d.telefono  || '',
    mail:       d.mail      || '',
    activo:     d.activo    !== false,
    eliminado:  d.eliminado || false,
  };
}
function docDesdeDB(r) {
  return {
    id:        r.id,
    nombre:    r.nombre,
    materia:   r.materia,
    escuelaId: r.escuela_id,
    telefono:  r.telefono,
    mail:      r.mail,
    activo:    r.activo !== false,
    eliminado: r.eliminado || false,
  };
}

// ── PROFESIONALES ────────────────────────────────────────────
function proParaDB(p) {
  return {
    id:        p.id,
    nombre:    p.nombre   || '',
    rol:       p.rol      || '',
    telefono:  p.telefono || '',
    mail:      p.mail     || '',
    eliminado: p.eliminado || false,
  };
}
function proDesdeDB(r) {
  return {
    id:        r.id,
    nombre:    r.nombre,
    rol:       r.rol,
    telefono:  r.telefono,
    mail:      r.mail,
    eliminado: r.eliminado || false,
  };
}

// ── ALUMNOS ──────────────────────────────────────────────────
// Columnas reales verificadas en Supabase:
// id, nombre, escuela_id, curso, dni, cuil, fecha_nacimiento,
// diagnostico, horarios, tutores, terapias, profesional_ids,
// cud, cud_vencimiento, salud (JSONB), activo, eliminado,
// ciclo_archivado, created_at
// Campos extra van en salud (JSONB): direccion, telefonoCasa,
// obraSocial, nroAfiliado, medicacion, cudNumero, trayectoria, obs
function aluParaDB(a) {
  return {
    id:               a.id,
    nombre:           a.nombre         || '',
    escuela_id:       a.escuelaId      || null,
    curso:            a.curso          || '',
    dni:              a.dni            || '',
    cuil:             a.cuil           || '',
    fecha_nacimiento: a.fechaNacimiento|| null,
    diagnostico:      a.diagnostico    || '',
    horarios:         a.horarios       || [],
    tutores:          a.tutores        || [],
    terapias:         a.terapias       || [],
    profesional_ids:  a.profesionalIds || [],
    cud:              a.cud            || false,
    cud_vencimiento:  a.cudVencimiento || null,
    activo:           a.activo         !== false,
    eliminado:        a.eliminado      || false,
    ciclo_archivado:  a.cicloArchivado || null,
    // Campos sin columna propia → JSONB salud
    salud: {
      direccion:    a.direccion    || '',
      telefonoCasa: a.telefonoCasa || '',
      obraSocial:   a.obraSocial   || '',
      nroAfiliado:  a.nroAfiliado  || '',
      medicacion:   a.medicacion   || '',
      cudNumero:    a.cudNumero    || '',
      trayectoria:  a.trayectoria  || [],
      obs:          a.obs          || '',
    }
  };
}
function aluDesdeDB(r) {
  const s = r.salud || {};
  return {
    id:              r.id,
    nombre:          r.nombre,
    escuelaId:       r.escuela_id,
    curso:           r.curso,
    dni:             r.dni,
    cuil:            r.cuil,
    fechaNacimiento: r.fecha_nacimiento,
    diagnostico:     r.diagnostico,
    horarios:        r.horarios        || [],
    tutores:         r.tutores         || [],
    terapias:        r.terapias        || [],
    profesionalIds:  r.profesional_ids || [],
    cud:             r.cud             || false,
    cudVencimiento:  r.cud_vencimiento,
    activo:          r.activo          !== false,
    eliminado:       r.eliminado       || false,
    cicloArchivado:  r.ciclo_archivado,
    // Desde salud JSONB
    direccion:       s.direccion    || '',
    telefonoCasa:    s.telefonoCasa || '',
    obraSocial:      s.obraSocial   || '',
    nroAfiliado:     s.nroAfiliado  || '',
    medicacion:      s.medicacion   || '',
    cudNumero:       s.cudNumero    || '',
    trayectoria:     s.trayectoria  || [],
    obs:             s.obs          || '',
  };
}

// ── REGISTROS ────────────────────────────────────────────────
// En la app: { alumnoId: [regs] } — diccionario por alumno
// En Supabase: tabla plana con alumno_id en cada fila
// Para save: el cliente manda { ...reg, alumnoId } como un objeto plano
function regParaDB(obj) {
  return {
    id:           obj.id,
    alumno_id:    obj.alumnoId || obj.aluId || null,
    fecha:        obj.fecha,
    materia:      obj.materia      || '',
    asistencia:   obj.asistencia   || 'presente',
    avance:       obj.avance       || '',
    acuerdo:      obj.acuerdo      || '',
    docente:      obj.docente      || '',
    tipo:         obj.tipo         || 'clase',
    recordatorio: obj.recordatorio || '',
    eliminado:    obj.eliminado    || false,
  };
}
function regDesdeDB(r) {
  return {
    id:           r.id,
    aluId:        r.alumno_id,
    fecha:        r.fecha,
    materia:      r.materia,
    asistencia:   r.asistencia,
    avance:       r.avance,
    acuerdo:      r.acuerdo,
    docente:      r.docente,
    tipo:         r.tipo         || 'clase',
    recordatorio: r.recordatorio || '',
    eliminado:    r.eliminado    || false,
  };
}

// ── AVISOS ───────────────────────────────────────────────────
function avisoParaDB(a) {
  return {
    id:        a.id,
    alumno_id: a.alumnoId || null,
    texto:     a.texto    || '',
    fecha:     a.fecha    || null,
    prioridad: a.prioridad|| 'media',
    eliminado: a.eliminado|| false,
  };
}
function avisoDesdeDB(r) {
  return {
    id:        r.id,
    alumnoId:  r.alumno_id,
    texto:     r.texto,
    fecha:     r.fecha,
    prioridad: r.prioridad || 'media',
    eliminado: r.eliminado || false,
  };
}

// ── DOCUMENTOS (PPI / Informes) ──────────────────────────────
function docuParaDB(obj) {
  return {
    id:        obj.id,
    alumno_id: obj.alumnoId,
    ciclo:     obj.ciclo,
    tipo:      obj.tipo,      // 'ppi' | 'medio' | 'final'
    contenido: obj.contenido || {},
    eliminado: obj.eliminado || false,
  };
}
function docuDesdeDB(r) {
  return {
    id:       r.id,
    alumnoId: r.alumno_id,
    ciclo:    r.ciclo,
    tipo:     r.tipo,
    contenido:r.contenido || {},
    eliminado:r.eliminado || false,
  };
}

// ── Mapeo por tabla ───────────────────────────────────────────
const MAPEO = {
  escuelas:      { paraDB: escParaDB,   desdeDB: escDesdeDB   },
  docentes:      { paraDB: docParaDB,   desdeDB: docDesdeDB   },
  profesionales: { paraDB: proParaDB,   desdeDB: proDesdeDB   },
  alumnos:       { paraDB: aluParaDB,   desdeDB: aluDesdeDB   },
  registros:     { paraDB: regParaDB,   desdeDB: regDesdeDB   },
  avisos:        { paraDB: avisoParaDB, desdeDB: avisoDesdeDB },
  documentos:    { paraDB: docuParaDB,  desdeDB: docuDesdeDB  },
};

// ══════════════════════════════════════════════════════════════
// Auth: verificación server-side del JWT de Google
// ══════════════════════════════════════════════════════════════
app.post('/api/verify-token', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  if (await rateLimit(`login:${ip}`, 10, 60_000)) // máx 10 intentos por minuto por IP
    return res.status(429).json({ error: 'Demasiados intentos. Esperá un minuto.' });
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'credential requerido' });

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch (googleErr) {
      console.error('[verify-token] Google verifyIdToken error:', googleErr.message);
      return res.status(401).json({ error: 'Token de Google inválido o expirado.' });
    }
    const payload = ticket.getPayload();
    const email = (payload.email || '').toLowerCase().trim();

    // Admins globales: acceso sin restricciones a todos los datos
    const esAdmin = ADMINS.includes(email);

    let orgId = null;
    let nombreDocente = payload.name;
    let acceso = null;

    if (esAdmin) {
      // Admin entra sin verificación de suscripción
      // Buscar su org en el SaaS central para filtrar datos propios (no ve datos de otros)
      try {
        const resultadoAdmin = await verificarAccesoCentral(email, 'docentes');
        const accesoAdmin = Array.isArray(resultadoAdmin) ? (resultadoAdmin[0] || null) : resultadoAdmin;
        orgId = accesoAdmin?.ret_org_id || accesoAdmin?.org_id || null;
      } catch {
        orgId = null; // sin org registrada — acceso sin filtro solo como último recurso
      }
    } else {
      // Verificar acceso en el SaaS central
      try {
        const resultado = await verificarAccesoCentral(email.toLowerCase().trim(), 'docentes');
        acceso = Array.isArray(resultado) ? (resultado[0] || null) : resultado;
        console.log(`[verify-token] SaaS resultado para ${email}:`, JSON.stringify(acceso));
      } catch (e) {
        console.error('[verify-token] SaaS central error:', e.message);
        return res.status(503).json({ error: 'No se pudo verificar el acceso. Intentá de nuevo.' });
      }

      if (!acceso || !acceso.tiene_acceso) {
        const motivos = {
          sin_cuenta:       'Tu cuenta no está registrada en el sistema.',
          sin_organizacion: 'No tenés una organización asignada. Contactá al administrador.',
          sin_suscripcion:  'No tenés una suscripción activa para esta app.',
          impago:           'Tu suscripción está vencida. Contactá al administrador.',
          suspendido:       'Tu acceso está suspendido. Contactá al administrador.',
          desconocido:      'Tu cuenta no tiene acceso a esta app. Contactá al administrador.',
        };
        const motivo = acceso?.motivo || 'desconocido';
        console.warn(`[verify-token] Acceso denegado para ${email} — motivo: ${motivo}`);
        return res.status(403).json({ error: motivos[motivo] || `Acceso denegado. Contactá al administrador.` });
      }

      orgId = acceso.ret_org_id || acceso.org_id || null;

      // Guard crítico: si no hay org_id la docente vería datos de todos — bloqueamos
      if (!orgId) {
        console.warn(`[verify-token] Sin org_id para ${email} — acceso bloqueado`);
        return res.status(403).json({ error: 'Tu cuenta no tiene una organización asignada. Contactá al administrador.' });
      }

      // Usar el nombre cargado en el panel admin (nombre_docente de organizaciones)
      if (acceso.nombre_docente) {
        nombreDocente = acceso.nombre_docente;
      }
    }

    const planRaw = esAdmin ? 'premium' : (acceso.plan || 'basico');
    // 'sincargo' = premium sin costo — mismos permisos que premium
    const plan = planRaw === 'sincargo' ? 'premium' : planRaw;
    const sessionToken = crearToken(email, nombreDocente, payload.picture, orgId, plan);
    res.json({
      ok: true,
      sessionToken,
      nombre: nombreDocente,
      email,
      foto: payload.picture,
      orgId,
      plan,
      esAdmin,
      acceso: esAdmin ? { estado: 'activo', diasRestantes: null } : {
        estado: acceso.estado,
        diasRestantes: acceso.dias_restantes ?? null,
      },
    });
  } catch (e) {
    console.error('[verify-token]', e.message);
    res.status(401).json({ error: 'Token de Google inválido o expirado.' });
  }
});

// ══════════════════════════════════════════════════════════════
// Claude API proxy
// ══════════════════════════════════════════════════════════════
const SYSTEM_PERFIL = `Sos un Asesor Psicopedagógico Experto y Supervisor de la Dirección de Educación Especial de la Provincia de Buenos Aires (DGCyE), Argentina. Trabajás junto a Ayelén Florentin, Docente de Inclusión (AP). Pensás, redactás y estructurás todas tus sugerencias, informes y análisis bajo el marco de la Resolución 1664/17 y normativas bonaerenses vigentes.

TERMINOLOGÍA OBLIGATORIA — NUNCA uses los términos de la columna izquierda:
- "Maestra Integradora" → decí "Docente de Inclusión" o "AP"
- "Adaptación Curricular" → decí "Ajustes razonables"
- "Discapacitado / Enfermito / Retraso / Defecto" → decí "Alumno con discapacidad" o "Barreras al Aprendizaje y la Participación (BAP)"
- "Gabinete" → decí "EOE" (Equipo de Orientación Escolar) o "EDI" (Equipo Interdisciplinario)
- "Grado" (secundaria) → decí "Año" y "División"
- "Asignatura / Boleta / Colegio / Maestro" → decí "Materia / Boletín / Escuela / Docente"

MARCO FILOSÓFICO:
1. Modelo Social de la Discapacidad: el entorno genera Barreras (BAP), no el alumno. Sugerí configuraciones de apoyo materiales, metodológicas u organizativas para romper esas barreras.
2. Foco en autonomía: registrá apoyos visuales, agendas de anticipación, flexibilización de tiempos y formas de evaluación alternativas (orales, gráficos, etc.).
3. Articulación inclusiva: Aye trabaja en pareja pedagógica con el Docente de Grado (primaria) o Profesor de Materia (secundaria). Tus consejos deben facilitar esa convivencia y no aislar al alumno.

TONO: Profesional, empático, técnico-pedagógico impecable. El texto debe poder copiarse directamente en un informe formal para un Inspector o Director.`;

app.post('/api/claude', requireAuth, async (req, res) => {
  const emailKey = req.session?.email || req.ip;
  if (await rateLimit(`claude:${emailKey}`, 20, 60_000)) // máx 20 llamadas por minuto por usuario
    return res.status(429).json({ error: 'Límite de consultas alcanzado. Esperá un momento.' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' });
  try {
    // Personalizar el system prompt con el nombre real de la docente
    const nombreDocente = req.session.nombre || 'la Docente de Inclusión';
    const systemPersonalizado = SYSTEM_PERFIL.replace(
      'Ayelén Florentin, Docente de Inclusión (AP)',
      `${nombreDocente}, Docente de Inclusión (AP)`
    );
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: Math.min(req.body.max_tokens || 1000, 2500),
        system:     systemPersonalizado,
        messages:   req.body.messages,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('[Claude API error]', response.status, JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || JSON.stringify(data) });
    }
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// ══════════════════════════════════════════════════════════════
// Supabase DB endpoints — GET / POST / DELETE genéricos
// ══════════════════════════════════════════════════════════════
const TABLAS = ['escuelas','docentes','profesionales','alumnos','registros','avisos','documentos'];

TABLAS.forEach(tabla => {

  // GET — lee y convierte snake_case → camelCase, filtrado por org_id
  app.get(`/api/db/${tabla}`, requireAuth, async (req, res) => {
    try {
      let query = getDb(req.orgId).from(tabla).select('*');
      if (req.orgId) query = query.eq('org_id', req.orgId);
      // Excluir registros borrados — incluye null (registros sin el campo seteado)
      query = query.or('eliminado.eq.false,eliminado.is.null');
      // Filtros opcionales por query params
      if (req.query.alumno_id) query = query.eq('alumno_id', req.query.alumno_id);
      if (req.query.desde)     query = query.gte('fecha', req.query.desde);
      if (req.query.hasta)     query = query.lte('fecha', req.query.hasta);
      // Límite de seguridad por tabla — evita corte silencioso de Supabase (default 1000)
      const LIMITES = { registros: 5000, avisos: 1000, documentos: 500 };
      query = query.limit(LIMITES[tabla] || 2000);
      const { data, error } = await query;
      if (error) throw error;
      const m = MAPEO[tabla];
      res.json(m ? data.map(m.desdeDB) : data);
    } catch(e) {
      console.error(`[GET] ${tabla}:`, e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // POST — convierte camelCase → snake_case, inyecta org_id, auto-strip columnas inexistentes
  app.post(`/api/db/${tabla}`, requireAuth, async (req, res) => {
    try {
      const m = MAPEO[tabla];
      let body = m ? m.paraDB(req.body) : req.body;
      // Siempre inyectar org_id del token — no se puede falsificar desde el cliente
      if (req.orgId) body = { ...body, org_id: req.orgId };
      // Auto-strip: si Supabase rechaza un campo, lo quitamos y reintentamos
      const db = getDb(req.orgId);
      for(let i = 0; i < 5; i++) {
        const { data, error } = await db.from(tabla).upsert(body).select();
        if(!error) return res.json(m ? data.map(m.desdeDB) : data);
        const colMatch = error.message && error.message.match(/Could not find the '([^']+)' column/);
        if(colMatch) {
          const campo = colMatch[1];
          console.warn(`[DB] strip column '${campo}' de '${tabla}'`);
          const { [campo]: _, ...resto } = body;
          body = resto;
          continue;
        }
        // FK constraint → poner a null el campo FK y reintentar
        const fkMatch = error.message && error.message.match(/violates foreign key constraint/);
        if(fkMatch) {
          console.warn(`[DB] FK constraint en '${tabla}', limpiando escuela_id`);
          body = { ...body, escuela_id: null };
          continue;
        }
        throw error;
      }
      throw new Error('Demasiados reintentos en ' + tabla);
    } catch(e) {
      console.error(`[POST] ${tabla}:`, e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE — soft delete, verificar org_id
  app.delete(`/api/db/${tabla}/:id`, requireAuth, async (req, res) => {
    try {
      let q = getDb(req.orgId).from(tabla).update({ eliminado: true }).eq('id', req.params.id);
      if (req.orgId) q = q.eq('org_id', req.orgId); // solo puede borrar lo suyo
      const { data, error } = await q.select();
      if (error) throw error;
      res.json(data);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
});

// ══════════════════════════════════════════════════════════════
// POST /api/db/registros/bulk — guarda array de registros de un alumno
// Body: { alumnoId, registros: [] }
// ══════════════════════════════════════════════════════════════
app.post('/api/db/registros/bulk', requireAuth, async (req, res) => {
  try {
    const { alumnoId, registros } = req.body;
    if (!alumnoId || !Array.isArray(registros)) return res.status(400).json({ error: 'alumnoId y registros requeridos' });
    const rows = registros.map(r => ({ ...regParaDB({ ...r, alumnoId }), ...(req.orgId ? { org_id: req.orgId } : {}) }));
    const { data, error } = await getDb(req.orgId).from('registros').upsert(rows).select();
    if (error) throw error;
    res.json({ ok: true, insertados: data.length });
  } catch(e) {
    console.error('[registros/bulk]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/seed — carga masiva de datos demo
// Body: { tabla, items: [] }
// ══════════════════════════════════════════════════════════════
// /api/seed deshabilitado en producción
app.post('/api/seed', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'No disponible en producción' });
  next();
}, requireAuth, async (req, res) => {
  try {
    const { tabla, items } = req.body;
    if (!tabla || !Array.isArray(items)) return res.status(400).json({ error: 'tabla e items requeridos' });
    const m = MAPEO[tabla];
    let rows = m ? items.map(m.paraDB) : items;
    // Auto-strip columnas inexistentes + manejo FK
    for(let i = 0; i < 5; i++) {
      const { data, error } = await supabase.from(tabla).upsert(rows).select();
      if(!error) return res.json({ ok: true, insertados: data.length });
      const colMatch = error.message && error.message.match(/Could not find the '([^']+)' column/);
      if(colMatch) {
        const campo = colMatch[1];
        console.warn(`[seed] strip '${campo}' de '${tabla}'`);
        rows = rows.map(r => { const { [campo]: _, ...resto } = r; return resto; });
        continue;
      }
      const fkMatch = error.message && error.message.match(/violates foreign key constraint/);
      if(fkMatch) {
        console.warn(`[seed] FK constraint en '${tabla}', limpiando FK fields`);
        rows = rows.map(r => ({ ...r, escuela_id: null, alumno_id: null }));
        continue;
      }
      throw error;
    }
    throw new Error('Demasiados reintentos en seed ' + tabla);
  } catch(e) {
    console.error('[seed]', tabla, e.message);
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════
// Health check
// ══════════════════════════════════════════════════════════════
app.get('/api/health', requireAuth, async (req, res) => {
  const { error } = await supabase.from('escuelas').select('count').limit(1);
  res.json({ status: 'ok', supabase: error ? 'error' : 'conectado', timestamp: new Date().toISOString() });
});

// ══════════════════════════════════════════════════════════════
// Páginas
// ══════════════════════════════════════════════════════════════
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => {
  console.log(`Aye app corriendo en http://localhost:${PORT}`);
});
