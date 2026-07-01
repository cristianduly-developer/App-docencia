import React, { useState, useEffect, useRef } from 'react';
import { G, GR, GL, TX, FO, TEMAS_COLOR } from '../../constants';
import { setSessionToken } from '../../utils/session';
import { GOOGLE_CLIENT_ID } from '../../constants';

const WA_SOPORTE = '5492235767784';

export default function PantallaLogin({ onLogin }) {
  const [cargando,    setCargando]    = useState(false);
  const [error,       setError]       = useState("");
  const [pantalla,    setPantalla]    = useState('login'); // 'login' | 'registro' | 'demo_vencido' | 'suspendido'
  const [datosSin,    setDatosSin]    = useState(null);   // { email, nombre, credential }
  const [colorActivo, setColorActivo] = useState(localStorage.getItem('aye_color_tema') || '#2D6A4F');
  const gBtnRef = useRef(null);

  const cambiarColor = (hex) => {
    const tema = TEMAS_COLOR.find(t => t.hex === hex);
    localStorage.setItem('aye_color_tema', hex);
    if (tema) localStorage.setItem('aye_color_dark', tema.dark);
    window.location.reload();
  };

  useEffect(() => {
    const init = () => {
      if (!window.google || window._gsiIniciado) return;
      window._gsiIniciado = true;

      const callback = async (resp) => {
        setCargando(true);
        setError("");
        try {
          const res = await fetch("/api/verify-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: resp.credential }),
          });
          const data = await res.json();

          if (!res.ok) {
            // Determinar qué pantalla mostrar según el código
            if (data.code === 'sin_cuenta') {
              setDatosSin({ email: data.email, nombre: data.nombre, credential: resp.credential });
              setPantalla('registro');
              setCargando(false);
              return;
            }
            if (data.code === 'demo_vencido') {
              setDatosSin({ email: data.email, nombre: data.nombre, orgId: data.orgId });
              setPantalla('demo_vencido');
              setCargando(false);
              return;
            }
            if (data.code === 'impago' || data.code === 'suspendido') {
              setDatosSin({ email: data.email, nombre: data.nombre, estado: data.code, orgId: data.orgId });
              setPantalla('suspendido');
              setCargando(false);
              return;
            }
            setError(`❌ ${data.error || "Sin acceso"}`);
            setCargando(false);
            return;
          }

          setSessionToken(data.sessionToken);
          onLogin({
            nombre: data.nombre,
            email:  data.email,
            foto:   data.foto,
            orgId:  data.orgId  || null,
            plan:   data.plan   || 'basico',
            acceso: data.acceso,
          });
        } catch {
          setError("Error de conexión al verificar tu cuenta.");
          setCargando(false);
        }
        setCargando(false);
      };

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback,
      });

      if (gBtnRef.current) {
        window.google.accounts.id.renderButton(gBtnRef.current, {
          theme:         "outline",
          size:          "large",
          width:         300,
          text:          "continue_with",
          shape:         "rectangular",
          logo_alignment:"left",
        });
      }
    };

    if (window.google) {
      init();
    } else {
      const t = setInterval(() => {
        if (window.google) { clearInterval(t); init(); }
      }, 200);
      return () => clearInterval(t);
    }
  }, []);

  // ── Pantalla registro ──────────────────────────────────────
  if (pantalla === 'registro') {
    return <PantallaRegistro
      email={datosSin?.email}
      nombre={datosSin?.nombre}
      credential={datosSin?.credential}
      color={colorActivo}
      onRegistrado={async (credential) => {
        setCargando(true);
        try {
          const res = await fetch("/api/verify-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential }),
          });
          const data = await res.json();
          if (!res.ok) {
            setPantalla('login');
            setError("Hubo un error al activar tu cuenta. Intentá de nuevo.");
            window._gsiIniciado = false;
            setCargando(false);
            return;
          }
          setSessionToken(data.sessionToken);
          onLogin({
            nombre: data.nombre,
            email:  data.email,
            foto:   data.foto,
            orgId:  data.orgId || null,
            plan:   data.plan  || 'basico',
            acceso: data.acceso,
          });
        } catch {
          setPantalla('login');
          setError("Error de conexión. Intentá de nuevo.");
          window._gsiIniciado = false;
          setCargando(false);
        }
      }}
      onVolver={() => { setPantalla('login'); window._gsiIniciado = false; }}
    />;
  }

  if (pantalla === 'demo_vencido') {
    return <PantallaDemoVencido email={datosSin?.email} orgId={datosSin?.orgId} color={colorActivo}
      onVolver={() => { setPantalla('login'); window._gsiIniciado = false; }} />;
  }

  if (pantalla === 'suspendido') {
    return <PantallaSuspendida email={datosSin?.email} orgId={datosSin?.orgId} estado={datosSin?.estado} color={colorActivo}
      onVolver={() => { setPantalla('login'); window._gsiIniciado = false; }} />;
  }

  // ── Pantalla login principal ───────────────────────────────
  return (
    <div style={{
      maxWidth:420, margin:"0 auto", minHeight:"100vh",
      background:"#fff", display:"flex", flexDirection:"column",
      fontFamily:"'Georgia',serif", position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", top:-80, right:-80, width:260, height:260,
        borderRadius:"50%", background:colorActivo, opacity:.06 }}/>
      <div style={{ position:"absolute", bottom:-60, left:-60, width:200, height:200,
        borderRadius:"50%", background:colorActivo, opacity:.08 }}/>
      <div style={{ position:"absolute", top:"30%", left:-40, width:120, height:120,
        borderRadius:"50%", background:colorActivo, opacity:.05 }}/>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", padding:"40px 32px", position:"relative", zIndex:1 }}>

        <div style={{ marginBottom:40, textAlign:"center" }}>
          <div style={{
            width:80, height:80, borderRadius:"50%",
            background:`linear-gradient(135deg,${colorActivo},${colorActivo}bb)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, fontWeight:800, color:"#fff",
            margin:"0 auto 20px",
            boxShadow:`0 8px 32px ${colorActivo}44`,
          }}>📚</div>
          <div style={{ fontSize:22, fontWeight:800, color:TX, marginBottom:6 }}>
            App de Gestión Docente
          </div>
          <div style={{ fontSize:14, color:GR, lineHeight:1.6, maxWidth:280, margin:"0 auto" }}>
            Modalidad Especial · Buenos Aires
          </div>
        </div>

        <div style={{ width:48, height:3,
          background:`linear-gradient(90deg,${colorActivo},${colorActivo}44)`, borderRadius:2, marginBottom:40 }}/>

        {[
          { icon:"🗺", texto:"Mapa del día con tus alumnos en tiempo real" },
          { icon:"🎙", texto:"Registros de clase por voz con IA" },
          { icon:"📄", texto:"Informes PDF con tu firma en segundos" },
        ].map((item, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16,
            width:"100%", maxWidth:300 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"#f0fdf4",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, flexShrink:0 }}>
              {item.icon}
            </div>
            <div style={{ fontSize:13, color:GR, lineHeight:1.4 }}>{item.texto}</div>
          </div>
        ))}

        <div style={{ width:"100%", maxWidth:300, marginTop:32 }}>
          <div ref={gBtnRef}
            style={{ display:cargando?"none":"flex", justifyContent:"center" }}/>

          {cargando && (
            <div style={{
              width:"100%", padding:"13px 20px", borderRadius:14,
              border:"1.5px solid #e2e8f0", background:"#f8fafc",
              display:"flex", alignItems:"center", justifyContent:"center", gap:12,
              boxShadow:"0 2px 8px rgba(0,0,0,.08)",
            }}>
              <span style={{ fontSize:14, color:GR }}>Verificando con Google...</span>
            </div>
          )}

          {error && (
            <div style={{ marginTop:12, fontSize:12, color:"#dc2626", textAlign:"center",
              fontWeight:600, padding:"8px 12px", background:"#fef2f2",
              borderRadius:10, border:"1px solid #fca5a5" }}>
              {error}
            </div>
          )}

          <div style={{ marginTop:20, fontSize:11, color:GL, textAlign:"center", lineHeight:1.6 }}>
            Acceso restringido · Solo cuentas autorizadas
          </div>
        </div>
      </div>

      <div style={{ padding:"12px 16px 16px", borderTop:`1px solid ${FO}`, textAlign:"center", fontSize:11, color:GL }}>
        App de Gestión Docente · Modalidad Especial · 2026
      </div>
    </div>
  );
}

// ── Pantalla: Empezar prueba gratis ───────────────────────────
function PantallaRegistro({ email, nombre, credential, color, onRegistrado, onVolver }) {
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  async function empezarDemo() {
    setCargando(true);
    setError('');
    try {
      const res = await fetch('/api/registrar-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (!res.ok) throw new Error('error_servidor');
      await new Promise(r => setTimeout(r, 1500));
      await onRegistrado(credential);
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.');
      setCargando(false);
    }
  }

  return (
    <div style={{ maxWidth:420, margin:'0 auto', minHeight:'100vh', background:'#fff',
      display:'flex', flexDirection:'column', fontFamily:"'Georgia',serif" }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'40px 28px' }}>

        <div style={{ width:80, height:80, borderRadius:'50%',
          background:`linear-gradient(135deg,${color},${color}bb)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:32, margin:'0 auto 20px',
          boxShadow:`0 8px 32px ${color}44` }}>📚</div>

        <div style={{ fontSize:22, fontWeight:800, color:TX, marginBottom:8, textAlign:'center' }}>
          Probá la app gratis
        </div>
        <div style={{ fontSize:14, color:GR, textAlign:'center', maxWidth:280, marginBottom:32, lineHeight:1.6 }}>
          {nombre ? `Hola ${nombre.split(' ')[0]}! ` : ''}28 días con todas las funciones del plan Profesional. Sin tarjeta.
        </div>

        {[
          { icon:'🗺', texto:'Mapa del día con alumnos y horarios' },
          { icon:'🎙', texto:'Registros de clase por voz con IA' },
          { icon:'📄', texto:'Informes PDF con tu firma' },
          { icon:'📊', texto:'Seguimiento de cada alumno' },
          { icon:'💬', texto:'Co-Piloto pedagógico con IA' },
        ].map((f, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, width:'100%', maxWidth:300 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'#f0fdf4',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
              {f.icon}
            </div>
            <span style={{ fontSize:13, color:GR }}>{f.texto}</span>
            <span style={{ marginLeft:'auto', color:color, fontWeight:700, fontSize:13 }}>✓</span>
          </div>
        ))}

        <button onClick={empezarDemo} disabled={cargando}
          style={{ marginTop:28, width:'100%', maxWidth:300, padding:'14px 20px',
            borderRadius:14, border:'none', cursor:'pointer',
            background:`linear-gradient(135deg,${color},${color}cc)`,
            color:'#fff', fontSize:15, fontWeight:700,
            boxShadow:`0 4px 20px ${color}44`,
            opacity: cargando ? 0.7 : 1 }}>
          {cargando ? 'Activando prueba...' : 'Empezar prueba gratis'}
        </button>

        {error && <p style={{ color:'#dc2626', fontSize:12, textAlign:'center', marginTop:10 }}>{error}</p>}

        <button onClick={onVolver}
          style={{ marginTop:16, background:'none', border:'none', color:GL,
            fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
          Volver ({email})
        </button>
      </div>
    </div>
  );
}

// ── Selector de plan + pago MP ─────────────────────────────────
const PLANES_META = {
  basico:      { label:'Básico',      alumnos:'15 alumnos',  ia:false, color:'#6b7280' },
  profesional: { label:'Profesional', alumnos:'25 alumnos',  ia:true,  color:'#4f46e5' },
  premium:     { label:'Premium',     alumnos:'Ilimitados',  ia:true,  color:'#d97706' },
};

function formatPrecio(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}

export function SelectorPlanesMP({ orgId, email, titulo, subtitulo, emoji, color, onVolver }) {
  const [planSel,   setPlanSel]   = useState('profesional');
  const [cargando,  setCargando]  = useState(false);
  const [error,     setError]     = useState('');
  const [planes,    setPlanes]    = useState([]);
  const waMsg = encodeURIComponent(`Hola! Necesito ayuda con mi suscripción a la App Docente. Mi email: ${email}`);

  useEffect(() => {
    fetch('/api/planes-precios')
      .then(r => r.json())
      .then(data => {
        if (data.planes?.length) {
          const ordenados = ['basico', 'profesional', 'premium']
            .map(id => {
              const row = data.planes.find(p => p.plan === id);
              if (!row) return null;
              const meta = PLANES_META[id] || { label: id, alumnos: '', ia: false, color: '#6b7280' };
              return { id, ...meta, precio: formatPrecio(row.precio_mensual) };
            })
            .filter(Boolean);
          setPlanes(ordenados);
        }
      })
      .catch(() => {});
  }, []);

  async function suscribirse() {
    if (!orgId) {
      setError('No pudimos identificar tu cuenta. Contactá al soporte por WhatsApp.');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const res = await fetch('/api/mp-pago-publico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, plan: planSel }),
      });
      const data = await res.json();
      if (!res.ok || !data.init_point) {
        setError(data.error || 'Error al iniciar el pago. Intentá de nuevo.');
        setCargando(false);
        return;
      }
      window.location.href = data.init_point;
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setCargando(false);
    }
  }

  return (
    <div style={{ maxWidth:420, margin:'0 auto', minHeight:'100vh', background:'#f8fafc',
      display:'flex', flexDirection:'column', fontFamily:"'Georgia',serif" }}>
      <div style={{ background:`linear-gradient(135deg,${color},${color}cc)`, padding:'32px 24px 24px', textAlign:'center' }}>
        <div style={{ fontSize:44, marginBottom:8 }}>{emoji}</div>
        <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>{titulo}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.85)', lineHeight:1.5 }}>{subtitulo}</div>
      </div>

      <div style={{ padding:'20px 20px 0', flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:12, textTransform:'uppercase', letterSpacing:.5 }}>
          Elegí tu plan
        </div>

        {planes.length === 0 && (
          <div style={{ textAlign:'center', padding:'20px 0', color:'#9ca3af', fontSize:13 }}>Cargando planes...</div>
        )}
        {planes.map(p => (
          <div key={p.id} onClick={() => setPlanSel(p.id)}
            style={{ background:'#fff', border:`2px solid ${planSel===p.id ? p.color : '#e2e8f0'}`,
              borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer',
              display:'flex', alignItems:'center', gap:14,
              boxShadow: planSel===p.id ? `0 4px 16px ${p.color}22` : 'none',
              transition:'border-color .15s, box-shadow .15s' }}>
            <div style={{ width:20, height:20, borderRadius:'50%',
              border:`2px solid ${planSel===p.id ? p.color : '#d1d5db'}`,
              background: planSel===p.id ? p.color : '#fff',
              flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {planSel===p.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }}/>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span style={{ fontSize:15, fontWeight:800, color:p.color }}>{p.label}</span>
                <span style={{ fontSize:15, fontWeight:800, color:'#111827' }}>{p.precio}<span style={{ fontSize:11, fontWeight:400, color:'#6b7280' }}>/mes</span></span>
              </div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>
                {p.alumnos} · {p.ia ? 'Co-Piloto IA incluido' : 'Sin IA'}
              </div>
            </div>
          </div>
        ))}

        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10,
          padding:'10px 14px', marginBottom:16, fontSize:12, color:'#1e40af', lineHeight:1.5 }}>
          💳 El pago se procesa por <strong>Mercado Pago</strong>. Se renueva automáticamente cada mes. Podés cancelar en cualquier momento.
        </div>

        <button onClick={suscribirse} disabled={cargando}
          style={{ width:'100%', padding:'15px 20px', borderRadius:14, border:'none',
            background: cargando ? '#d1d5db' : `linear-gradient(135deg,${color},${color}cc)`,
            color:'#fff', fontSize:15, fontWeight:800, cursor: cargando ? 'default' : 'pointer',
            boxShadow: cargando ? 'none' : `0 4px 20px ${color}44`,
            marginBottom:12 }}>
          {cargando ? 'Redirigiendo a Mercado Pago...' : `Suscribirme al plan ${planes.find(p=>p.id===planSel)?.label || planSel}`}
        </button>

        {error && (
          <div style={{ fontSize:12, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5',
            borderRadius:8, padding:'8px 12px', marginBottom:12, textAlign:'center' }}>
            {error}
          </div>
        )}

        <a href={`https://wa.me/${WA_SOPORTE}?text=${waMsg}`} target="_blank" rel="noreferrer"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            width:'100%', padding:'12px 20px', borderRadius:14, border:'1.5px solid #e2e8f0',
            background:'#fff', color:'#374151', fontSize:13, fontWeight:600,
            textDecoration:'none', marginBottom:16 }}>
          💬 Contactar soporte por WhatsApp
        </a>
      </div>

      <div style={{ padding:'0 20px 24px', textAlign:'center' }}>
        <button onClick={onVolver}
          style={{ background:'none', border:'none', color:'#9ca3af', fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
          Volver ({email})
        </button>
      </div>
    </div>
  );
}

// ── Pantalla: Demo vencido ─────────────────────────────────────
function PantallaDemoVencido({ email, orgId, color, onVolver }) {
  return (
    <SelectorPlanesMP
      orgId={orgId}
      email={email}
      titulo="Tu prueba gratuita venció"
      subtitulo="Activá un plan para seguir gestionando tus alumnos e informes."
      emoji="⏳"
      color={color}
      onVolver={onVolver}
    />
  );
}

// ── Pantalla: Cuenta suspendida / impaga ───────────────────────
function PantallaSuspendida({ email, orgId, estado, color, onVolver }) {
  return (
    <SelectorPlanesMP
      orgId={orgId}
      email={email}
      titulo={estado === 'impago' ? 'Suscripción vencida' : 'Cuenta suspendida'}
      subtitulo={estado === 'impago'
        ? 'Regularizá tu suscripción para recuperar el acceso completo.'
        : 'Reactivá tu cuenta suscribiéndote a un plan.'}
      emoji={estado === 'impago' ? '💳' : '🔒'}
      color={color}
      onVolver={onVolver}
    />
  );
}
