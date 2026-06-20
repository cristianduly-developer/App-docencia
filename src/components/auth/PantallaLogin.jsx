import React, { useState, useEffect, useRef } from 'react';
import { G, GR, GL, TX, FO, TEMAS_COLOR } from '../../constants';
import { setSessionToken } from '../../utils/session';
import { GOOGLE_CLIENT_ID } from '../../constants';

const WA_SOPORTE = '5491140902990';

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
              setDatosSin({ email: data.email, nombre: data.nombre });
              setPantalla('demo_vencido');
              setCargando(false);
              return;
            }
            if (data.code === 'impago' || data.code === 'suspendido') {
              setDatosSin({ email: data.email, nombre: data.nombre, estado: data.code });
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
    return <PantallaDemoVencido email={datosSin?.email} color={colorActivo}
      onVolver={() => { setPantalla('login'); window._gsiIniciado = false; }} />;
  }

  if (pantalla === 'suspendido') {
    return <PantallaSuspendida email={datosSin?.email} estado={datosSin?.estado} color={colorActivo}
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

// ── Pantalla: Demo vencido ─────────────────────────────────────
function PantallaDemoVencido({ email, color, onVolver }) {
  const waMsg = encodeURIComponent(`Hola! Se me venció la prueba de la App Docente. Mi email: ${email}`);
  return (
    <div style={{ maxWidth:420, margin:'0 auto', minHeight:'100vh', background:'#fff',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:"'Georgia',serif", padding:'40px 28px', textAlign:'center' }}>
      <div style={{ fontSize:56, marginBottom:20 }}>⏳</div>
      <div style={{ fontSize:22, fontWeight:800, color:TX, marginBottom:12 }}>
        Tu prueba gratuita venció
      </div>
      <div style={{ fontSize:14, color:GR, maxWidth:280, lineHeight:1.6, marginBottom:32 }}>
        Gracias por probar la App Docente. Activá un plan para seguir gestionando tus alumnos e informes.
      </div>
      <a href={`https://wa.me/${WA_SOPORTE}?text=${waMsg}`} target="_blank" rel="noreferrer"
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          width:'100%', maxWidth:300, padding:'14px 20px', borderRadius:14,
          background:'#22C55E', color:'#fff', fontSize:15, fontWeight:700,
          textDecoration:'none', marginBottom:16,
          boxShadow:'0 4px 20px rgba(34,197,94,0.3)' }}>
        💬 Activar mi cuenta
      </a>
      <button onClick={onVolver}
        style={{ background:'none', border:'none', color:GL, fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
        Volver ({email})
      </button>
    </div>
  );
}

// ── Pantalla: Cuenta suspendida / impaga ───────────────────────
function PantallaSuspendida({ email, estado, color, onVolver }) {
  const waMsg = encodeURIComponent(
    estado === 'impago'
      ? `Hola! Quiero regularizar mi suscripción a la App Docente. Mi email: ${email}`
      : `Hola! Mi acceso a la App Docente está suspendido. Mi email: ${email}`
  );
  return (
    <div style={{ maxWidth:420, margin:'0 auto', minHeight:'100vh', background:'#fff',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:"'Georgia',serif", padding:'40px 28px', textAlign:'center' }}>
      <div style={{ fontSize:56, marginBottom:20 }}>🔒</div>
      <div style={{ fontSize:22, fontWeight:800, color:TX, marginBottom:12 }}>
        {estado === 'impago' ? 'Suscripción vencida' : 'Cuenta suspendida'}
      </div>
      <div style={{ fontSize:14, color:GR, maxWidth:280, lineHeight:1.6, marginBottom:32 }}>
        {estado === 'impago'
          ? 'Regularizá tu pago para reactivar el acceso a la App Docente.'
          : 'Contactá al administrador para resolver el problema con tu cuenta.'}
      </div>
      <a href={`https://wa.me/${WA_SOPORTE}?text=${waMsg}`} target="_blank" rel="noreferrer"
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          width:'100%', maxWidth:300, padding:'14px 20px', borderRadius:14,
          background:'#22C55E', color:'#fff', fontSize:15, fontWeight:700,
          textDecoration:'none', marginBottom:16,
          boxShadow:'0 4px 20px rgba(34,197,94,0.3)' }}>
        💬 Contactar soporte
      </a>
      <button onClick={onVolver}
        style={{ background:'none', border:'none', color:GL, fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
        Volver ({email})
      </button>
    </div>
  );
}
