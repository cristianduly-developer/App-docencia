// v2
const express  = require('express');
const cors     = require('cors');
const fetch    = require('node-fetch');
const path     = require('path');
const crypto   = require('crypto');
const { createClient }  = require('@supabase/supabase-js');
const { OAuth2Client }  = require('google-auth-library');

const helmet      = require('helmet');
const compression = require('compression');
const app    = express();
const PORT   = process.env.PORT || 3000;

app.use(compression());                            // gzip en todas las respuestas
app.use(helmet({ contentSecurityPolicy: false })); // security headers: HSTS, X-Frame-Options, etc.

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

// ── Cliente Supabase central (SaaS) ───────────────────────────
const stripBOM = s => (s || '').replace(/^﻿/, '').trim();
const CENTRAL_URL         = 'https://ngymvfvlknaltsvsrvjm.supabase.co';
const CENTRAL_KEY         = process.env.CENTRAL_SUPABASE_KEY;
const CENTRAL_SERVICE_KEY = process.env.CENTRAL_SUPABASE_SERVICE_KEY || process.env.CENTRAL_SERVICE_KEY || '';
if (!CENTRAL_KEY) throw new Error('CENTRAL_SUPABASE_KEY env var es requerida');
const DEMO_DIAS           = parseInt(process.env.DEMO_DIAS || '28', 10);
const APP_ID_DOCENTE      = 'docentes';
const OWNER_ID            = 'd8eef2e2-7e07-4ec9-9c6e-766addf89cc5';

const centralAdmin = () => CENTRAL_SERVICE_KEY
  ? createClient(CENTRAL_URL, CENTRAL_SERVICE_KEY)
  : null;

async function verificarAccesoCentral(email, appId) {
  const key = CENTRAL_SERVICE_KEY || CENTRAL_KEY;
  const res = await fetch(`${CENTRAL_URL}/rest/v1/rpc/verificar_acceso_email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ email_param: email, app_id_param: appId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || JSON.stringify(data));
  return data;
}

// ── CORS: dominios permitidos (agregar en env var ALLOWED_ORIGINS separados por coma) ──
const ORIGINS_EXTRA = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const ORIGINS_PERMITIDOS = [
  'https://aye-app-one.vercel.app',
  ...ORIGINS_EXTRA,
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:5173'] : []),
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ORIGINS_PERMITIDOS.includes(origin)) cb(null, true);
    else cb(new Error('CORS: origen no permitido'));
  }
}));

app.use(express.json({ limit: '5mb' }));
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
  if (!process.env.SUPABASE_KEY) throw new Error('SUPABASE_KEY no configurada — no se puede operar sin credenciales');
  return supabase; // fallback: service key solo si RLS no está disponible
}

// ── Admins globales del sistema ───────────────────────────────
const ADMINS = (process.env.ADMIN_EMAILS || 'cristianduly@gmail.com')
  .split(',').map(e => e.trim()).filter(Boolean);

// ── Token HMAC firmado — sin estado en servidor (funciona en serverless) ──
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas — jornada docente completa
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
        // Demo vencido: tiene suscripción pero expiró
        if (acceso && acceso.estado === 'demo' && (acceso.dias_restantes ?? 0) <= 0) {
          return res.status(403).json({ code: 'demo_vencido', error: 'Tu período de prueba venció.', email, nombre: payload.name, orgId: acceso.ret_org_id || acceso.org_id || null });
        }
        if (acceso && acceso.estado === 'impago') {
          return res.status(403).json({ code: 'impago', error: 'Tu suscripción está vencida.', email, nombre: payload.name, orgId: acceso.ret_org_id || acceso.org_id || null });
        }
        // Sin cuenta — verificar si está suspendido (el RPC filtra suspendidos)
        const central = centralAdmin();
        if (central) {
          const { data: empData } = await central
            .from('empleados_organizacion')
            .select('org_id')
            .eq('email', email)
            .limit(1);
          if (empData?.length > 0) {
            const { data: subData } = await central
              .from('suscripciones_apps')
              .select('estado')
              .eq('org_id', empData[0].org_id)
              .eq('app_id', APP_ID_DOCENTE)
              .in('estado', ['suspendido', 'impago'])
              .limit(1)
              .maybeSingle();
            if (subData?.estado) {
              return res.status(403).json({ code: subData.estado, error: 'Tu acceso está suspendido. Contactá al administrador.', email, nombre: payload.name });
            }
          }
        }
        // Usuario nuevo sin cuenta
        console.warn(`[verify-token] Sin cuenta para ${email}`);
        return res.status(403).json({ code: 'sin_cuenta', error: 'Sin cuenta', email, nombre: payload.name });
      }

      orgId = acceso.ret_org_id || acceso.org_id || null;

      // Actualizar ultimo_acceso e incrementar cant_sesiones en login real
      if (orgId) {
        const central = centralAdmin();
        if (central) {
          central.from('suscripciones_apps')
            .select('cant_sesiones')
            .eq('app_id', APP_ID_DOCENTE)
            .eq('org_id', orgId)
            .maybeSingle()
            .then(({ data }) => {
              central.from('suscripciones_apps')
                .update({
                  ultimo_acceso: new Date().toISOString(),
                  cant_sesiones: (data?.cant_sesiones ?? 0) + 1,
                })
                .eq('app_id', APP_ID_DOCENTE)
                .eq('org_id', orgId)
                .then(() => {});
            });
        }
      }

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
      acceso: esAdmin ? { estado: 'activo', diasRestantes: null, fechaFin: null, mpPreapprovalId: null } : {
        estado: acceso.estado,
        diasRestantes: acceso.dias_restantes ?? null,
        fechaFin: acceso.fecha_fin ?? null,
        mpPreapprovalId: acceso.mp_preapproval_id ?? null,
      },
    });
  } catch (e) {
    console.error('[verify-token]', e.message);
    res.status(401).json({ error: 'Token de Google inválido o expirado.' });
  }
});

// ══════════════════════════════════════════════════════════════
// Registro demo automático
// ══════════════════════════════════════════════════════════════
app.post('/api/registrar-demo', async (req, res) => {
  try {
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ ok: false, error: 'no_credential' });

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    } catch {
      return res.status(401).json({ ok: false, error: 'token_invalido' });
    }
    const payload = ticket.getPayload();
    const email = (payload.email || '').toLowerCase().trim();

    const central = centralAdmin();
    if (!central) {
      console.error('[registrar-demo] CENTRAL_SERVICE_KEY no configurada');
      return res.status(500).json({ ok: false, error: 'config_error' });
    }

    const nombre = payload.name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const { data: rpcResult, error: rpcErr } = await central.rpc('registrar_demo', {
      p_email:     email,
      p_nombre:    nombre,
      p_app_id:    APP_ID_DOCENTE,
      p_owner_id:  OWNER_ID,
      p_demo_dias: DEMO_DIAS,
    });

    if (rpcErr) {
      console.error('[registrar-demo] Error RPC:', rpcErr);
      return res.status(500).json({ ok: false, error: 'error_central' });
    }

    if (rpcResult?.ya_existe) return res.json({ ok: true, ya_existe: true });

    const orgId = rpcResult?.org_id;

    const central2 = centralAdmin();
    if (central2) {
      central2.from('notificaciones_admin').insert({
        tipo: 'nueva_org',
        mensaje: `Nueva cuenta demo en App Docentes — ${nombre} (${email})`,
        org_id: orgId,
        app_id: APP_ID_DOCENTE,
      }).then(() => {});
    }

    try {
      const fechaAlta = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
      const mailFrom = process.env.MAIL_FROM || 'onboarding@resend.dev';
      const appUrl = 'https://docentes.solucionesmdp.com.ar';

      const bienvenidaHtml = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#7c3aed;padding:32px 24px;text-align:center;">
            <div style="font-size:40px;">📚</div>
            <h1 style="color:white;margin:8px 0 4px;font-size:22px;">App Docentes</h1>
            <p style="color:rgba(255,255,255,.85);margin:0;font-size:14px;">Soluciones MDP</p>
          </div>
          <div style="padding:32px 24px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">¡Hola, ${nombre}!</h2>
            <p style="color:#374151;margin:0 0 24px;font-size:15px;line-height:1.6;">
              Tu prueba gratuita de <strong>${DEMO_DIAS} días</strong> ya está activa. Podés empezar a generar tus informes ahora mismo.
            </p>
            <div style="background:#f9fafb;border-radius:10px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-weight:700;color:#111827;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">¿Qué podés hacer?</p>
              <p style="margin:0 0 8px;color:#374151;font-size:14px;">✅ Redactar informes psicopedagógicos con IA</p>
              <p style="margin:0 0 8px;color:#374151;font-size:14px;">✅ Gestionar alumnos y hacer seguimiento</p>
              <p style="margin:0 0 0;color:#374151;font-size:14px;">✅ Armar horarios y organizar tu agenda</p>
            </div>
            <div style="text-align:center;">
              <a href="${appUrl}" style="display:inline-block;background:#7c3aed;color:white;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Abrir App Docentes →</a>
            </div>
            <div style="text-align:center;margin-top:12px;">
              <a href="${appUrl}/ayuda" style="display:inline-block;background:#f3f4f6;color:#374151;padding:10px 24px;border-radius:10px;font-weight:600;font-size:13px;text-decoration:none;">📖 ¿No sabés por dónde empezar? Ver guía de ayuda</a>
            </div>
          </div>
          <div style="border-top:1px solid #f1f5f9;padding:20px 24px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">Soluciones MDP · <a href="https://wa.me/5492235767784" style="color:#9ca3af;">WhatsApp</a> · <a href="https://www.instagram.com/soluciones_mdp" style="color:#9ca3af;">Instagram</a> · <a href="https://www.facebook.com/share/1D7keoQJe1/" style="color:#9ca3af;">Facebook</a></p><p style="margin:4px 0 0;color:#9ca3af;font-size:11px;text-align:center;">Seguinos en nuestras redes para enterarte de novedades y tips</p>
          </div>
        </div>`;

      await Promise.all([
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: mailFrom,
            to: email,
            subject: `¡Bienvenido/a a App Docentes! Tu prueba de ${DEMO_DIAS} días está activa`,
            html: bienvenidaHtml,
          }),
        }),
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: mailFrom,
            to: 'cristianduly@gmail.com',
            subject: `🆕 Nueva cuenta demo — ${payload.name ?? email}`,
            html: `<h2>🆕 Nueva cuenta demo en App Docentes</h2>
              <table style="border-collapse:collapse;font-family:sans-serif;">
                <tr><td style="padding:8px;font-weight:bold;">Nombre</td><td style="padding:8px;">${payload.name ?? '—'}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">App</td><td style="padding:8px;">Docentes</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Plan</td><td style="padding:8px;">Profesional (demo)</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Días de prueba</td><td style="padding:8px;">${DEMO_DIAS} días</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Fecha de alta</td><td style="padding:8px;">${fechaAlta}</td></tr>
              </table>`,
          }),
        }),
      ]);
    } catch (mailErr) {
      console.error('[registrar-demo] Error Resend:', mailErr?.message || mailErr);
    }

    console.log(`[registrar-demo] Demo creado para ${email} — org ${orgId}`);
    res.json({ ok: true });
  } catch (e) {
    console.error('[registrar-demo]', e.message);
    res.status(500).json({ ok: false, error: 'interno' });
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
  const orgKey   = req.orgId || emailKey;
  if (await rateLimit(`claude:min:${emailKey}`, 20, 60_000))
    return res.status(429).json({ error: 'Límite de consultas alcanzado. Esperá un momento.' });
  if (await rateLimit(`claude:dia:${orgKey}`, 150, 24*60*60_000))
    return res.status(429).json({ error: 'Límite diario de consultas IA alcanzado.' });
  if (await rateLimit(`claude:mes:${orgKey}`, 2000, 30*24*60*60_000))
    return res.status(429).json({ error: 'Límite mensual de consultas IA alcanzado. Contactá al administrador.' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' });

  // Validar estructura de messages — previene prompt injection y mal uso
  const msgs = req.body.messages;
  if (!Array.isArray(msgs) || msgs.length === 0 || msgs.length > 10)
    return res.status(400).json({ error: 'Formato de mensaje inválido.' });
  for (const m of msgs) {
    if (!m || !['user','assistant'].includes(m.role))
      return res.status(400).json({ error: 'Rol de mensaje inválido.' });
    if (typeof m.content === 'string' && m.content.length > 8000)
      return res.status(400).json({ error: 'Mensaje demasiado largo.' });
    if (!Array.isArray(m.content) && typeof m.content !== 'string')
      return res.status(400).json({ error: 'Formato de mensaje inválido.' });
  }

  try {
    const nombreDocente = req.session.nombre || 'la Docente de Inclusión';
    const systemPersonalizado = SYSTEM_PERFIL.replace(
      'Ayelén Florentin, Docente de Inclusión (AP)',
      `${nombreDocente.replace(/[<>]/g, '')}, Docente de Inclusión (AP)`
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
        messages:   msgs,
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
const TABLAS = ['escuelas','docentes','profesionales','alumnos','registros','avisos','documentos','perfiles'];

TABLAS.forEach(tabla => {

  // GET — lee y convierte snake_case → camelCase, filtrado por org_id
  app.get(`/api/db/${tabla}`, requireAuth, async (req, res) => {
    try {
      // Cache de 2 min para tablas que cambian poco — ahorra round-trips a Supabase
      const TABLAS_CACHE = ['escuelas','docentes','profesionales'];
      if (TABLAS_CACHE.includes(tabla)) {
        res.set('Cache-Control', 'private, max-age=120');
      }
      if (!req.orgId) return res.status(403).json({ error: 'sin_org' });
      let query = getDb(req.orgId).from(tabla).select('*');
      query = query.eq('org_id', req.orgId);
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
    // Validar tamaño del body — previene payloads gigantes
    if (!req.body || typeof req.body !== 'object')
      return res.status(400).json({ error: 'Body inválido.' });
    const bodyStr = JSON.stringify(req.body);
    if (bodyStr.length > 64_000)
      return res.status(400).json({ error: 'Payload demasiado grande.' });
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
        // FK constraint — no silenciar, devolver error claro al cliente
        const fkMatch = error.message && error.message.match(/violates foreign key constraint/);
        if(fkMatch) {
          console.error(`[DB] FK constraint en '${tabla}':`, error.message);
          return res.status(400).json({ error: 'Referencia inválida — verificá que la escuela o docente exista.' });
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
// Ping de presencia — actualiza ultimo_acceso en el SaaS central
app.get('/api/presencia', requireAuth, async (req, res) => {
  const { orgId } = req;
  if (orgId) {
    const central = centralAdmin();
    if (central) {
      central.from('suscripciones_apps')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('app_id', APP_ID_DOCENTE)
        .eq('org_id', orgId)
        .then(() => {});
    }
  }
  res.json({ ok: true });
});

app.get('/api/health', requireAuth, async (req, res) => {
  const { error } = await supabase.from('escuelas').select('count').limit(1);
  res.json({ status: 'ok', supabase: error ? 'error' : 'conectado', timestamp: new Date().toISOString() });
});

// ══════════════════════════════════════════════════════════════
// Mercado Pago — proxy seguro (orgId viene del token, no del cliente)
// ══════════════════════════════════════════════════════════════
async function _proxyMpCrear(orgId, plan, res) {
  const saasUrl = process.env.SAAS_ADMIN_URL || 'https://saas-admin-panel.vercel.app';
  try {
    const r = await fetch(`${saasUrl}/api/mp-crear-suscripcion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, app_id: APP_ID_DOCENTE, plan }),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    console.error('[mp-crear-suscripcion]', e.message);
    return res.status(500).json({ error: 'Error al conectar con el servicio de pagos.' });
  }
}

// Endpoint autenticado — usado desde dentro de la app (MiPlan)
app.post('/api/mp-crear-suscripcion', requireAuth, async (req, res) => {
  const { plan } = req.body || {};
  if (!plan) return res.status(400).json({ error: 'plan requerido' });
  const orgId = req.orgId;
  if (!orgId) return res.status(403).json({ error: 'sin_org' });
  return _proxyMpCrear(orgId, plan, res);
});

// Precios de planes — público, sin auth
app.get('/api/planes-precios', async (req, res) => {
  const central = centralAdmin()
  if (!central) return res.status(500).json({ error: 'sin_central' })
  const { data, error } = await central
    .from('planes_precios')
    .select('plan, precio_mensual, beneficios')
    .eq('app_id', APP_ID_DOCENTE)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ ok: true, planes: data || [] })
})

// Endpoint público — usado desde la pantalla de login (demo vencido / suspendido)
// El org_id viene del servidor en la respuesta 403, no puede ser adivinado (UUID)
app.post('/api/mp-pago-publico', async (req, res) => {
  const { org_id, plan } = req.body || {};
  if (!org_id || !plan) return res.status(400).json({ error: 'org_id y plan requeridos' });
  return _proxyMpCrear(org_id, plan, res);
});

app.post('/api/mp-cancelar-suscripcion', requireAuth, async (req, res) => {
  const orgId = req.orgId;
  if (!orgId) return res.status(403).json({ error: 'sin_org' });

  const central = centralAdmin();
  if (!central) return res.status(500).json({ error: 'sin_central' });

  const { data: sub } = await central
    .from('suscripciones_apps')
    .select('mp_preapproval_id')
    .eq('org_id', orgId)
    .eq('app_id', APP_ID_DOCENTE)
    .maybeSingle();

  if (!sub?.mp_preapproval_id) {
    return res.status(404).json({ error: 'No hay suscripción activa con débito automático.' });
  }

  const mpToken = process.env.MP_ACCESS_TOKEN;
  try {
    const r = await fetch(`https://api.mercadopago.com/preapproval/${sub.mp_preapproval_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mpToken}` },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (!r.ok) {
      const err = await r.json();
      console.error('[mp-cancelar]', err);
      return res.status(500).json({ error: 'Error al cancelar en Mercado Pago.' });
    }
    // El webhook mp-webhook.js recibirá preapproval.cancelled y actualizará el estado en DB.
    // También lo actualizamos aquí para respuesta inmediata.
    await central.from('suscripciones_apps')
      .update({ estado: 'cancelado', mp_preapproval_id: null })
      .eq('org_id', orgId)
      .eq('app_id', APP_ID_DOCENTE);
    return res.json({ ok: true });
  } catch (e) {
    console.error('[mp-cancelar-suscripcion]', e.message);
    return res.status(500).json({ error: 'Error al cancelar la suscripción.' });
  }
});

// ══════════════════════════════════════════════════════════════
// Páginas
// ══════════════════════════════════════════════════════════════
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => {
  console.log(`Aye app corriendo en http://localhost:${PORT}`);
});
