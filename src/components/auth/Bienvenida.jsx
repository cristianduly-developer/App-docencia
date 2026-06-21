import { useState } from 'react';
import { G, GD } from '../../constants';

export default function Bienvenida({ usuario, onComplete }) {
  const esDemo   = usuario?.acceso?.estado === 'demo';
  const diasDemo = usuario?.acceso?.diasRestantes ?? null;

  const [nombre, setNombre]   = useState(usuario?.nombre?.split(" ")[0] || "");
  const [wapp,   setWapp]     = useState("");
  const [mail,   setMail]     = useState(usuario?.email || "");
  const [error,  setError]    = useState("");

  const guardar = () => {
    if (!nombre.trim()) { setError("Ingresá tu nombre"); return; }
    const perfil = { nombre: nombre.trim(), whatsapp: wapp.trim(), mail: mail.trim() };
    localStorage.setItem("aye_perfil",          JSON.stringify(perfil));
    localStorage.setItem("aye_onboarding_done", "1");
    onComplete(perfil);
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", fontFamily: "Georgia,serif", boxSizing: "border-box" }}>

      <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: G, textAlign: "center", margin: "0 0 8px" }}>
        ¡Bienvenida a Gestión Docente!
      </h1>

      <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", margin: "0 0 24px", lineHeight: 1.6 }}>
        Esperamos ayudarte a simplificar tu trabajo día a día.
      </p>

      {esDemo && (
        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 12, padding: "12px 18px", marginBottom: 24, fontSize: 13, color: "#92400e", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
          Estás en modo <strong>demo</strong>.
          {diasDemo !== null && <> Te quedan <strong>{diasDemo} día{diasDemo !== 1 ? "s" : ""}</strong> para probarlo.</>}
          <br />
          <span style={{ fontSize: 12, opacity: .8 }}>Cuando quieras activar tu cuenta, avisanos.</span>
        </div>
      )}

      {!esDemo && usuario?.acceso?.plan && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "10px 18px", marginBottom: 24, fontSize: 13, color: "#166534", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
          Plan activo: <strong style={{ textTransform: "capitalize" }}>{usuario.acceso.plan}</strong> ✓
        </div>
      )}

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>¿Cómo te llamás? *</label>
          <input
            value={nombre}
            onChange={e => { setNombre(e.target.value); setError(""); }}
            placeholder="Tu nombre"
            style={inputStyle}
            autoFocus
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>WhatsApp</label>
          <input
            value={wapp}
            onChange={e => setWapp(e.target.value)}
            placeholder="Ej: 11 1234-5678"
            type="tel"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Mail de contacto</label>
          <input
            value={mail}
            onChange={e => setMail(e.target.value)}
            placeholder="tu@mail.com"
            type="email"
            style={inputStyle}
          />
        </div>

        {error && <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center" }}>{error}</div>}

        <button
          onClick={guardar}
          style={{ marginTop: 8, background: G, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 800, cursor: "pointer", width: "100%", fontFamily: "inherit" }}
        >
          ¡Empezar!
        </button>
      </div>

      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 20, textAlign: "center" }}>
        Estos datos se guardan solo en tu dispositivo.
      </p>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1.5px solid #e2e8f0",
  fontSize: 14,
  fontFamily: "Georgia,serif",
  outline: "none",
  boxSizing: "border-box",
  color: "#1e293b",
};
