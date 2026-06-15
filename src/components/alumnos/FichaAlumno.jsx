import React, { useState } from 'react';
import { G, GD, GR, GL, BD, TX, DIAS, DIAS_L } from '../../constants';
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

  const exportarPDFActividades = (actividades) => {
    const fechaStr = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
    const colores = { "Consolidación": "#2563eb", "Avance": "#16a34a", "Extensión": "#ca8a04" };
    const actHTML = (actividades.actividades || []).map(act => {
      const c = colores[act.nivel] || ec;
      return `<div style="border:2px solid ${c};border-radius:12px;margin-bottom:20px;overflow:hidden;page-break-inside:avoid">
        <div style="background:${c};color:#fff;padding:12px 18px;display:flex;align-items:center;gap:12px">
          <span style="font-size:24px">${act.emoji}</span>
          <div>
            <div style="font-size:11px;opacity:.8;font-weight:700;text-transform:uppercase;letter-spacing:1px">${act.nivel} · ${act.tiempo} min</div>
            <div style="font-size:17px;font-weight:900">${act.titulo}</div>
          </div>
        </div>
        <div style="padding:14px 18px">
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Objetivo</div>
          <div style="font-size:14px;margin-bottom:12px;line-height:1.5">${act.objetivo}</div>
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Cómo realizarla</div>
          <div style="font-size:14px;margin-bottom:12px;line-height:1.6">${act.descripcion}</div>
          ${act.adaptaciones ? `<div style="background:#f8fafc;border-radius:8px;padding:10px 14px;border-left:3px solid ${c}">
            <div style="font-size:11px;font-weight:700;color:${c};text-transform:uppercase;margin-bottom:4px">Adaptación para ${alumno.nombre.split(" ")[0]}</div>
            <div style="font-size:13px;line-height:1.5">${act.adaptaciones}</div>
          </div>` : ""}
        </div>
      </div>`;
    }).join("");
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a202c;font-size:14px}
      .page{max-width:720px;margin:0 auto}
      .banner{background:${ec};padding:22px 36px 16px;color:#fff}
      .banner-eye{font-size:10px;letter-spacing:2px;text-transform:uppercase;opacity:.7;margin-bottom:5px}
      .banner-titulo{font-size:21px;font-weight:900;margin-bottom:2px}
      .banner-sub{font-size:12px;opacity:.75}
      .body{padding:22px 36px}
      .ficha{display:flex;margin-bottom:18px;border-radius:10px;overflow:hidden;border:1.5px solid #e2e8f0}
      .ficha-l{background:${ec}12;padding:12px 16px;flex:1}
      .ficha-r{background:#f8fafc;padding:12px 16px;flex:1;border-left:1.5px solid #e2e8f0}
      .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:2px}
      .val{font-size:13px;font-weight:700;color:#1a202c;margin-bottom:7px}
      .ctx{background:#f0fdf4;border:1.5px solid ${ec};border-radius:10px;padding:12px 14px;margin-bottom:18px;font-size:13px;color:#166534;line-height:1.5}
      .ctx-lbl{font-size:10px;font-weight:700;color:${ec};text-transform:uppercase;margin-bottom:4px}
      .footer{margin-top:20px;text-align:center;font-size:10px;color:#cbd5e0;padding-bottom:14px}
      @media print{@page{margin:1.2cm}}
    </style></head><body><div class="page">
      <div class="banner">
        <div class="banner-eye">Propuesta de actividades · Modalidad Especial DGCyE</div>
        <div class="banner-titulo">${materiaSeleccionada} — ${alumno.nombre}</div>
        <div class="banner-sub">${fechaStr}</div>
      </div>
      <div class="body">
        <div class="ficha">
          <div class="ficha-l">
            <div class="lbl">Alumno/a</div><div class="val">${alumno.nombre}</div>
            <div class="lbl">Diagnóstico</div><div class="val">${alumno.diagnostico || "-"}</div>
          </div>
          <div class="ficha-r">
            <div class="lbl">Materia</div><div class="val">${materiaSeleccionada}</div>
            <div class="lbl">Elaborado por</div><div class="val">${appState.nombreDocente || "AP"}</div>
          </div>
        </div>
        ${actividades.contexto ? `<div class="ctx"><div class="ctx-lbl">Nivel actual en ${materiaSeleccionada}</div>${actividades.contexto}</div>` : ""}
        ${actHTML}
        <div class="footer">Res. 1664/17 · DGCyE · Generado con apoyo de IA y revisado por la AP</div>
      </div>
    </div></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 500);
  };

  const generarActividades = async () => {
    if (!materiaSeleccionada) return;
    setCargando(true); setError(""); setActividades(null);
    const edad = alumno.fechaNacimiento ? Math.floor((Date.now() - new Date(alumno.fechaNacimiento)) / 31557600000) + " años" : null;
    const terapiasStr = (alumno.terapias || []).filter(t => t.nombre).map(t => `${t.nombre} — ${t.profesional || "-"} (${t.frecuencia || "-"})`).join("; ") || "Ninguna";
    const historialResumen = regsMateria.length > 0
      ? regsMateria.map(r => `• ${fmtF(r.fecha)}: ${r.asistencia}. ${r.avance || ""}${r.acuerdo ? ` | Acuerdo: ${r.acuerdo}` : ""}`).join("\n")
      : "Sin registros previos en esta materia.";
    const docenteMateria = docentes.find(d =>
      (alumno.horarios || []).some(h => h.docenteId === d.id) && d.materia === materiaSeleccionada
    );
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          max_tokens: 1400,
          messages: [{
            role: "user",
            content: `Sos una AP (Docente de Inclusión) experta en adaptaciones curriculares de Modalidad Especial bonaerense. Tu trabajo es diseñar propuestas de actividades REALMENTE individualizadas, no genéricas.

═══ PERFIL DEL ALUMNO ═══
Nombre: ${alumno.nombre}${edad ? ` | ${edad}` : ""}
Curso: ${[alumno.anio, alumno.division].filter(Boolean).join(" ") || alumno.curso || "-"}
Diagnóstico: ${alumno.diagnostico || "-"}
Terapias: ${terapiasStr}
${docenteMateria ? `Docente de grado: ${docenteMateria.nombre}` : ""}
${orientacion.trim() ? `Indicación de la AP: ${orientacion.trim()}` : ""}

═══ HISTORIAL EN ${materiaSeleccionada.toUpperCase()} ═══
${historialResumen}

═══ TU ANÁLISIS ═══
Antes de generar las actividades, pensá:
- ¿Qué implica el diagnóstico para aprender ${materiaSeleccionada}? (atención, procesamiento, carga cognitiva, lenguaje)
- ¿Qué muestran los registros? ¿Qué funciona, qué no, qué acuerdos hay?
- ¿Qué aportan las terapias a las estrategias? (fonoaudiología → lenguaje; psicomotricidad → motricidad; psicología → regulación)
- ¿Cuál es el nivel real de este chico/a en esta materia ahora mismo?

Con eso, generá 3 propuestas para la próxima clase.

Respondé ÚNICAMENTE con JSON válido, sin backticks:
{
  "contexto": "2-3 oraciones sobre el nivel real del alumno en esta materia, basado en los registros y el diagnóstico",
  "actividades": [
    { "nivel": "Consolidación", "emoji": "🔁", "titulo": "nombre concreto", "descripcion": "cómo realizarla (2 oraciones máx, lenguaje claro)", "objetivo": "qué habilidad trabaja", "tiempo": "X", "adaptaciones": "ajuste específico para este alumno basado en su diagnóstico (1 oración)" },
    { "nivel": "Avance", "emoji": "📈", "titulo": "nombre concreto", "descripcion": "cómo realizarla", "objetivo": "qué habilidad trabaja", "tiempo": "X", "adaptaciones": "ajuste específico" },
    { "nivel": "Extensión", "emoji": "⭐", "titulo": "nombre concreto", "descripcion": "cómo realizarla", "objetivo": "qué habilidad trabaja", "tiempo": "X", "adaptaciones": "ajuste específico" }
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
      <Card sx={{ background: `linear-gradient(135deg,${GD},${GD}ee)`, border: "none" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            <button onClick={() => exportarPDFActividades(actividades)} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: ec, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>📄 Exportar PDF</button>
            <button onClick={() => {
              const txt = `*Propuesta de actividades — ${materiaSeleccionada}*\n*Alumno/a:* ${alumno.nombre}\n\n${actividades.contexto ? `📋 ${actividades.contexto}\n\n` : ""}${(actividades.actividades || []).map(a => `${a.emoji} *${a.nivel}: ${a.titulo}* (${a.tiempo} min)\n${a.descripcion}\n_Adaptación: ${a.adaptaciones}_`).join("\n\n")}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
            }} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: "#25D366", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>📱 Enviar por WhatsApp</button>
            <button onClick={() => { setActividades(null); setOrientacion(""); }} style={{ width: "100%", padding: 12, borderRadius: 12, border: `2px solid ${BD}`, background: "#fff", color: GR, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>🔄 Generar otras</button>
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
    const regsA = (registros[alumno.id] || []).filter(r => !r.eliminado).sort((a, b) => b.fecha?.localeCompare(a.fecha)).slice(0, 20);
    const historial = regsA.map(r => `${fmtF(r.fecha)} — ${r.materia}: ${r.avance || "Sin avance."}${r.acuerdo ? ` Acuerdo: ${r.acuerdo}` : ""}`).join("\n") || "Sin registros aún.";
    const edad = alumno.fechaNacimiento ? `${Math.floor((Date.now() - new Date(alumno.fechaNacimiento)) / 31557600000)} años` : null;
    const curso = [alumno.anio, alumno.division].filter(Boolean).join(" ") || alumno.curso || "-";
    const terapias = (alumno.terapias || []).filter(t => t.nombre).map(t => `${t.nombre} (${t.frecuencia || "-"})`).join(", ") || "Ninguna";
    const paradigma = "Modelo social de la discapacidad, PBA 2026. Terminología obligatoria — NUNCA usar: dificultad, problema, déficit, trastorno. USAR: intervención, ajuste razonable, facilitador, trayectoria, acompañamiento, Barreras al Aprendizaje y la Participación (BAP).";
    const perfil = `Alumno/a: ${alumno.nombre}${edad ? ` | ${edad}` : ""} | Curso: ${curso} | Diagnóstico: ${alumno.diagnostico || "-"} | Terapias: ${terapias}`;
    const prompts = {
      ppi:   `${paradigma}\n\n${perfil}\n\nRegistros de clase (más recientes primero):\n${historial}\n\nRedactá en español rioplatense la sección "Situación de aprendizaje actual" del PPI. Un párrafo narrativo, fluido y formal, que describa el recorrido y los apoyos. Sin títulos, sin asteriscos, sin guiones, sin markdown. Solo el texto.`,
      medio: `${paradigma}\n\n${perfil}\n\nRegistros de clase:\n${historial}\n\nRedactá en español rioplatense el Informe de Medio Año. Párrafos narrativos organizados por materia. Sin títulos con #, sin asteriscos, sin guiones, sin tablas. Texto corrido formal.`,
      final: `${paradigma}\n\n${perfil}\n\nRegistros de clase:\n${historial}\n\nRedactá en español rioplatense el Informe Final Anual. Párrafos narrativos con síntesis del recorrido anual. Sin títulos con #, sin asteriscos, sin guiones, sin tablas. Texto corrido formal.`,
    };
    try {
      const res = await fetch("/api/claude", { method: "POST", headers: authHeaders(), body: JSON.stringify({ max_tokens: 1000, messages: [{ role: "user", content: prompts[tipo] }] }) });
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
                <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap', alignItems:'center' }}>
                  {t.frecuencia && <span style={{ fontSize:11, color:GL }}>{t.frecuencia}</span>}
                  {t.telefono && <a href={`https://wa.me/54${t.telefono.replace(/[-\s]/g,'')}`} target="_blank" rel="noreferrer" style={{ display:'inline-flex',alignItems:'center',gap:4,background:'#25D366',color:'#fff',borderRadius:8,padding:'3px 8px',fontSize:11,fontWeight:700,textDecoration:'none' }}>💬 {t.telefono}</a>}
                </div>
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
