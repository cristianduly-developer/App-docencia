import React, { useState } from 'react';
import { G, GR, GL, BD, TX } from '../../constants';
import { uid, hoy } from '../../utils/helpers';
import { authHeaders } from '../../utils/session';
import { Card, SecT, Btn, Fld, WA, Avatar, Tag } from '../ui';
import FormReg from './FormReg';

// ── Nota rápida (aviso en contexto de clase) ──────────────────────
function NotaRapida({ ec, ctx, alumnoId, onSave, onCancel }) {
  const [txt, setTxt] = useState("");
  const [pri, setPri] = useState("media");
  const pc = { alta: "#dc2626", media: "#f59e0b", baja: G };

  const guardar = () => {
    if (!txt.trim()) return;
    onSave({ id: "rc" + uid(), alumnoId: alumnoId || "", texto: ctx ? `[${ctx}] ${txt}` : txt, fecha: hoy(), prioridad: pri, eliminado: false });
  };

  return (
    <Card sx={{ border: `2px solid ${ec}`, marginBottom: 8 }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Anotar algo</div>
      <div style={{ fontSize: 12, color: GL, marginBottom: 14 }}>
        📍 Contexto: <strong>{ctx || "general"}</strong>
        <div style={{ fontSize: 11, color: GL, marginTop: 2 }}>Va a aparecer en ⏰ Avisos con este contexto.</div>
      </div>
      <Fld label="¿Qué querés recordar?" value={txt} onChange={setTxt} multiline placeholder="Acordar con la docente... / Hablar con los padres... / Traer material..." />
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 8 }}>Prioridad</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["alta", "media", "baja"].map(p =>
            <button key={p} onClick={() => setPri(p)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "2px solid", borderColor: pri === p ? pc[p] : BD, background: pri === p ? pc[p] : "#fff", color: pri === p ? "#fff" : "#475569", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{p}</button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn outline onClick={onCancel} color={GR}>Cancelar</Btn>
        <Btn onClick={guardar} color={ec} full disabled={!txt.trim()}>Guardar en Avisos</Btn>
      </div>
    </Card>
  );
}

// ── AdaptarTarea inline ───────────────────────────────────────────
function AdaptarTarea({ alumno, materia, docente, ec, onSave, onCancel }) {
  const [paso, setPaso] = useState("foto"); // foto | analizando | resultado
  const [desc, setDesc] = useState("");
  const [resultado, setResultado] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const fileRef = React.useRef(null);

  const analizar = async () => {
    if (!desc.trim() && !imageBase64) return;
    setPaso("analizando");
    try {
      const msgs = [];
      if (imageBase64) {
        msgs.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } });
      }
      msgs.push({ type: "text", text: `Sos asistente de una Maestra Integradora. Adaptá esta tarea para el alumno/a ${alumno.nombre} (${alumno.diagnostico || "necesidades especiales"}) de manera inclusiva y accesible.\n${desc ? `Descripción adicional: ${desc}` : ""}\n\nDevolvé la adaptación en texto claro, sin JSON.` });

      const res = await fetch("/api/claude", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 800, messages: [{ role: "user", content: msgs }] })
      });
      const data = await res.json();
      setResultado(data.content?.[0]?.text || "No se pudo adaptar la tarea.");
      setPaso("resultado");
    } catch {
      setResultado("Error al conectar con Claude. Intentá de nuevo.");
      setPaso("resultado");
    }
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageBase64(ev.target.result.split(",")[1]);
    reader.readAsDataURL(f);
  };

  if (paso === "analizando") return (
    <Card sx={{ border: `2px solid ${ec}`, textAlign: "center", padding: 32 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Adaptando la tarea...</div>
      <div style={{ fontSize: 13, color: GR }}>Claude está pensando la mejor adaptación para {alumno.nombre}.</div>
    </Card>
  );

  if (paso === "resultado") return (
    <Card sx={{ border: `2px solid ${ec}`, marginBottom: 8 }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>📸 Adaptación lista</div>
      <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: TX, lineHeight: 1.7, marginBottom: 16, border: "1px solid #bbf7d0", whiteSpace: "pre-wrap" }}>{resultado}</div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn outline onClick={onCancel} color={GR}>Cerrar</Btn>
        <Btn onClick={() => onSave({ id: "r" + uid(), fecha: hoy(), eliminado: false, asistencia: "presente", materia: materia || "", docente: docente?.nombre || "", avance: `Adaptación de tarea:\n${resultado}`, acuerdo: "", recordatorio: "" })} color={ec} full>Guardar como registro</Btn>
      </div>
    </Card>
  );

  return (
    <Card sx={{ border: `2px solid ${ec}`, marginBottom: 8 }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>📸 Adaptar tarea desde foto</div>
      <div style={{ fontSize: 12, color: GR, marginBottom: 16, lineHeight: 1.5 }}>Sacá una foto de la tarea del aula y Claude la va a adaptar para {alumno.nombre}.</div>

      <div style={{ marginBottom: 14 }}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: 16, borderRadius: 12, border: `2px dashed ${imageBase64 ? ec : BD}`, background: imageBase64 ? ec + "10" : "#f8fafc", color: imageBase64 ? ec : GR, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          {imageBase64 ? "✓ Foto seleccionada — tocar para cambiar" : "📷 Tocar para sacar foto"}
        </button>
      </div>

      <Fld label="Descripción adicional (opcional)" value={desc} onChange={setDesc} multiline placeholder="Ej: Es una tarea de fracciones para 4to grado..." />

      <div style={{ display: "flex", gap: 10 }}>
        <Btn outline onClick={onCancel} color={GR}>Cancelar</Btn>
        <Btn onClick={analizar} color={ec} full disabled={!imageBase64 && !desc.trim()}>Analizar y adaptar</Btn>
      </div>
    </Card>
  );
}

// ── RegCard para historial ────────────────────────────────────────
function RegCard({ r }) {
  const bc = r.asistencia === "presente" ? G : r.asistencia === "ausente" ? "#dc2626" : "#f59e0b";
  const fmtF = s => { if (!s) return "—"; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{r.materia}</div>
          <div style={{ fontSize: 12, color: GR }}>{fmtF(r.fecha)}{r.docente && ` · ${r.docente}`}</div>
        </div>
        <Tag text={r.asistencia} bg={bc} />
      </div>
      {r.avance && <div style={{ fontSize: 13, color: "#475569", background: "#f8fafc", borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>📖 {r.avance}</div>}
      {r.acuerdo && <div style={{ fontSize: 13, color: "#1d4ed8", background: "#eff6ff", borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>🤝 {r.acuerdo}</div>}
      {r.recordatorio && <div style={{ fontSize: 13, color: "#92400e", background: "#fffbeb", borderRadius: 8, padding: "8px 12px" }}>⏰ {r.recordatorio}</div>}
    </Card>
  );
}

// ── VistaClase principal ──────────────────────────────────────────
export default function VistaClase({ ev, alumno, docentes, registros, escuelas, onAddReg, onAddRec, onFicha, onBack }) {
  const [modo, setModo] = useState(null);
  const esc = escuelas.find(e => e.id === alumno.escuelaId);
  const ec = esc?.color || G;
  const doc = ev.docenteId ? docentes.find(d => d.id === ev.docenteId) : null;
  const hist = (registros[alumno.id] || []).filter(r => r.materia === ev.materia && !r.eliminado);

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: ec, fontWeight: 700, fontSize: 14, padding: 0, marginBottom: 16, fontFamily: "inherit" }}>← Volver al mapa</button>

      {/* Cabecera */}
      <div style={{ background: "linear-gradient(135deg,#1a202c,#2d3748)", borderRadius: 20, padding: 20, color: "#fff", marginBottom: 16 }}>
        <div style={{ marginBottom: 10 }}>
          {ev.cur
            ? <span style={{ background: "#f59e0b", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 800 }}>● En curso</span>
            : <span style={{ background: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.7)", borderRadius: 20, padding: "3px 12px", fontSize: 12 }}>Clase pasada / próxima</span>}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{ev.materia}</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,.75)" }}>{ev.horaInicio}–{ev.horaFin} · {ev.aula}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <Avatar nombre={alumno.nombre} size={40} bg={ec} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{alumno.nombre}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", marginTop: 2 }}>{alumno.curso} · {alumno.diagnostico}</div>
          </div>
          <button onClick={onFicha} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>Ver ficha →</button>
        </div>
      </div>

      {/* Docente */}
      {doc && (
        <Card sx={{ borderLeft: `4px solid ${ec}` }}>
          <SecT text="Docente de esta clase" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: ec + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: ec }}>
                {(doc.nombre || "?").split(" ").pop()[0]}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{doc.nombre}</div>
                <div style={{ fontSize: 12, color: GR }}>{doc.materia} · {doc.telefono}</div>
              </div>
            </div>
            <WA tel={doc.telefono} />
          </div>
        </Card>
      )}

      {/* Acciones rápidas */}
      {!modo && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
          <button onClick={() => setModo("reg")} style={{ background: ec, color: "#fff", border: "none", borderRadius: 12, padding: "14px 12px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 22 }}>📝</span>Registrar clase
          </button>
          <button onClick={() => setModo("nota")} style={{ background: "#fff", color: TX, border: `2px solid ${BD}`, borderRadius: 12, padding: "14px 12px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 22 }}>⏰</span>Anotar algo
          </button>
          <button onClick={() => setModo("adaptar")} style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 12px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, gridColumn: "1/-1" }}>
            <span style={{ fontSize: 22 }}>📸</span>Adaptar tarea desde foto
          </button>
        </div>
      )}

      {modo === "adaptar" && <AdaptarTarea alumno={alumno} materia={ev.materia} docente={doc} ec={ec} onSave={r => { onAddReg(alumno.id, r); setModo(null); }} onCancel={() => setModo(null)} />}
      {modo === "reg" && <FormReg alumno={alumno} docentes={docentes} escColor={ec} docPre={doc} onSave={r => { onAddReg(alumno.id, r); setModo(null); }} onCancel={() => setModo(null)} />}
      {modo === "nota" && <NotaRapida ec={ec} ctx={`${ev.materia}${doc ? ` con ${doc.nombre}` : ""}`} alumnoId={alumno.id} onSave={rec => { onAddRec(rec); setModo(null); }} onCancel={() => setModo(null)} />}

      {/* Historial */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: TX, marginBottom: 4 }}>Historial en {ev.materia}</div>
        <div style={{ fontSize: 12, color: GL, marginBottom: 12 }}>{hist.length === 0 ? "Sin registros aún" : `${hist.length} clases registradas`}</div>
        {hist.length === 0
          ? <Card sx={{ textAlign: "center", padding: 28 }}><div style={{ fontSize: 34, marginBottom: 8 }}>📋</div><div style={{ fontWeight: 700, color: "#475569" }}>Sin registros aún en esta materia</div></Card>
          : hist.map(r => <RegCard key={r.id} r={r} />)}
      </div>
    </div>
  );
}
