import React, { useState, useRef } from 'react';
import { G, GR, GL, BD, TX } from '../../constants';
import { uid, hoy } from '../../utils/helpers';
import { authHeaders } from '../../utils/session';
import { Card, Btn, Fld, Sel } from '../ui';

// ── Botón de voz real (SpeechRecognition) ────────────────────────
function BotonVoz({ onTranscripcion, color }) {
  const [grabando, setGrabando] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const recognRef = useRef(null);
  const grabandoRef = useRef(false);
  const textoAcuRef = useRef("");

  const crearRecognizer = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = "es-AR";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => {
      const frag = e.results[0][0].transcript.trim();
      textoAcuRef.current = (textoAcuRef.current + " " + frag).trim();
      setTexto(textoAcuRef.current);
    };
    r.onend = () => {
      if (grabandoRef.current) {
        const nuevo = crearRecognizer();
        if (nuevo) { recognRef.current = nuevo; nuevo.start(); }
      }
    };
    r.onerror = (e) => {
      grabandoRef.current = false;
      setGrabando(false);
      const msgs = {
        "not-allowed":        "❌ Permiso de micrófono denegado. Habilitalo en la configuración del navegador.",
        "network":            "❌ Error de red. La grabación de voz requiere conexión a internet.",
        "service-not-allowed":"❌ Tu navegador no permite grabación de voz. Probá con Chrome en Android.",
        "audio-capture":      "❌ No se detectó micrófono en el dispositivo.",
        "aborted":            "",
        "no-speech":          "",
      };
      const msg = msgs[e.error];
      if (msg !== "") setError(msg || `❌ Error al grabar (${e.error}). Verificá los permisos del micrófono.`);
    };
    return r;
  };

  const iniciar = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Tu navegador no soporta grabación de voz. Probá con Chrome."); return; }
    textoAcuRef.current = "";
    setTexto(""); setError("");
    grabandoRef.current = true;
    const r = crearRecognizer();
    recognRef.current = r;
    r.start();
    setGrabando(true);
  };

  const detener = () => {
    grabandoRef.current = false;
    recognRef.current?.stop();
    setGrabando(false);
    if (textoAcuRef.current.trim()) onTranscripcion(textoAcuRef.current.trim());
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onMouseDown={iniciar} onMouseUp={detener}
        onTouchStart={e => { e.preventDefault(); iniciar(); }}
        onTouchEnd={e => { e.preventDefault(); detener(); }}
        style={{
          width: "100%", padding: 16, borderRadius: 14, border: "none",
          background: grabando ? "linear-gradient(135deg,#dc2626,#ef4444)" : `linear-gradient(135deg,${color},${color}cc)`,
          color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: grabando ? "0 0 0 4px rgba(220,38,38,.3)" : "none", transition: "all .2s",
        }}>
        <span style={{ fontSize: 24 }}>{grabando ? "⏹" : "🎙"}</span>
        {grabando ? "Soltá para procesar..." : "Mantené para grabar"}
      </button>
      {grabando && texto && (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: `1.5px solid ${color}`, fontSize: 13, color: GR, lineHeight: 1.5 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", marginBottom: 4 }}>Escuchando...</div>
          {texto}
        </div>
      )}
      {error && <div style={{ marginTop: 8, fontSize: 12, color: "#dc2626", fontWeight: 600 }}>⚠ {error}</div>}
    </div>
  );
}

// ── Pantalla de confirmación (lo que interpretó Claude) ───────────
function PantallaConfirmacion({ propuesta, alumno, docentes, escColor, onConfirmar, onRechazar }) {
  const [asist, setAsist] = useState(propuesta.asistencia || "presente");
  const [avance, setAvance] = useState(propuesta.avance || "");
  const [acuerdo, setAcuerdo] = useState(propuesta.acuerdo || "");
  const [rec, setRec] = useState(propuesta.recordatorio || "");
  const [docId, setDocId] = useState(propuesta.docenteId || "");

  const docsAlumno = [...new Set((alumno.horarios || []).filter(h => h.docenteId).map(h => h.docenteId))]
    .map(id => docentes.find(d => d.id === id)).filter(Boolean);
  const docSel = docentes.find(d => d.id === docId);

  const badge = (ok) => ok
    ? <span style={{ fontSize: 10, background: "#d1fae5", color: "#065f46", borderRadius: 10, padding: "1px 8px", fontWeight: 700 }}>DETECTADO</span>
    : <span style={{ fontSize: 10, background: "#f1f5f9", color: GR, borderRadius: 10, padding: "1px 8px", fontWeight: 700 }}>VACÍO</span>;

  return (
    <div>
      <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "8px 12px", marginBottom: 12, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15 }}>✨</span>
        <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>Claude interpretó tu audio — revisá y confirmá</span>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,.07)" }}>
        {/* Asistencia */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>📋</span> Asistencia
            <span style={{ fontSize: 10, background: "#d1fae5", color: "#065f46", borderRadius: 10, padding: "1px 8px", fontWeight: 700 }}>DETECTADO</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["presente", "ausente", "llegó tarde"].map(op =>
              <button key={op} onClick={() => setAsist(op)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "2px solid", borderColor: asist === op ? escColor : BD, background: asist === op ? escColor : "#fff", color: asist === op ? "#fff" : "#475569", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{op}</button>
            )}
          </div>
        </div>

        {/* Docente */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>👤</span> Docente
            {docId ? <span style={{ fontSize: 10, background: "#d1fae5", color: "#065f46", borderRadius: 10, padding: "1px 8px", fontWeight: 700 }}>DETECTADO</span>
              : <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", borderRadius: 10, padding: "1px 8px", fontWeight: 700 }}>VERIFICAR</span>}
          </div>
          <select value={docId} onChange={e => setDocId(e.target.value)} style={{ width: "100%", border: `2px solid ${docId ? escColor : BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", background: "#f8fafc", color: TX, boxSizing: "border-box" }}>
            <option value="">Sin docente</option>
            {docsAlumno.map(d => <option key={d.id} value={d.id}>{d.materia} — {d.nombre}</option>)}
          </select>
        </div>

        {/* Avance */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>📖</span> Avance / Trabajo realizado {badge(avance)}
          </div>
          <textarea value={avance} onChange={e => setAvance(e.target.value)} placeholder="Claude no detectó avance..."
            style={{ width: "100%", border: `2px solid ${avance ? escColor : BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", color: TX, background: "#f8fafc", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 80 }} />
        </div>

        {/* Acuerdo */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🤝</span> Acuerdo con el docente {badge(acuerdo)}
          </div>
          <textarea value={acuerdo} onChange={e => setAcuerdo(e.target.value)} placeholder="Claude no detectó acuerdos..."
            style={{ width: "100%", border: `2px solid ${acuerdo ? "#1d4ed8" : BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", color: TX, background: acuerdo ? "#f0f7ff" : "#f8fafc", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 64 }} />
        </div>

        {/* Recordatorio */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>⏰</span> Recordatorio {badge(rec)}
          </div>
          <input value={rec} onChange={e => setRec(e.target.value)} placeholder="Claude no detectó recordatorios..."
            style={{ width: "100%", border: `2px solid ${rec ? "#f59e0b" : BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", color: TX, background: rec ? "#fffbeb" : "#f8fafc", boxSizing: "border-box", outline: "none" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={onRechazar} style={{ padding: 14, borderRadius: 12, border: `2px solid ${BD}`, background: "#fff", color: GR, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>🔄 Volver a grabar</button>
        <button onClick={() => onConfirmar({ asistencia: asist, avance, acuerdo, recordatorio: rec, docenteId: docId, materia: docSel?.materia || "", docente: docSel?.nombre || "" })}
          style={{ padding: 14, borderRadius: 12, border: "none", background: `linear-gradient(135deg,${escColor},${escColor}cc)`, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          ✓ Confirmar y guardar
        </button>
      </div>
    </div>
  );
}

// ── FormReg principal ─────────────────────────────────────────────
export default function FormReg({ alumno, docentes, escColor, docPre, onSave, onCancel }) {
  const [modo, setModo] = useState("elegir");
  const [asist, setAsist] = useState("presente");
  const [docId, setDocId] = useState(docPre?.id || "");
  const [avance, setAvance] = useState("");
  const [acuerdo, setAcuerdo] = useState("");
  const [rec, setRec] = useState("");
  const [propuesta, setPropuesta] = useState(null);

  const docsAlumno = [...new Set((alumno.horarios || []).filter(h => h.docenteId).map(h => h.docenteId))]
    .map(id => docentes.find(d => d.id === id)).filter(Boolean);
  const docSel = docentes.find(d => d.id === docId);

  const save = (datos) => onSave({
    id: "r" + uid(), fecha: hoy(), eliminado: false,
    asistencia: datos?.asistencia || asist,
    materia: datos?.materia || docSel?.materia || "",
    docente: datos?.docente || docSel?.nombre || "",
    avance: datos?.avance || avance,
    acuerdo: datos?.acuerdo || acuerdo,
    recordatorio: datos?.recordatorio || rec,
  });

  const procesarAudio = async (transcripcion) => {
    setModo("procesando");
    const docentesCtx = docsAlumno.map(d => `${d.nombre} (${d.materia})`).join(", ");
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          model: "claude-sonnet-4-5", max_tokens: 1000,
          messages: [{ role: "user", content: `Sos el asistente de una Maestra Integradora argentina. Ella acaba de grabar una nota de voz sobre una clase.\n\nCONTEXTO:\n- Alumno/a: ${alumno.nombre}\n- Docentes disponibles: ${docsAlumno.length > 0 ? docentesCtx : "no especificados"}\n${docPre ? `- Docente de esta clase: ${docPre.nombre} (${docPre.materia})` : ""}\n\nTRANSCRIPCIÓN DEL AUDIO:\n"${transcripcion}"\n\nRespondé ÚNICAMENTE con JSON válido sin texto adicional:\n{\n  "asistencia": "presente" | "ausente" | "llegó tarde",\n  "docenteId": "id o null",\n  "avance": "descripción",\n  "acuerdo": "acuerdos",\n  "recordatorio": "pendientes",\n  "confianza": "alta" | "media" | "baja"\n}\n\nIDs disponibles: ${docsAlumno.map(d => `"${d.id}" = ${d.nombre}`).join(", ") || "ninguno"}. Si el docente ya está definido usá "${docPre?.id || ""}".` }]
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) { setAvance(transcripcion); setModo("manual"); return; }
      const parsed = JSON.parse((data.content?.[0]?.text || "").replace(/```json|```/g, "").trim());
      if (docPre && !parsed.docenteId) parsed.docenteId = docPre.id;
      setPropuesta({ ...parsed, transcripcion });
      setModo("confirmar");
    } catch {
      setAvance(transcripcion);
      setModo("manual");
    }
  };

  if (modo === "elegir") return (
    <Card sx={{ border: `2px solid ${escColor}`, marginBottom: 8 }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Nuevo registro</div>
      <div style={{ fontSize: 13, color: GR, marginBottom: 20 }}>¿Cómo querés registrar esta clase?</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <button onClick={() => setModo("voz")} style={{ background: `linear-gradient(135deg,${escColor},${escColor}cc)`, color: "#fff", border: "none", borderRadius: 14, padding: "20px 12px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 32 }}>🎙</span><span>Por voz</span>
          <span style={{ fontSize: 11, fontWeight: 400, opacity: .85, lineHeight: 1.4, textAlign: "center" }}>Hablá y Claude lo organiza</span>
        </button>
        <button onClick={() => setModo("manual")} style={{ background: "#fff", color: TX, border: `2px solid ${BD}`, borderRadius: 14, padding: "20px 12px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 32 }}>✏️</span><span>Manual</span>
          <span style={{ fontSize: 11, fontWeight: 400, color: GR, lineHeight: 1.4, textAlign: "center" }}>Escribir campo por campo</span>
        </button>
      </div>
      <Btn outline onClick={onCancel} color={GR} full>Cancelar</Btn>
    </Card>
  );

  if (modo === "voz") return (
    <Card sx={{ border: `2px solid ${escColor}`, marginBottom: 8 }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🎙 Registro por voz</div>
      <div style={{ fontSize: 13, color: GR, marginBottom: 12, lineHeight: 1.5 }}>Mantené presionado el botón y hablá. Claude va a interpretar y completar el registro.</div>
      <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#166534", border: "1px solid #86efac" }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>💡 Ejemplo:</div>
        <div style={{ lineHeight: 1.6, fontStyle: "italic" }}>"Hoy Sofía estuvo presente, trabajamos fracciones y pudo resolver los tres primeros ejercicios sola. Acordé con la profe repasar la próxima clase."</div>
      </div>
      <BotonVoz onTranscripcion={procesarAudio} color={escColor} />
      <Btn outline onClick={() => setModo("elegir")} color={GR} full>← Volver</Btn>
    </Card>
  );

  if (modo === "procesando") return (
    <Card sx={{ border: `2px solid ${escColor}`, marginBottom: 8, textAlign: "center", padding: 32 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Claude está interpretando...</div>
      <div style={{ fontSize: 13, color: GR, lineHeight: 1.5 }}>Identificando asistencia, avance pedagógico, acuerdos y recordatorios.</div>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 6 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: escColor, animation: `pulse 1.2s ${i * .2}s infinite` }} />)}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </Card>
  );

  if (modo === "confirmar" && propuesta) return (
    <PantallaConfirmacion propuesta={propuesta} alumno={alumno} docentes={docentes} escColor={escColor}
      onConfirmar={(datos) => save(datos)} onRechazar={() => setModo("voz")} />
  );

  // Manual
  return (
    <Card sx={{ border: `2px solid ${escColor}`, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Nuevo registro</div>
        <button onClick={() => setModo("voz")} style={{ background: escColor + "15", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: escColor, cursor: "pointer", fontFamily: "inherit" }}>🎙 Usar voz</button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 8 }}>Asistencia</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["presente", "ausente", "llegó tarde"].map(op =>
            <button key={op} onClick={() => setAsist(op)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "2px solid", borderColor: asist === op ? escColor : BD, background: asist === op ? escColor : "#fff", color: asist === op ? "#fff" : "#475569", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{op}</button>
          )}
        </div>
      </div>

      {docPre
        ? <div style={{ marginBottom: 14, background: "#f8fafc", borderRadius: 10, padding: "10px 14px", border: `1.5px solid ${BD}` }}>
            <div style={{ fontSize: 12, color: GL, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Docente</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{docPre.nombre} — {docPre.materia}</div>
          </div>
        : <Sel label="Docente de la clase" value={docId} onChange={setDocId}
            opts={docsAlumno.map(d => ({ v: d.id, l: `${d.materia} — ${d.nombre}` }))} ph="Seleccionar..." />
      }

      <Fld label="Intervenciones y estrategias implementadas" value={avance} onChange={setAvance} multiline placeholder="¿Qué intervenciones se realizaron?" />
      <Fld label="Acuerdo con el docente" value={acuerdo} onChange={setAcuerdo} multiline placeholder="¿Qué ajustes razonables se acordaron?" />
      <Fld label="Recordatorio" value={rec} onChange={setRec} placeholder="Algo para no olvidar..." />

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Btn outline onClick={onCancel} color={GR}>Cancelar</Btn>
        <Btn onClick={() => save()} color={escColor} full>Guardar registro</Btn>
      </div>
    </Card>
  );
}
