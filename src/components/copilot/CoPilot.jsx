import React, { useState, useRef } from 'react';
import { G, GR, GL, BD, TX } from '../../constants';
import { fmtF } from '../../utils/helpers';
import { authHeaders } from '../../utils/session';
import { appState } from '../../context/AppContext';

export default function CoPilot({ alumnos, docentes, pros, escuelas, registros, recs }) {
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState("input");
  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const recognRef = useRef(null);

  const iniciarVoz = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.lang = "es-AR"; r.continuous = false; r.interimResults = false;
    r.onresult = e => { setTexto(e.results[0][0].transcript); setGrabando(false); };
    r.onerror = () => setGrabando(false);
    r.start(); recognRef.current = r; setGrabando(true);
  };
  const detenerVoz = () => { recognRef.current?.stop(); setGrabando(false); };

  const construirContexto = () => {
    const aluActivos = alumnos.filter(a => !a.eliminado && a.activo !== false);
    const textoNorm = texto.toLowerCase();
    const aluMencionado = aluActivos.find(a =>
      a.nombre.toLowerCase().split(" ").some(part => part.length > 3 && textoNorm.includes(part.toLowerCase()))
    );
    const aluCtx = aluActivos.map(a => {
      if (aluMencionado && a.id === aluMencionado.id) {
        const esc = escuelas.find(e => e.id === a.escuelaId);
        const tutoresStr = (a.tutores || []).map(t => `${t.nombre} (${t.relacion}) ${t.telefono}`).join(", ");
        const prosStr = (a.profesionalIds || []).map(id => { const p = pros.find(x => x.id === id); return p ? `${p.nombre} (${p.rol}) ${p.telefono}` : null; }).filter(Boolean).join(", ");
        const regsR = (registros[a.id] || []).filter(r => !r.eliminado).slice(0, 4).map(r => `${fmtF(r.fecha)} ${r.materia}: ${r.avance || ""}${r.acuerdo ? ` Acuerdo:${r.acuerdo}` : ""}`).join(" | ");
        return `★ ${a.nombre} | ${esc?.nombre} | ${a.diagnostico} | Tutores: ${tutoresStr || "-"} | Prof: ${prosStr || "-"} | Regs: ${regsR || "sin registros"}`;
      }
      return `${a.nombre} | ${a.curso || "-"} | ${a.diagnostico || "-"}`;
    }).join("\n");
    const docCtx = docentes.filter(d => !d.eliminado).map(d => `${d.nombre} | ${d.materia} | ${d.telefono}`).join("\n");
    const avisosCtx = recs.filter(r => !r.eliminado).slice(0, 4).map(r => { const a = alumnos.find(x => x.id === r.alumnoId); return `[${r.prioridad}] ${r.texto}${a ? ` (${a.nombre})` : ""}`; }).join("\n");
    return `ALUMNOS:\n${aluCtx}\n\nDOCENTES:\n${docCtx}\n\nAVISOS:\n${avisosCtx || "ninguno"}`;
  };

  const procesar = async () => {
    if (!texto.trim()) return;
    setPaso("procesando");
    const contexto = construirContexto();
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          model: "claude-sonnet-4-5", max_tokens: 800,
          messages: [{ role: "user", content: `Sos el asistente de ${appState.nombreDocente}, Docente de la Modalidad Especial argentina.\n\nCOMANDO: "${texto}"\n\nCONTEXTO:\n${contexto}\n\nIdentificá la intención:\n1. Información/pregunta → tipo "busqueda"\n2. Enviar mensaje → tipo "whatsapp"\n\nRespondé SOLO con JSON válido sin backticks:\n\nPara búsqueda:\n{"tipo":"busqueda","titulo":"título","resumen":"respuesta narrativa","datos":["dato1","dato2"],"alumno":"nombre o null"}\n\nPara WhatsApp:\n{"tipo":"whatsapp","contactoNombre":"nombre","contactoRol":"rol","telefono":"número","mensajeSugerido":"texto del mensaje","alumno":"nombre o null"}` }]
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "error");
      const parsed = JSON.parse((data.content?.[0]?.text || "").replace(/```json|```/g, "").trim());
      setResultado(parsed);
      setPaso("resultado");
    } catch {
      // Fallback local: intenta responder con datos locales
      const q = texto.toLowerCase();
      const aluActivos = alumnos.filter(a => !a.eliminado && a.activo !== false);
      const aluMatch = aluActivos.find(a =>
        a.nombre.toLowerCase().split(" ").some(p => p.length > 3 && q.includes(p.toLowerCase()))
      );
      if (aluMatch) {
        const esc = escuelas.find(e => e.id === aluMatch.escuelaId);
        const tut = (aluMatch.tutores || []).find(t => t.principal) || (aluMatch.tutores || [])[0];
        const prosAlu = (aluMatch.profesionalIds || []).map(id => pros.find(x => x.id === id)).filter(Boolean);
        const regsR = (registros[aluMatch.id] || []).filter(r => !r.eliminado).slice(0, 3);
        setResultado({
          tipo: "busqueda",
          titulo: aluMatch.nombre,
          resumen: `${aluMatch.nombre} · ${aluMatch.diagnostico} · ${aluMatch.curso} · ${esc?.nombre || ""}`,
          datos: [
            tut ? `👨‍👩‍👦 ${tut.nombre} (${tut.relacion}) — ${tut.telefono}` : null,
            aluMatch.medicacion ? `💊 ${aluMatch.medicacion}` : null,
            ...prosAlu.map(p => `🔬 ${p.nombre} (${p.rol}) — ${p.telefono}`),
            ...regsR.map(r => `📝 ${r.fecha}: ${r.materia} — ${r.avance || "sin dato"}`),
          ].filter(Boolean),
          alumno: aluMatch.nombre,
        });
      } else {
        setResultado({ tipo: "busqueda", titulo: "Sin conexión con IA", resumen: "No hay conexión con el servidor de IA. Revisá tu conexión a internet o reintentá en unos segundos.", datos: ["Tip: podés buscar alumnos por nombre o apellido directamente desde la sección Alumnos."], alumno: null });
      }
      setPaso("resultado");
    }
  };

  const abrirWA = (tel, msg) => {
    const num = "54" + tel.replace(/[-\s]/g, "");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const cerrar = () => { setAbierto(false); setPaso("input"); setTexto(""); setResultado(null); };

  return (
    <>
      {/* FAB */}
      <div style={{ position: "fixed", bottom: 80, right: 20, zIndex: 300 }}>
        <button onClick={() => setAbierto(true)}
          style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ✨
        </button>
      </div>

      {/* Modal */}
      {abierto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 500 }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: 24, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,.2)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✨</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: TX }}>Co-Pilot Pedagógico</div>
                  <div style={{ fontSize: 12, color: GL }}>Preguntá o pedí que haga algo</div>
                </div>
              </div>
              <button onClick={cerrar} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: GR }}>✕</button>
            </div>

            {paso === "input" && (
              <div>
                <div style={{ background: "#f5f3ff", borderRadius: 14, padding: 14, marginBottom: 16, fontSize: 12, color: "#7c3aed", lineHeight: 1.7 }}>
                  <strong>Podés preguntarme:</strong><br />
                  🔍 "¿Qué acordamos con la psicóloga de Sofía?"<br />
                  💬 "Avisale a la Seño Ana que Sofía no viene hoy"<br />
                  📱 "Mandá un mensaje a la mamá de Valentina"
                </div>
                <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escribí o grabá tu pregunta..."
                  style={{ width: "100%", border: "2px solid #7c3aed", borderRadius: 12, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", color: TX, background: "#faf5ff", boxSizing: "border-box", outline: "none", resize: "none", minHeight: 80, marginBottom: 12, lineHeight: 1.5 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                  <button onMouseDown={iniciarVoz} onMouseUp={detenerVoz} onTouchStart={e => { e.preventDefault(); iniciarVoz(); }} onTouchEnd={e => { e.preventDefault(); detenerVoz(); }}
                    style={{ padding: 12, borderRadius: 12, border: "2px solid #7c3aed", background: grabando ? "#7c3aed" : "#fff", color: grabando ? "#fff" : "#7c3aed", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {grabando ? "🔴 Grabando" : "🎙 Voz"}
                  </button>
                  <button onClick={procesar} disabled={!texto.trim()}
                    style={{ padding: 12, borderRadius: 12, border: "none", background: texto.trim() ? "linear-gradient(135deg,#7c3aed,#a78bfa)" : "#e2e8f0", color: texto.trim() ? "#fff" : GL, fontWeight: 800, fontSize: 14, cursor: texto.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>✨</span> Procesar
                  </button>
                </div>
              </div>
            )}

            {paso === "procesando" && (
              <div style={{ textAlign: "center", padding: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Analizando tu pedido...</div>
                <div style={{ fontSize: 13, color: GR, fontStyle: "italic", marginBottom: 20 }}>"{texto}"</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#7c3aed", animation: `pulse 1.2s ${i * .2}s infinite` }} />)}
                </div>
                <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
              </div>
            )}

            {paso === "resultado" && resultado?.tipo === "busqueda" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔍</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: TX }}>{resultado.titulo}</div>
                    {resultado.alumno && <div style={{ fontSize: 12, color: GL }}>Alumno/a: {resultado.alumno}</div>}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", marginBottom: 14, fontSize: 14, color: "#334155", lineHeight: 1.7, border: "1px solid #e2e8f0" }}>{resultado.resumen}</div>
                {(resultado.datos || []).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: GL, textTransform: "uppercase", marginBottom: 8 }}>Datos clave</div>
                    {resultado.datos.map((d, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: i < resultado.datos.length - 1 ? `1px solid ${BD}` : "none" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", marginTop: 6, flexShrink: 0 }} />
                        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{d}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setPaso("input"); setResultado(null); setTexto(""); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${BD}`, background: "#fff", color: GR, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Nueva consulta</button>
                  <button onClick={cerrar} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Listo ✓</button>
                </div>
              </div>
            )}

            {paso === "resultado" && resultado?.tipo === "whatsapp" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: TX }}>Mensaje listo para enviar</div>
                    {resultado.alumno && <div style={{ fontSize: 12, color: GL }}>Alumno/a: {resultado.alumno}</div>}
                  </div>
                </div>
                <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "12px 16px", marginBottom: 14, border: "1.5px solid #86efac" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GL, textTransform: "uppercase", marginBottom: 6 }}>Contacto resuelto</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: TX }}>{resultado.contactoNombre}</div>
                  <div style={{ fontSize: 12, color: GR, marginTop: 2 }}>{resultado.contactoRol} · {resultado.telefono}</div>
                </div>
                <div style={{ background: "#faf5ff", borderRadius: 12, padding: "14px 16px", marginBottom: 20, border: "1.5px solid #c4b5fd" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", marginBottom: 8 }}>Mensaje sugerido (podés editar)</div>
                  <textarea value={resultado.mensajeSugerido} onChange={e => setResultado(p => ({ ...p, mensajeSugerido: e.target.value }))}
                    style={{ width: "100%", border: "none", background: "transparent", fontSize: 14, fontFamily: "inherit", color: TX, resize: "vertical", minHeight: 80, outline: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setPaso("input"); setResultado(null); setTexto(""); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${BD}`, background: "#fff", color: GR, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Volver</button>
                  <button onClick={() => abrirWA(resultado.telefono, resultado.mensajeSugerido)}
                    style={{ flex: 2, padding: 12, borderRadius: 12, border: "none", background: "#25D366", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    📱 Abrir en WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
