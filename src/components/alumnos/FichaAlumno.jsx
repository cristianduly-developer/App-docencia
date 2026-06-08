import React, { useState } from 'react';
import { G, GR, GL, BD, TX, DIAS, DIAS_L } from '../../constants';
import { uid, hoy, fmtF, hMin, leer, grabar } from '../../utils/helpers';
import { authHeaders } from '../../utils/session';
import { DB } from '../../utils/db';
import { appState } from '../../context/AppContext';
import { Card, Btn, Fld, Sel, SecT, WA, Mail, Avatar, Tag, Confirm } from '../ui';
import FormReg from '../mapa/FormReg';

// ── Historial card ─────────────────────────────────────────────
function RegCard({ r, onDel }) {
  const [conf, setConf] = useState(false);
  const bc = r.asistencia === "presente" ? G : r.asistencia === "ausente" ? "#dc2626" : "#f59e0b";
  return <>
    {conf && <Confirm msg={`¿Eliminar el registro del ${fmtF(r.fecha)} en ${r.materia}?`} onOk={() => { onDel && onDel(r.id); setConf(false); }} onNo={() => setConf(false)} />}
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{r.materia}</div>
          <div style={{ fontSize: 12, color: GR }}>{fmtF(r.fecha)}{r.docente && ` · ${r.docente}`}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Tag text={r.asistencia} bg={bc} />
          {onDel && <button onClick={() => setConf(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, padding: "0 4px" }}>🗑</button>}
        </div>
      </div>
      {r.avance && <div style={{ fontSize: 13, color: "#475569", background: "#f8fafc", borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>📖 {r.avance}</div>}
      {r.acuerdo && <div style={{ fontSize: 13, color: "#1d4ed8", background: "#eff6ff", borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>🤝 {r.acuerdo}</div>}
      {r.recordatorio && <div style={{ fontSize: 13, color: "#92400e", background: "#fffbeb", borderRadius: 8, padding: "8px 12px" }}>⏰ {r.recordatorio}</div>}
    </Card>
  </>;
}

// ── Vista docente-alumno ───────────────────────────────────────
function DetalleDoc({ doc, alumno, docentes, registros, ec, onBack, onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const hist = (registros[alumno.id] || []).filter(r => r.docente === doc.nombre && !r.eliminado);
  const hs   = (alumno.horarios || []).filter(h => h.docenteId === doc.id).sort((a, b) => a.dia - b.dia);

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: ec, fontWeight: 700, fontSize: 14, padding: 0, marginBottom: 16, fontFamily: "inherit" }}>← Volver a {alumno.nombre.split(" ")[0]}</button>

      {/* Header docente */}
      <div style={{ background: `linear-gradient(135deg,${ec}ee,${ec}99)`, borderRadius: 20, padding: 20, color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: 1 }}>Docente · {doc.materia}</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{doc.nombre}</div>
        {/* Chips de horario */}
        {hs.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {hs.map((h, i) => (
              <span key={i} style={{ background: "rgba(255,255,255,.2)", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                {DIAS[h.dia]} {h.horaInicio}–{h.horaFin}
              </span>
            ))}
          </div>
        )}
        {hs[0]?.aula && <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginTop: 8 }}>📍 {hs[0].aula}</div>}
        {/* Contacto */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {doc.telefono && (
            <a href={`https://wa.me/54${doc.telefono.replace(/[-\s]/g, "")}`} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
              💬 WhatsApp · {doc.telefono}
            </a>
          )}
          {doc.mail && (
            <a href={`mailto:${doc.mail}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#3b82f6", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
              ✉ Mail
            </a>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: TX }}>Registros con {doc.nombre.split(" ").slice(-1)[0]}</div>
          <div style={{ fontSize: 12, color: GL, marginTop: 2 }}>{hist.length === 0 ? "Sin registros" : `${hist.length} clases`}</div>
        </div>
        {!showForm && <Btn small onClick={() => setShowForm(true)} color={ec}>+ Nuevo</Btn>}
      </div>

      {showForm && <FormReg alumno={alumno} docentes={docentes} escColor={ec} docPre={doc} onSave={r => { onAdd(alumno.id, r); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
      {hist.length === 0 && !showForm
        ? <Card sx={{ textAlign: "center", padding: 32 }}><div style={{ fontSize: 36, marginBottom: 8 }}>📋</div><div style={{ fontWeight: 700, color: "#475569" }}>Sin registros con este docente</div></Card>
        : hist.map(r => <RegCard key={r.id} r={r} />)}
    </div>
  );
}

// ── Tab Actividades IA ─────────────────────────────────────────
function TabActividades({ alumno, registros, docentes, ec }) {
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  const [actividades, setActividades] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [orientacion, setOrientacion] = useState("");

  const materias = [...new Set(
    (alumno.horarios || []).filter(h => h.docenteId && !h.esRecreo)
      .map(h => docentes.find(d => d.id === h.docenteId)?.materia).filter(Boolean)
  )];

  const regsMateria = (registros[alumno.id] || [])
    .filter(r => !r.eliminado && (!materiaSeleccionada || r.materia === materiaSeleccionada))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 8);

  const generarActividades = async () => {
    if (!materiaSeleccionada) return;
    setCargando(true); setError(""); setActividades(null);
    const historialResumen = regsMateria.length > 0
      ? regsMateria.map(r => `• ${fmtF(r.fecha)}: ${r.asistencia}. ${r.avance ? `Avance: ${r.avance}` : "Sin avance."}${r.acuerdo ? ` Acuerdo: ${r.acuerdo}` : ""}`).join("\n")
      : "Sin registros previos en esta materia.";
    const docenteMateria = docentes.find(d =>
      (alumno.horarios || []).some(h => h.docenteId === d.id) && d.materia === materiaSeleccionada
    );
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          model: "claude-sonnet-4-5", max_tokens: 1200,
          messages: [{
            role: "user",
            content: `Sos una especialista en educación inclusiva y diseño de actividades adaptadas para alumnos con necesidades educativas especiales en Argentina.

ALUMNO/A: ${alumno.nombre}
CURSO: ${alumno.curso}
DIAGNÓSTICO: ${alumno.diagnostico}
TERAPIAS ACTUALES: ${(alumno.terapias || []).map(t => `${t.nombre} (${t.frecuencia})`).join(", ") || "Ninguna"}
MATERIA: ${materiaSeleccionada}
${docenteMateria ? `DOCENTE: ${docenteMateria.nombre}` : ""}
${orientacion.trim() ? `\nORIENTACIÓN DE LA DOCENTE INTEGRADORA: ${orientacion.trim()}` : ""}

HISTORIAL RECIENTE DE CLASES:
${historialResumen}

Generá 3 actividades adaptadas para la próxima clase (consolidación, avance, extensión). Sé conciso.

Respondé ÚNICAMENTE con JSON válido, sin backticks:
{
  "contexto": "resumen breve del nivel actual en esta materia",
  "actividades": [
    { "nivel": "Consolidación", "emoji": "🔁", "titulo": "nombre corto", "descripcion": "cómo realizarla (máx 2 oraciones)", "objetivo": "qué trabaja", "tiempo": "X min", "adaptaciones": "ajuste para el diagnóstico (máx 1 oración)" },
    { "nivel": "Avance", "emoji": "📈", "titulo": "nombre corto", "descripcion": "cómo realizarla (máx 2 oraciones)", "objetivo": "qué trabaja", "tiempo": "X min", "adaptaciones": "ajuste (máx 1 oración)" },
    { "nivel": "Extensión", "emoji": "⭐", "titulo": "nombre corto", "descripcion": "cómo realizarla (máx 2 oraciones)", "objetivo": "qué trabaja", "tiempo": "X min", "adaptaciones": "ajuste (máx 1 oración)" }
  ]
}`,
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const msg = data.error || "Error desconocido";
        setError(msg.toLowerCase().includes("credit") || msg.toLowerCase().includes("balance")
          ? "⚠️ Sin créditos en la API de IA. Cargá saldo en console.anthropic.com para usar esta función."
          : `Error de IA: ${msg}`);
        return;
      }
      const texto = data.content?.[0]?.text || "";
      if (!texto) { setError("La IA no devolvió respuesta. Intentá de nuevo."); return; }
      const limpio = texto.replace(/```json|```/g, "").trim();
      setActividades(JSON.parse(limpio));
    } catch { setError("No se pudieron generar las actividades. Verificá la conexión e intentá de nuevo."); }
    finally { setCargando(false); }
  };

  const coloresNivel = {
    "Consolidación": { bg: "#eff6ff", border: "#3b82f6", badge: "#2563eb", texto: "#1e40af" },
    "Avance":        { bg: "#f0fdf4", border: "#22c55e", badge: "#16a34a", texto: "#166534" },
    "Extensión":     { bg: "#fefce8", border: "#eab308", badge: "#ca8a04", texto: "#854d0e" },
  };

  return (
    <div>
      {/* Intro */}
      <Card sx={{ background: "linear-gradient(135deg,#1a202c,#2d3748)", border: "none" }}>
        <div style={{ color: "#fff" }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>✨</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Actividades generadas por IA</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", lineHeight: 1.6 }}>
            Claude analiza el historial de {alumno.nombre.split(" ")[0]} en la materia que elijas y genera actividades adaptadas a su nivel actual, su diagnóstico y los acuerdos con los docentes.
          </div>
        </div>
      </Card>

      {/* Selector materia */}
      <div style={{ marginBottom: 16 }}>
        <SecT text="¿Para qué materia?" />
        {materias.length === 0
          ? <div style={{ fontSize: 13, color: GL, fontStyle: "italic", padding: "12px 0" }}>Sin horarios cargados. Agregalos en la pestaña Horarios para poder generar actividades.</div>
          : <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {materias.map(m => (
                <button key={m} onClick={() => { setMateriaSeleccionada(m); setActividades(null); }}
                  style={{ padding: "10px 16px", borderRadius: 12, border: "2px solid", borderColor: materiaSeleccionada === m ? ec : BD, background: materiaSeleccionada === m ? ec : "#fff", color: materiaSeleccionada === m ? "#fff" : "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{m}</button>
              ))}
            </div>}
      </div>

      {/* Contexto disponible */}
      {materiaSeleccionada && (
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", marginBottom: 16, border: `1px solid ${BD}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 8 }}>Contexto que Claude va a analizar</div>
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
            📋 Diagnóstico: <strong>{alumno.diagnostico}</strong><br />
            🔬 Terapias: <strong>{(alumno.terapias || []).map(t => t.nombre).join(", ") || "Ninguna"}</strong><br />
            📝 Registros en {materiaSeleccionada}: <strong>{regsMateria.length} clase{regsMateria.length !== 1 ? "s" : ""}</strong>
          </div>
          {regsMateria.length === 0 && <div style={{ marginTop: 8, fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>⚠ Sin registros en esta materia. Las actividades se basarán en el diagnóstico y las terapias.</div>}
        </div>
      )}

      {/* Orientación temática */}
      {materiaSeleccionada && !actividades && !cargando && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 6, letterSpacing: .5 }}>
            Orientación temática <span style={{ fontSize: 11, fontWeight: 400, color: GL, textTransform: "none" }}>(opcional)</span>
          </div>
          <textarea value={orientacion} onChange={e => setOrientacion(e.target.value)}
            placeholder={`Ej: "Estamos viendo fracciones con denominadores distintos" · "Repaso de la Revolución de Mayo"\n\nSi lo dejás vacío Claude decide según el historial.`}
            style={{ width: "100%", border: `2px solid ${orientacion.trim() ? ec : BD}`, borderRadius: 12, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", color: TX, background: orientacion.trim() ? "#f0fdf4" : "#f8fafc", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 80, lineHeight: 1.5 }} />
          {orientacion.trim() && <div style={{ fontSize: 11, color: "#166534", marginTop: 4, fontWeight: 600 }}>✓ Claude va a orientar las actividades hacia: "{orientacion.trim().slice(0, 60)}{orientacion.trim().length > 60 ? "..." : ""}"</div>}
        </div>
      )}

      {/* Botón generar */}
      {materiaSeleccionada && !cargando && !actividades && (
        <button onClick={generarActividades} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${ec},${ec}cc)`, color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: `0 4px 16px ${ec}44` }}>
          <span style={{ fontSize: 22 }}>✨</span>
          Generar actividades{orientacion.trim() ? ` sobre "${orientacion.trim().split(" ").slice(0, 4).join(" ")}..."` : ` para ${materiaSeleccionada}`}
        </button>
      )}

      {/* Cargando */}
      {cargando && (
        <Card sx={{ textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Claude está analizando...</div>
          <div style={{ fontSize: 13, color: GR, lineHeight: 1.6, marginBottom: 20 }}>Está revisando el historial de {alumno.nombre.split(" ")[0]} en {materiaSeleccionada} y diseñando actividades adaptadas.</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: ec, animation: `pulse 1.2s ${i * .2}s infinite` }} />)}
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
        </Card>
      )}

      {/* Error */}
      {error && <div style={{ background: "#fef2f2", border: "1.5px solid #dc2626", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#991b1b", fontWeight: 600 }}>⚠ {error}</div>}

      {/* Resultado */}
      {actividades && (
        <div>
          {actividades.contexto && (
            <div style={{ background: "#f0fdf4", border: `1.5px solid ${ec}`, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ec, textTransform: "uppercase", marginBottom: 4 }}>Nivel actual de {alumno.nombre.split(" ")[0]} en {materiaSeleccionada}</div>
              <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.5 }}>{actividades.contexto}</div>
            </div>
          )}
          {(actividades.actividades || []).map((act, i) => {
            const col = coloresNivel[act.nivel] || coloresNivel["Consolidación"];
            return (
              <div key={i} style={{ background: col.bg, border: `2px solid ${col.border}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{act.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ background: col.badge, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{act.nivel}</span>
                      <span style={{ fontSize: 11, color: col.texto, fontWeight: 600 }}>⏱ {act.tiempo} min</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: TX }}>{act.titulo}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: col.texto, textTransform: "uppercase", marginBottom: 4 }}>Objetivo</div>
                <div style={{ fontSize: 13, color: TX, marginBottom: 12, lineHeight: 1.5 }}>{act.objetivo}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: col.texto, textTransform: "uppercase", marginBottom: 4 }}>Cómo realizarla</div>
                <div style={{ fontSize: 13, color: TX, lineHeight: 1.6, marginBottom: 12 }}>{act.descripcion}</div>
                {act.adaptaciones && (
                  <div style={{ background: "rgba(255,255,255,.7)", borderRadius: 10, padding: "10px 12px", border: `1px solid ${col.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: col.texto, textTransform: "uppercase", marginBottom: 4 }}>Adaptaciones para {alumno.nombre.split(" ")[0]}</div>
                    <div style={{ fontSize: 13, color: TX, lineHeight: 1.5 }}>{act.adaptaciones}</div>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            <button onClick={() => { setActividades(null); setOrientacion(""); }} style={{ padding: "12px", borderRadius: 12, border: `2px solid ${BD}`, background: "#fff", color: GR, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>🔄 Generar otras</button>
            <button onClick={() => {
              const texto = `Actividades para ${alumno.nombre} — ${materiaSeleccionada}\n\n${actividades.contexto}\n\n${(actividades.actividades || []).map(a => `${a.emoji} ${a.nivel}: ${a.titulo}\n${a.descripcion}\nAdaptaciones: ${a.adaptaciones}`).join("\n\n")}`;
              navigator.clipboard?.writeText(texto).then(() => alert("¡Copiado al portapapeles!")).catch(() => alert("Seleccioná el texto y copialo manualmente."));
            }} style={{ padding: "12px", borderRadius: 12, border: "none", background: ec, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>📋 Copiar texto</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab Documentos (PPI + Informes) ────────────────────────────
function TabDocumentos({ alumno, docentes, escuelas, registros, ec }) {
  const [docActivo, setDocActivo] = useState("ppi");
  const [generando, setGenerando] = useState(null);
  const cicloAct = String(new Date().getFullYear());
  const storageKey = `aye_docs_${alumno.id}_${cicloAct}`;
  const [docs, setDocs] = useState(() => leer(storageKey, { ppi: {}, medio: {}, final: {} }));
  const escuela = escuelas.find(e => e.id === alumno.escuelaId);

  const setDoc = (tipo, campo, valor) => {
    const nuevo = { ...docs, [tipo]: { ...docs[tipo], [campo]: valor } };
    setDocs(nuevo);
    grabar(storageKey, nuevo);
    DB.save("documentos", { id: `${alumno.id}_${cicloAct}_${tipo}`, alumnoId: alumno.id, ciclo: cicloAct, tipo, contenido: nuevo[tipo], eliminado: false });
  };

  const generarConClaude = async (tipo) => {
    setGenerando(tipo);
    const regsA = (registros[alumno.id] || []).filter(r => !r.eliminado).slice(0, 10);
    const historial = regsA.map(r => `${fmtF(r.fecha)} — ${r.materia}: ${r.avance || "Sin registro."}`).join("\n") || "Sin registros aún.";
    const paradigma = "Modelo social de la discapacidad, PBA 2026. Evitar: dificultad, problema, déficit. Usar: intervención, ajuste razonable, facilitador, trayectoria.";
    const prompts = {
      ppi:   `${paradigma}\nRedactá en español rioplatense la sección "Situación de aprendizaje actual" del PPI de ${alumno.nombre} (${alumno.diagnostico}, ${alumno.curso}). Historial: ${historial}. Solo el texto, sin título.`,
      medio: `${paradigma}\nRedactá en español rioplatense el Informe de Medio Año de ${alumno.nombre} (${alumno.diagnostico}). Historial: ${historial}. Narrativo por materia.`,
      final: `${paradigma}\nRedactá en español rioplatense el Informe Final Anual de ${alumno.nombre} (${alumno.diagnostico}). Historial: ${historial}. Narrativo con síntesis anual.`,
    };
    try {
      const res = await fetch("/api/claude", { method: "POST", headers: authHeaders(), body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 800, messages: [{ role: "user", content: prompts[tipo] }] }) });
      const data = await res.json();
      const texto = data.content?.[0]?.text || "";
      if (tipo === "ppi") setDoc("ppi", "situacionActual", texto);
      else setDoc(tipo, "contenido", texto);
    } catch {
      if (tipo === "ppi") setDoc("ppi", "situacionActual", "[Error al generar. Completá manualmente.]");
      else setDoc(tipo, "contenido", "[Error al generar. Completá manualmente.]");
    } finally { setGenerando(null); }
  };

  const DOCS = [
    { id: "ppi",   icon: "📋", label: "PPI",       periodo: "Mar–May" },
    { id: "medio", icon: "📊", label: "Medio Año", periodo: "Jul–Ago" },
    { id: "final", icon: "🏁", label: "Inf. Final", periodo: "Nov"    },
  ];

  const campo = docActivo === "ppi" ? "situacionActual" : "contenido";
  const contenido = docs[docActivo]?.[campo] || "";
  const titulos = { ppi: "Situación de aprendizaje actual (PPI)", medio: "Informe de Medio Año", final: "Informe Final Anual" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
        {DOCS.map(d => (
          <button key={d.id} onClick={() => setDocActivo(d.id)} style={{ padding: "10px 6px", borderRadius: 14, border: "2px solid", textAlign: "center", cursor: "pointer", fontFamily: "inherit", borderColor: docActivo === d.id ? ec : BD, background: docActivo === d.id ? ec : "#fff", color: docActivo === d.id ? "#fff" : "#475569" }}>
            <div style={{ fontSize: 20, marginBottom: 3 }}>{d.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 11 }}>{d.label}</div>
            <div style={{ fontSize: 9, opacity: .8, marginTop: 1 }}>{d.periodo}</div>
          </button>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <SecT text={titulos[docActivo]} />
          <button onClick={() => generarConClaude(docActivo)} disabled={!!generando}
            style={{ background: ec + "18", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: ec, cursor: generando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {generando === docActivo ? "⏳ Generando..." : "✨ Generar con Claude"}
          </button>
        </div>
        <textarea value={contenido} onChange={e => setDoc(docActivo, campo, e.target.value)}
          placeholder={`Redactá el ${titulos[docActivo].toLowerCase()} o tocá "✨ Generar con Claude"...`}
          style={{ width: "100%", border: `2px solid ${contenido ? ec : BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", color: TX, background: "#f8fafc", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 160, lineHeight: 1.6 }} />
      </Card>

      <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#166534", lineHeight: 1.5, marginTop: 8 }}>
        ✅ Se guarda automáticamente. Para el PDF completo con firmas, usá la sección <strong>Reportes</strong>.
      </div>
    </div>
  );
}

// ── FichaAlumno principal ──────────────────────────────────────
export default function FichaAlumno({ alumno, alumnos, docentes, pros, escuelas, registros, recs, onBack, onVerClase, onAddRec, onAddReg, onDelReg, onEditar, onToggleActivo, onDelete, onSave }) {
  const [tab, setTab] = useState("info");
  const [docSel, setDocSel] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [conf, setConf] = useState(null);
  const [formH, setFormH] = useState(null);
  const [formHIdx, setFormHIdx] = useState(null);

  const esc = escuelas.find(e => e.id === alumno.escuelaId);
  const ec = esc?.color || G;
  const regsA = (registros[alumno.id] || []).filter(r => !r.eliminado);
  const docsA = [...new Set((alumno.horarios || []).filter(h => h.docenteId).map(h => h.docenteId))]
    .map(id => docentes.find(d => d.id === id)).filter(Boolean);

  const cudDias = alumno.cud && alumno.cudVencimiento
    ? Math.round((new Date(alumno.cudVencimiento) - new Date()) / 864e5)
    : null;

  const inact = alumno.activo === false;

  if (docSel) return <DetalleDoc doc={docSel} alumno={alumno} docentes={docentes} registros={registros} ec={ec} onBack={() => setDocSel(null)} onAdd={onAddReg} />;

  const guardarBloque = () => {
    const nuevos = [...(alumno.horarios || [])];
    const esNuevo = formHIdx === null;
    const seSolapa = (dia, ini, fin, excluirIdx = null) =>
      (alumno.horarios || []).some((h, i) => {
        if (i === excluirIdx || h.dia !== dia) return false;
        return hMin(ini) < hMin(h.horaFin) && hMin(fin) > hMin(h.horaInicio);
      });

    if (!esNuevo) {
      if (seSolapa(formH.dia, formH.horaInicio, formH.horaFin, formHIdx)) {
        alert(`⚠ El horario ${formH.horaInicio}–${formH.horaFin} se solapa con otro bloque del ${DIAS_L[formH.dia]}.`);
        return;
      }
      nuevos[formHIdx] = { ...formH };
    } else {
      const dias = (formH.dias || []).length > 0 ? formH.dias : [formH.dia || 1];
      const conflictos = dias.filter(d => seSolapa(d, formH.horaInicio, formH.horaFin));
      if (conflictos.length > 0) { alert(`⚠ Solape en: ${conflictos.map(d => DIAS_L[d]).join(", ")}`); return; }
      dias.forEach(d => nuevos.push({ ...formH, dia: d }));
    }
    onSave && onSave({ ...alumno, horarios: nuevos });
    setFormH(null); setFormHIdx(null);
  };

  const TABS = [
    { id: "info",        l: "📋 Info"      },
    { id: "docentes",    l: "👥 Docentes"  },
    { id: "historial",   l: "📝 Historial" },
    { id: "horarios",    l: "🗓 Horarios"  },
    { id: "actividades", l: "✨ Actividades"},
  ];

  return (
    <div style={{ paddingBottom: 80 }}>
      {conf && <Confirm msg={conf.msg} onOk={conf.ok} onNo={() => setConf(null)} />}
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: ec, fontWeight: 700, fontSize: 14, padding: 0, marginBottom: 16, fontFamily: "inherit" }}>← Volver</button>

      {/* Alerta CUD */}
      {cudDias !== null && cudDias < 180 && (
        <div style={{ background: cudDias < 0 ? "#fef2f2" : "#fffbeb", border: `1.5px solid ${cudDias < 0 ? "#dc2626" : "#f59e0b"}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 13, fontWeight: 700, color: cudDias < 0 ? "#991b1b" : "#92400e" }}>
          {cudDias < 0 ? "⚠️ CUD VENCIDO — renovar urgente" : `⚠️ CUD vence en ${cudDias} días`}
        </div>
      )}

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${ec},${ec}aa)`, borderRadius: 20, padding: 20, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar nombre={alumno.nombre} size={56} bg="rgba(255,255,255,.25)" />
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{alumno.nombre}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.85)", marginTop: 2 }}>{alumno.curso} · {esc?.nombre}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 2 }}>{alumno.diagnostico}</div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {onEditar && <button onClick={() => onEditar(alumno)} style={{ flex: 1, background: "#fff", border: `1.5px solid ${BD}`, borderRadius: 12, padding: "10px 6px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, color: TX }}>✏️ Editar</button>}
        {onToggleActivo && <button onClick={() => setConf({ msg: `¿${inact ? "Reactivar" : "Archivar"} a ${alumno.nombre}? Sus datos e historial se conservan.`, ok: () => { onToggleActivo(alumno.id); setConf(null); onBack(); } })} style={{ flex: 1, background: "#fff", border: `1.5px solid ${BD}`, borderRadius: 12, padding: "10px 6px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, color: inact ? G : GR }}>{inact ? "▶ Reactivar" : "⏸ Archivar"}</button>}
        {onDelete && <button onClick={() => setConf({ msg: `¿Eliminar a ${alumno.nombre}? Esta acción no se puede deshacer. Los registros son documentos pedagógicos.`, ok: () => { onDelete(alumno.id); setConf(null); onBack(); } })} style={{ flex: 1, background: "#fff", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "10px 6px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, color: "#dc2626" }}>🗑 Eliminar</button>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {TABS.map(t =>
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 16px", borderRadius: 20, border: "2px solid", borderColor: tab === t.id ? ec : BD, background: tab === t.id ? ec : "#fff", color: tab === t.id ? "#fff" : "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{t.l}</button>
        )}
      </div>

      {/* ── TAB INFO ── */}
      {tab === "info" && <div>
        <Card>
          <SecT text="Datos personales" />
          <div style={{ display: "grid", gap: 10 }}>
            {[["DNI", alumno.dni || "—"], ["CUIL", alumno.cuil || "—"], ["Fecha de nacimiento", fmtF(alumno.fechaNacimiento)], ["Dirección", alumno.direccion || "—"], ["Teléfono de casa", alumno.telefonoCasa || "—"]].map(([l, v]) =>
              <div key={l}><span style={{ fontSize: 11, color: GL, textTransform: "uppercase", fontWeight: 700 }}>{l}</span><div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{v}</div></div>
            )}
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: alumno.cud ? "#f0fdf4" : "#fafafa", border: `1.5px solid ${alumno.cud ? "#86efac" : BD}` }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: alumno.cud ? "#166534" : GR }}>{alumno.cud ? "✅ Tiene CUD" : "⬜ Sin CUD"}</div>
            {alumno.cud && <><div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>{alumno.cudNumero}</div><div style={{ fontSize: 11, color: GL, marginTop: 1 }}>Vence: {fmtF(alumno.cudVencimiento)}</div></>}
          </div>
        </Card>
        <Card>
          <SecT text="Familia y contactos" />
          {(alumno.tutores || []).map((t, i, arr) => (
            <div key={i} style={{ paddingBottom: 14, marginBottom: i < arr.length - 1 ? 14 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{t.nombre}</div>
                    {t.principal && <span style={{ background: ec + "22", color: ec, borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>Principal</span>}
                  </div>
                  <div style={{ fontSize: 12, color: GR, marginTop: 2 }}>{t.relacion} · {t.telefono}</div>
                </div>
                <WA tel={t.telefono} />
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <SecT text="Salud" />
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {[["Diagnóstico", alumno.diagnostico], ["Obra Social", alumno.obraSocial ? `${alumno.obraSocial} · ${alumno.nroAfiliado}` : "—"], ["Medicación", alumno.medicacion || "—"]].map(([l, v]) =>
              <div key={l}><span style={{ fontSize: 11, color: GL, textTransform: "uppercase", fontWeight: 700 }}>{l}</span><div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{v}</div></div>
            )}
          </div>
          {(alumno.terapias || []).length > 0 && <>
            <SecT text="Terapias actuales" />
            {(alumno.terapias || []).map((t, i, arr) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : "none" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>🔬 {t.nombre}</div>
                <div style={{ fontSize: 12, color: GR, marginTop: 2 }}>{t.profesional}</div>
                <div style={{ fontSize: 11, color: GL, marginTop: 1 }}>{t.frecuencia}</div>
              </div>
            ))}
          </>}
        </Card>
        {(alumno.profesionalIds || []).length > 0 && (
          <Card>
            <SecT text="Profesionales externos" />
            {(alumno.profesionalIds || []).map((pid, i, arr) => {
              const p = pros.find(x => x.id === pid && !x.eliminado);
              if (!p) return null;
              return (
                <div key={p.id} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : "none" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: GR }}>{p.rol}</div>
                  {p.mail && <div style={{ fontSize: 11, color: GL, marginTop: 1 }}>✉ {p.mail}</div>}
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}><WA tel={p.telefono} /><Mail mail={p.mail} /></div>
                </div>
              );
            })}
          </Card>
        )}
        {(alumno.trayectoria || []).length > 0 && (
          <Card>
            <SecT text="Trayectoria escolar" />
            {[...(alumno.trayectoria || [])].reverse().map((t, i, arr) => (
              <div key={t.ciclo || i} style={{ display: "flex", gap: 14, marginBottom: i < arr.length - 1 ? 4 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 20 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", marginTop: 4, flexShrink: 0, background: i === 0 ? ec : "#cbd5e0", border: i === 0 ? `3px solid ${ec}44` : "none" }} />
                  {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: BD, minHeight: 20, marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: 16 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: i === 0 ? ec : GR }}>{t.ciclo}</span>
                    <span style={{ background: i === 0 ? ec + "18" : "#f1f5f9", color: i === 0 ? ec : "#475569", borderRadius: 6, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{t.nivel}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TX }}>{t.institucion}</div>
                  {t.notas && <div style={{ fontSize: 12, color: GR, marginTop: 4, lineHeight: 1.5 }}>{t.notas}</div>}
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>}

      {/* ── TAB DOCENTES ── */}
      {tab === "docentes" && <div>
        <div style={{ fontSize: 13, color: GR, marginBottom: 16 }}>Tocá un docente para ver su historial con {alumno.nombre.split(" ")[0]}.</div>
        {docsA.length === 0
          ? <Card sx={{ textAlign: "center", padding: 32 }}><div style={{ fontSize: 32, marginBottom: 8 }}>👩‍🏫</div><div style={{ color: GR }}>Sin docentes asociados. Cargá los horarios del alumno.</div></Card>
          : docsA.map(d => {
              const cr = regsA.filter(r => r.docente === d.nombre).length;
              const ds = [...new Set((alumno.horarios || []).filter(h => h.docenteId === d.id).map(h => DIAS[h.dia]))].join(", ");
              return (
                <Card key={d.id} onClick={() => setDocSel(d)} sx={{ borderLeft: `4px solid ${ec}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, background: ec + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: ec }}>{(d.nombre || "?").split(" ").pop()[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 17, color: TX }}>{d.materia}</div>
                      <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{d.nombre}</div>
                      <div style={{ fontSize: 12, color: GL, marginTop: 3 }}>{ds && `📅 ${ds}`}{cr > 0 && ` · 📝 ${cr} reg.`}</div>
                    </div>
                    <div style={{ fontSize: 20, color: "#cbd5e0" }}>›</div>
                  </div>
                </Card>
              );
            })}
      </div>}

      {/* ── TAB HISTORIAL ── */}
      {tab === "historial" && <div>
        {!showForm
          ? <Btn full onClick={() => setShowForm(true)} color={ec}>+ Nuevo registro</Btn>
          : <FormReg alumno={alumno} docentes={docentes} escColor={ec} onSave={r => { onAddReg(alumno.id, r); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
        <div style={{ marginTop: 16 }}>
          {regsA.length === 0
            ? <Card sx={{ textAlign: "center", padding: 32 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📝</div><div style={{ color: GR }}>Sin registros aún</div></Card>
            : regsA.map(r => <RegCard key={r.id} r={r} onDel={id => onDelReg(alumno.id, id)} />)}
        </div>
      </div>}

      {/* ── TAB ACTIVIDADES IA ── */}
      {tab === "actividades" && <TabActividades alumno={alumno} registros={registros} docentes={docentes} ec={ec} />}

      {/* ── TAB HORARIOS ── */}
      {tab === "horarios" && <div>
        {formH && (() => {
          const docsEsc = docentes.filter(d => d.escuelaId === alumno.escuelaId && !d.eliminado);
          const setFH = (k, v) => setFormH(p => ({ ...p, [k]: v }));
          const esNuevo = formHIdx === null;
          const toggleDia = d => {
            if (!esNuevo) { setFH("dia", d); return; }
            const dias = formH.dias || [];
            setFH("dias", dias.includes(d) ? dias.filter(x => x !== d) : [...dias, d]);
          };
          const diaActivo = d => esNuevo ? (formH.dias || []).includes(d) : formH.dia === d;
          return (
            <div style={{ background: "#f8fafc", border: `2px solid ${ec}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: TX, marginBottom: 12 }}>{esNuevo ? "Nuevo bloque" : "Editar bloque"}</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 4 }}>{esNuevo ? "Días (podés elegir varios)" : "Día"}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map(d => (
                    <button key={d} onClick={() => toggleDia(d)} style={{ padding: "7px 12px", borderRadius: 20, border: "2px solid", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer", borderColor: diaActivo(d) ? ec : BD, background: diaActivo(d) ? ec : "#fff", color: diaActivo(d) ? "#fff" : "#475569" }}>{DIAS_L[d].slice(0, 3)}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 6 }}>Hora inicio</div>
                  <input type="time" value={formH.horaInicio} onChange={e => setFH("horaInicio", e.target.value)} style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 10, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 6 }}>Hora fin</div>
                  <input type="time" value={formH.horaFin} onChange={e => setFH("horaFin", e.target.value)} style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 10, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", background: formH.esRecreo ? "#f0fdf4" : "#fff", borderRadius: 10, border: `1.5px solid ${formH.esRecreo ? G : BD}` }}>
                  <input type="checkbox" checked={formH.esRecreo || false} onChange={e => { setFH("esRecreo", e.target.checked); if (e.target.checked) setFH("docenteId", ""); }} style={{ width: 18, height: 18, accentColor: G }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: formH.esRecreo ? G : TX }}>Es recreo / recreación</span>
                </label>
              </div>
              {!formH.esRecreo && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 6 }}>Docente</div>
                  <select value={formH.docenteId || ""} onChange={e => setFH("docenteId", e.target.value)} style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }}>
                    <option value="">Sin docente asignado</option>
                    {docsEsc.map(d => <option key={d.id} value={d.id}>{d.materia} — {d.nombre}</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 6 }}>Aula / Espacio</div>
                <input value={formH.aula || ""} onChange={e => setFH("aula", e.target.value)} placeholder="Aula 3A, Laboratorio..." style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 10, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn full outline onClick={() => { setFormH(null); setFormHIdx(null); }} color={GR}>Cancelar</Btn>
                <Btn full color={ec} onClick={guardarBloque}>{esNuevo ? "Agregar bloque" : "Guardar cambios"}</Btn>
              </div>
            </div>
          );
        })()}

        {!formH && (
          <button onClick={() => { setFormH({ dias: [], horaInicio: "08:00", horaFin: "09:00", docenteId: "", aula: "", esRecreo: false }); setFormHIdx(null); }}
            style={{ width: "100%", padding: 12, borderRadius: 14, border: `2px dashed ${ec}`, background: ec + "0a", color: ec, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>
            + Agregar bloque horario
          </button>
        )}

        {[1, 2, 3, 4, 5].map(dia => {
          const bloques = (alumno.horarios || []).map((h, i) => ({ ...h, _i: i })).filter(h => h.dia === dia).sort((a, b) => a.horaInicio > b.horaInicio ? 1 : -1);
          if (bloques.length === 0) return null;
          return (
            <div key={dia} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: ec, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6, paddingLeft: 4 }}>{DIAS_L[dia]}</div>
              {bloques.map(h => {
                const doc = h.docenteId ? docentes.find(d => d.id === h.docenteId) : null;
                return (
                  <div key={h._i} style={{ background: "#fff", border: `1.5px solid ${BD}`, borderRadius: 14, padding: "12px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: h.esRecreo ? "#f0fdf4" : ec + "15", borderRadius: 10, padding: "8px 10px", textAlign: "center", flexShrink: 0, minWidth: 52 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: h.esRecreo ? G : ec, lineHeight: 1 }}>{h.horaInicio}</div>
                      <div style={{ fontSize: 10, color: GL, marginTop: 2 }}>{h.horaFin}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {h.esRecreo
                        ? <div style={{ fontWeight: 700, fontSize: 14, color: G }}>☕ Recreo</div>
                        : <><div style={{ fontWeight: 800, fontSize: 14, color: TX }}>{doc?.materia || "Sin materia"}</div><div style={{ fontSize: 12, color: GR, marginTop: 2 }}>{doc?.nombre || "Sin docente"}{h.aula ? ` · ${h.aula}` : ""}</div></>}
                    </div>
                    {!formH && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => { setFormH({ ...h }); setFormHIdx(h._i); }} style={{ background: ec + "15", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: ec, fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>Editar</button>
                        <button onClick={() => { const nuevos = (alumno.horarios || []).filter((_, i) => i !== h._i); onSave && onSave({ ...alumno, horarios: nuevos }); }} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#dc2626", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>🗑</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
