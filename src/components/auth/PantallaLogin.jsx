import React, { useState, useEffect, useRef } from 'react';
import { G, GR, GL, TX, FO } from '../../constants';
import { setSessionToken } from '../../utils/session';
import { GOOGLE_CLIENT_ID } from '../../constants';

export default function PantallaLogin({ onLogin }) {
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState("");
  const gBtnRef = useRef(null);

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

  return (
    <div style={{
      maxWidth:420, margin:"0 auto", minHeight:"100vh",
      background:"#fff", display:"flex", flexDirection:"column",
      fontFamily:"'Georgia',serif", position:"relative", overflow:"hidden",
    }}>
      {/* Fondo decorativo */}
      <div style={{ position:"absolute", top:-80, right:-80, width:260, height:260,
        borderRadius:"50%", background:"#2D6A4F", opacity:.06 }}/>
      <div style={{ position:"absolute", bottom:-60, left:-60, width:200, height:200,
        borderRadius:"50%", background:"#2D6A4F", opacity:.08 }}/>
      <div style={{ position:"absolute", top:"30%", left:-40, width:120, height:120,
        borderRadius:"50%", background:"#40916c", opacity:.05 }}/>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", padding:"40px 32px", position:"relative", zIndex:1 }}>

        {/* Logo */}
        <div style={{ marginBottom:40, textAlign:"center" }}>
          <div style={{
            width:80, height:80, borderRadius:"50%",
            background:"linear-gradient(135deg,#2D6A4F,#40916c)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, fontWeight:800, color:"#fff",
            margin:"0 auto 20px",
            boxShadow:"0 8px 32px rgba(45,106,79,.25)",
          }}>📚</div>
          <div style={{ fontSize:22, fontWeight:800, color:TX, marginBottom:6 }}>
            App de Gestión Docente
          </div>
          <div style={{ fontSize:14, color:GR, lineHeight:1.6, maxWidth:280, margin:"0 auto" }}>
            Modalidad Especial · Buenos Aires
          </div>
        </div>

        <div style={{ width:48, height:3,
          background:"linear-gradient(90deg,#2D6A4F,#40916c)", borderRadius:2, marginBottom:40 }}/>

        {/* Beneficios */}
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

        {/* Botón Google */}
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

      <div style={{ padding:"16px", textAlign:"center", fontSize:11,
        color:GL, borderTop:`1px solid ${FO}` }}>
        App de Gestión Docente · Modalidad Especial · 2026
      </div>
    </div>
  );
}
