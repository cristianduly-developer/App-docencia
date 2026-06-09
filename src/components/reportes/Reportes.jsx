import React, { useState, useEffect } from 'react';
import { G, GR, GL, BD, TX, DIAS_L } from '../../constants';
import { fmtF, leer, grabar } from '../../utils/helpers';
import { authHeaders } from '../../utils/session';
import { appState } from '../../context/AppContext';
import { Card, Btn, Fld, SecT } from '../ui';
import { DB } from '../../utils/db';

// ── PDF helpers ────────────────────────────────────────────────
const CSS_BASE = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;font-size:11pt;color:#1a202c}.pag{width:210mm;min-height:297mm;margin:0 auto;padding:18mm 20mm 20mm}@media print{@page{margin:0;size:A4}.pag{padding:18mm 20mm 20mm}}h1{font-size:16pt;font-weight:800;margin-bottom:4px}h2{font-size:13pt;font-weight:700;margin:18px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}p{line-height:1.8;margin-bottom:10px}.enc{display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:2px solid #2D6A4F;margin-bottom:22px}.enc-av{width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#2D6A4F,#40916c);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15pt;flex-shrink:0}.enc-nombre{font-size:14pt;font-weight:800}.enc-sub{font-size:9pt;color:#64748b;margin-top:2px}.firmas{margin-top:40px;padding-top:16px;border-top:1.5px solid #e2e8f0;display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.firma{text-align:center}.firma-linea{height:1px;background:#475569;margin:0 auto 6px;width:100%}.firma-nombre{font-size:9.5pt;font-weight:700}.firma-rol{font-size:9pt;color:#64748b;margin-top:2px}table{width:100%;border-collapse:collapse;margin-top:6px}th{background:#1a202c;color:#fff;padding:7px 10px;font-size:9.5pt;text-align:left;font-weight:700}td{padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:9.5pt;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}.chip{display:inline-block;background:#f1f5f9;border:1px solid #cbd5e0;border-radius:20px;padding:2px 10px;font-size:9pt;margin:2px 3px 2px 0}.label{font-size:9pt;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:4px;margin-top:14px}.val{font-size:11pt;line-height:1.7;white-space:pre-wrap}`;

const encHTML = () => {
  const nombre = appState.nombreDocente || "Docente";
  const ini = nombre.split(" ").map(w => w[0]).slice(0, 2).join("");
  return `<div class="enc"><div class="enc-av">${ini}</div><div><div class="enc-nombre">${nombre}</div><div class="enc-sub">Docente de la Modalidad Especial · Buenos Aires</div></div></div>`;
};

const firmaHTML = (roles = []) => {
  const items = roles.map(r => `<div class="firma"><div class="firma-linea"></div><div class="firma-nombre">${r.nombre || "&nbsp;"}</div><div class="firma-rol">${r.rol}</div></div>`).join("");
  return `<div class="firmas">${items}</div>`;
};

const hoyFmt = () => new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const ciclo = () => String(new Date().getFullYear());

function abrirPDF(titulo, css, body) {
  const w = window.open("", "_blank");
  if (!w) { alert("Habilitá los pop-ups para generar el PDF."); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo}</title><style>${css}</style></head><body>${body}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

// ── imprimirFicha ─────────────────────────────────────────────
function imprimirFicha(alumno, escuela, docentes) {
  const ec = escuela?.color || "#2D6A4F";
  const hoy = hoyFmt();
  const tutoresFila = (alumno.tutores || []).map(t => `<tr><td>${t.nombre}</td><td>${t.relacion}</td><td>${t.telefono}</td><td>${t.principal ? "✓" : ""}</td></tr>`).join("");
  const terapiasFila = (alumno.terapias || []).map(t => `<tr><td>${t.nombre}</td><td>${t.profesional}</td><td>${t.frecuencia}</td></tr>`).join("");
  const docsAlu = [...new Set((alumno.horarios || []).filter(h => h.docenteId).map(h => h.docenteId))].map(id => docentes.find(d => d.id === id)).filter(Boolean);
  const docsFila = docsAlu.map(d => {
    const hs = (alumno.horarios || []).filter(h => h.docenteId === d.id).map(h => `${DIAS_L[h.dia].slice(0, 3)} ${h.horaInicio}–${h.horaFin}`).join(", ");
    return `<tr><td>${d.materia}</td><td>${d.nombre}</td><td>${hs}</td><td>${d.telefono || ""}</td></tr>`;
  }).join("");
  const trajFila = [...(alumno.trayectoria || [])].reverse().map(t => `<tr><td>${t.ciclo}</td><td>${t.nivel}</td><td>${t.institucion}</td><td>${t.notas || ""}</td></tr>`).join("");
  const cssExtra = `h1{font-size:18pt;font-weight:800;color:${ec};margin-bottom:4px}th{background:${ec}}`;
  const body = `<div class="pag">${encHTML()}
<h1>${alumno.nombre}</h1>
<div style="color:#64748b;font-size:10pt;margin-bottom:18px">${alumno.curso} · ${escuela?.nombre || ""} · ${alumno.diagnostico}</div>
<h2>Datos personales</h2>
<p><strong>DNI:</strong> ${alumno.dni || "—"} &nbsp; <strong>CUIL:</strong> ${alumno.cuil || "—"} &nbsp; <strong>Nacimiento:</strong> ${alumno.fechaNacimiento ? fmtF(alumno.fechaNacimiento) : "—"}</p>
<p><strong>Dirección:</strong> ${alumno.direccion || "—"} &nbsp; <strong>Tel:</strong> ${alumno.telefonoCasa || "—"}</p>
${alumno.cud ? `<p><strong>CUD:</strong> ${alumno.cudNumero} &nbsp; vence: ${alumno.cudVencimiento ? fmtF(alumno.cudVencimiento) : "—"}</p>` : ""}
<h2>Salud</h2>
<p><strong>Diagnóstico:</strong> ${alumno.diagnostico}</p>
<p><strong>Obra Social:</strong> ${alumno.obraSocial || "—"} · N° ${alumno.nroAfiliado || "—"}</p>
${alumno.medicacion ? `<p><strong>Medicación:</strong> ${alumno.medicacion}</p>` : ""}
${(alumno.tutores || []).length > 0 ? `<h2>Familia y contactos</h2><table><thead><tr><th>Nombre</th><th>Relación</th><th>Teléfono</th><th>Principal</th></tr></thead><tbody>${tutoresFila}</tbody></table>` : ""}
${(alumno.terapias || []).length > 0 ? `<h2>Terapias actuales</h2><table><thead><tr><th>Terapia</th><th>Profesional</th><th>Frecuencia</th></tr></thead><tbody>${terapiasFila}</tbody></table>` : ""}
${docsAlu.length > 0 ? `<h2>Equipo docente</h2><table><thead><tr><th>Materia</th><th>Docente</th><th>Horarios</th><th>Teléfono</th></tr></thead><tbody>${docsFila}</tbody></table>` : ""}
${(alumno.trayectoria || []).length > 0 ? `<h2>Trayectoria escolar</h2><table><thead><tr><th>Ciclo</th><th>Nivel</th><th>Institución</th><th>Notas</th></tr></thead><tbody>${trajFila}</tbody></table>` : ""}
${firmaHTML([{ nombre: appState.nombreDocente, rol: "Docente de la Modalidad Especial" }, { nombre: "", rol: "Director/a" }, { nombre: "", rol: "Familia" }])}
</div>`;
  abrirPDF(`Ficha — ${alumno.nombre}`, CSS_BASE + cssExtra, body);
}

// ── EditorPPI ────────────────────────────────────────────────
function EditorPPI({ alumno, docentes, escuela, docs, setDoc, generando, setGenerando, regsAlu }) {
  const ec = escuela?.color || G;
  const ppi = docs.ppi || {};
  const docsAlu = [...new Set((alumno.horarios || []).filter(h => h.docenteId).map(h => h.docenteId))].map(id => docentes.find(d => d.id === id)).filter(Boolean);

  const generarSituacion = async () => {
    setGenerando("ppi_situacion");
    const hist = regsAlu.slice(0, 8).map(r => `${fmtF(r.fecha)} - ${r.materia}: ${r.avance || "(sin dato)"}`).join("\n") || "Sin registros.";
    const prompt = `Modelo social PBA 2026. Evitá: dificultad, déficit, problema. Usá: intervención, ajuste razonable, facilitador, trayectoria.\n\nAlumno/a: ${alumno.nombre} | Diagnóstico: ${alumno.diagnostico} | Curso: ${alumno.curso}\nRegistros recientes:\n${hist}\n\nEscribí UN párrafo conciso sobre la situación de aprendizaje actual del alumno/a. Solo el texto, sin títulos.`;
    try {
      const res = await fetch("/api/claude", { method: "POST", headers: authHeaders(), body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 400, messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      setDoc("ppi", "situacionActual", data.content?.[0]?.text || "");
    } catch { setDoc("ppi", "situacionActual", "[Error. Completá manualmente.]"); }
    finally { setGenerando(null); }
  };

  const exportarPDF = () => {
    const hoy = hoyFmt();
    const escuelaDat = escuela || {};
    const medEsp = docsAlu.map(d => {
      const val = ppi[`mediEsp_${d.id}`] || "";
      return val ? `<h2>Mediaciones específicas — ${d.materia} (${d.nombre})</h2><p class="val">${val.replace(/</g,"&lt;")}</p>` : "";
    }).join("");
    const firmas = [
      { nombre: appState.nombreDocente, rol: "Docente de la Modalidad Especial" },
      { nombre: escuelaDat.director || "", rol: "Director/a" },
      { nombre: "", rol: "Equipo de Orientación Escolar" },
      ...docsAlu.map(d => ({ nombre: d.nombre, rol: d.materia })),
      { nombre: "", rol: "Familia / Tutor/a" },
    ];
    const body = `<div class="pag">${encHTML()}
<h1>Proyecto Pedagógico Individual (PPI)</h1>
<p style="color:#64748b;font-size:10pt;margin-bottom:18px">${alumno.nombre} · ${alumno.curso} · ${escuelaDat.nombre || ""} · Ciclo ${ciclo()}</p>
<h2>Situación de aprendizaje actual</h2><p class="val">${(ppi.situacionActual||"").replace(/</g,"&lt;") || "(sin completar)"}</p>
<h2>Propósitos</h2><p class="val">${(ppi.propositos||"").replace(/</g,"&lt;") || "(sin completar)"}</p>
<h2>Mediaciones generales</h2><p class="val">${(ppi.mediGenerales||"").replace(/</g,"&lt;") || "(sin completar)"}</p>
${medEsp}
<h2>Objetivos de evaluación</h2><p class="val">${(ppi.objetivosEval||"").replace(/</g,"&lt;") || "(sin completar)"}</p>
<h2>Criterios de evaluación</h2><p class="val">${(ppi.criteriosEval||"").replace(/</g,"&lt;") || "(sin completar)"}</p>
${firmaHTML(firmas)}
</div>`;
    abrirPDF(`PPI — ${alumno.nombre}`, CSS_BASE, body);
  };

  const TA = ({ label, campo, minH = 90, withClaude }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase" }}>{label}</div>
        {withClaude && (
          <button onClick={generarSituacion} disabled={!!generando}
            style={{ background: ec + "18", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: ec, cursor: generando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {generando === "ppi_situacion" ? "⏳..." : "✨ Generar"}
          </button>
        )}
      </div>
      <textarea value={ppi[campo] || ""} onChange={e => setDoc("ppi", campo, e.target.value)}
        style={{ width: "100%", border: `2px solid ${ppi[campo] ? ec : BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", color: TX, background: "#f8fafc", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: minH, lineHeight: 1.6 }} />
    </div>
  );

  return (
    <div>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: TX }}>📋 PPI — Proyecto Pedagógico Individual</div>
          <Btn small color={ec} onClick={exportarPDF}>📄 PDF</Btn>
        </div>
        <TA label="Situación de aprendizaje actual" campo="situacionActual" minH={110} withClaude />
        <TA label="Propósitos" campo="propositos" minH={80} />
        <TA label="Mediaciones generales" campo="mediGenerales" minH={80} />
        {docsAlu.length > 0 && <>
          <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>Mediaciones específicas por materia</div>
          {docsAlu.map(d => (
            <div key={d.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: ec, marginBottom: 5 }}>{d.materia} — {d.nombre}</div>
              <textarea value={ppi[`mediEsp_${d.id}`] || ""} onChange={e => setDoc("ppi", `mediEsp_${d.id}`, e.target.value)}
                style={{ width: "100%", border: `2px solid ${ppi[`mediEsp_${d.id}`] ? ec : BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", color: TX, background: "#f8fafc", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 70, lineHeight: 1.6 }} />
            </div>
          ))}
        </>}
        <TA label="Objetivos de evaluación" campo="objetivosEval" minH={80} />
        <TA label="Criterios de evaluación" campo="criteriosEval" minH={80} />
      </Card>
    </div>
  );
}

// ── EditorInforme ─────────────────────────────────────────────
function EditorInforme({ tipo, alumno, escuela, docentes, docs, setDoc, generando, setGenerando, regsAlu }) {
  const ec = escuela?.color || G;
  const inf = docs[tipo] || {};
  const TITULOS = { medio: "Informe de Medio Año", final: "Informe Final Anual" };
  const titulo = TITULOS[tipo];
  const docsAlu = [...new Set((alumno.horarios || []).filter(h => h.docenteId).map(h => h.docenteId))].map(id => docentes.find(d => d.id === id)).filter(Boolean);
  const [cals, setCals] = useState(() => inf.calificaciones || {});

  const setCal = (materia, campo, val) => {
    const nv = { ...cals, [materia]: { ...(cals[materia] || {}), [campo]: val } };
    setCals(nv);
    setDoc(tipo, "calificaciones", nv);
  };

  const generar = async () => {
    const key = `${tipo}_contenido`;
    setGenerando(key);
    const hist = regsAlu.slice(0, 8).map(r => `${fmtF(r.fecha)} - ${r.materia}: ${r.avance || "(sin dato)"}`).join("\n") || "Sin registros.";
    const paradigma = "Modelo social PBA 2026. Evitá: dificultad, déficit. Usá: intervención, ajuste razonable, trayectoria.";
    const prompt = tipo === "medio"
      ? `${paradigma}\nAlumno/a: ${alumno.nombre} | Diagnóstico: ${alumno.diagnostico}\nRegistros:\n${hist}\n\nEscribí un informe narrativo de medio año organizado por materia. Un párrafo por materia. Sin títulos con #.`
      : `${paradigma}\nAlumno/a: ${alumno.nombre} | Diagnóstico: ${alumno.diagnostico}\nRegistros:\n${hist}\n\nEscribí un informe final anual narrativo con síntesis del recorrido. Sin títulos con #.`;
    try {
      const res = await fetch("/api/claude", { method: "POST", headers: authHeaders(), body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 700, messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      setDoc(tipo, "contenido", data.content?.[0]?.text || "");
    } catch { setDoc(tipo, "contenido", "[Error. Completá manualmente.]"); }
    finally { setGenerando(null); }
  };

  const exportarPDF = () => {
    const hoy = hoyFmt();
    const calFila = tipo === "final"
      ? docsAlu.map(d => {
          const c = cals[d.materia] || {};
          return `<tr><td>${d.materia}</td><td>${c.calificacion || "—"}</td><td>${c.condicion || "—"}</td><td>${c.observacion || ""}</td></tr>`;
        }).join("")
      : "";
    const tablaCalificaciones = tipo === "final" && docsAlu.length > 0
      ? `<h2>Calificaciones finales</h2><table><thead><tr><th>Materia</th><th>Calificación</th><th>Condición</th><th>Observación</th></tr></thead><tbody>${calFila}</tbody></table>`
      : "";
    const firmas = [
      { nombre: appState.nombreDocente, rol: "Docente de la Modalidad Especial" },
      { nombre: escuela?.director || "", rol: "Director/a" },
      { nombre: "", rol: "Equipo de Orientación Escolar" },
      { nombre: "", rol: "Familia / Tutor/a" },
    ];
    const body = `<div class="pag">${encHTML()}
<h1>${titulo}</h1>
<p style="color:#64748b;font-size:10pt;margin-bottom:18px">${alumno.nombre} · ${alumno.curso} · ${escuela?.nombre || ""} · Ciclo ${ciclo()}</p>
<h2>Informe narrativo</h2><p class="val">${(inf.contenido || "").replace(/</g,"&lt;") || "(sin completar)"}</p>
${tablaCalificaciones}
${firmaHTML(firmas)}
</div>`;
    abrirPDF(`${titulo} — ${alumno.nombre}`, CSS_BASE, body);
  };

  const genKey = `${tipo}_contenido`;

  return (
    <div>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: TX }}>{tipo === "medio" ? "📊" : "🏁"} {titulo}</div>
          <Btn small color={ec} onClick={exportarPDF}>📄 PDF</Btn>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase" }}>Informe narrativo</div>
          <button onClick={generar} disabled={!!generando}
            style={{ background: ec + "18", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: ec, cursor: generando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {generando === genKey ? "⏳..." : "✨ Generar con Claude"}
          </button>
        </div>
        <textarea value={inf.contenido || ""} onChange={e => setDoc(tipo, "contenido", e.target.value)}
          placeholder={`Escribí el ${titulo.toLowerCase()} o tocá "✨ Generar con Claude"...`}
          style={{ width: "100%", border: `2px solid ${inf.contenido ? ec : BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", color: TX, background: "#f8fafc", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 160, lineHeight: 1.6, marginBottom: 6 }} />
      </Card>

      {/* Calificaciones (solo Informe Final) */}
      {tipo === "final" && docsAlu.length > 0 && (
        <Card>
          <SecT text="Calificaciones finales" />
          <div style={{ fontSize: 12, color: GL, marginBottom: 12 }}>Solo visible en el Informe Final. Se imprime en el PDF.</div>
          {docsAlu.map(d => {
            const c = cals[d.materia] || {};
            return (
              <div key={d.id} style={{ padding: "10px 0", borderBottom: `1px solid ${BD}` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: TX, marginBottom: 8 }}>{d.materia}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 4 }}>Calificación</div>
                    <input value={c.calificacion || ""} onChange={e => setCal(d.materia, "calificacion", e.target.value)}
                      placeholder="Ej: 7, Aprobado, MB" style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 4 }}>Condición</div>
                    <select value={c.condicion || ""} onChange={e => setCal(d.materia, "condicion", e.target.value)}
                      style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }}>
                      <option value="">—</option>
                      <option>Promovido/a</option>
                      <option>Acreditado/a</option>
                      <option>En proceso</option>
                      <option>Pendiente</option>
                    </select>
                  </div>
                </div>
                <input value={c.observacion || ""} onChange={e => setCal(d.materia, "observacion", e.target.value)}
                  placeholder="Observación (opcional)" style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ── Vista por alumno ──────────────────────────────────────────
const POR_PAG = 30;

function VistaAlumno({ alumno, escuelas, docentes, alumnos, registros, onVerAlumno }) {
  const escuela = escuelas.find(e => e.id === alumno.escuelaId);
  const ec = escuela?.color || G;
  const [tab, setTab] = useState("historial");
  const [filMateria, setFilMateria] = useState("");
  const [filDesde, setFilDesde] = useState("");
  const [filHasta, setFilHasta] = useState("");
  const [pag, setPag] = useState(0);
  const [generando, setGenerando] = useState(null);
  const cicloAct = ciclo();
  const storageKey = `aye_docs_${alumno.id}_${cicloAct}`;
  const [docs, setDocsState] = useState(() => leer(storageKey, { ppi: {}, medio: {}, final: {} }));

  // Usar registros del prop (ya cargados) y complementar con fetch si hay más en Supabase
  const regsLocal = ((registros || {})[alumno.id] || []).filter(r => !r.eliminado).sort((a, b) => b.fecha > a.fecha ? 1 : -1);
  const [regsExtra, setRegsExtra] = useState([]);
  const regsAlu = regsExtra.length > regsLocal.length ? regsExtra : regsLocal;

  useEffect(() => {
    setRegsExtra([]);
    fetch("/api/db/registros_alumnos", { headers: authHeaders() })
      .then(r => r.json())
      .then(rows => {
        const filtrados = (rows || []).filter(r => String(r.alumnoId) === String(alumno.id) && !r.eliminado).sort((a, b) => b.fecha > a.fecha ? 1 : -1);
        if (filtrados.length > 0) setRegsExtra(filtrados);
      })
      .catch(() => {});
  }, [alumno.id]);

  const setDoc = (tipo, campo, valor) => {
    const nuevo = { ...docs, [tipo]: { ...docs[tipo], [campo]: valor } };
    setDocsState(nuevo);
    grabar(storageKey, nuevo);
    DB.save("documentos", { id: `${alumno.id}_${cicloAct}_${tipo}`, alumnoId: alumno.id, ciclo: cicloAct, tipo, contenido: nuevo[tipo], eliminado: false });
  };

  const materias = [...new Set(regsAlu.map(r => r.materia).filter(Boolean))].sort();
  const regsFil = regsAlu.filter(r => {
    if (filMateria && r.materia !== filMateria) return false;
    if (filDesde && r.fecha < filDesde) return false;
    if (filHasta && r.fecha > filHasta) return false;
    return true;
  });
  const totalPags = Math.max(1, Math.ceil(regsFil.length / POR_PAG));
  const regsPag = regsFil.slice(pag * POR_PAG, (pag + 1) * POR_PAG);

  const exportarHistorial = () => {
    const hoy = hoyFmt();
    const cssX = `table{width:100%;border-collapse:collapse;margin-top:8px}th{background:${ec};color:#fff;padding:6px 8px;font-size:9pt;text-align:left}td{padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:9pt;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}`;
    const filas = regsFil.map(r => `<tr><td style="white-space:nowrap">${fmtF(r.fecha)}</td><td>${r.materia||"—"}</td><td>${r.asistencia||"—"}</td><td>${(r.avance||"").replace(/</g,"&lt;")}</td><td style="color:#475569;font-style:italic">${(r.acuerdo||"").replace(/</g,"&lt;")}</td></tr>`).join("");
    const html = `<div class="pag">${encHTML()}<h1>Historial — ${alumno.nombre}</h1><p style="color:#64748b;font-size:10pt;margin-bottom:16px">${alumno.curso} · ${escuela?.nombre||""} · ${filMateria||"Todas las materias"}</p><table><thead><tr><th>Fecha</th><th>Materia</th><th>Asistencia</th><th>Avance / Observación</th><th>Acuerdo</th></tr></thead><tbody>${filas||`<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:16px">Sin registros</td></tr>`}</tbody></table>${firmaHTML([{nombre:appState.nombreDocente,rol:"Docente de la Modalidad Especial"},{nombre:"",rol:"Director/a"}])}</div>`;
    abrirPDF(`Historial — ${alumno.nombre}`, CSS_BASE + cssX, html);
  };

  const bcAsist = a => a === "presente" ? G : a === "ausente" ? "#dc2626" : "#f59e0b";

  const TABS = [
    { id: "historial", l: "📝 Historial" },
    { id: "ppi",       l: "📋 PPI"      },
    { id: "medio",     l: "📊 Medio año" },
    { id: "final",     l: "🏁 Final"    },
  ];

  return (
    <div>
      {/* Mini ficha */}
      <div style={{ background: `linear-gradient(135deg,${ec},${ec}99)`, borderRadius: 16, padding: "14px 16px", color: "#fff", marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 2 }}>{alumno.nombre}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)", marginBottom: 2 }}>{alumno.curso} · {escuela?.nombre}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginBottom: 12 }}>{alumno.diagnostico} · {regsAlu.length} registros</div>
        <div style={{ display: "flex", gap: 8 }}>
          {onVerAlumno && (
            <button onClick={() => onVerAlumno(alumno.id)}
              style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              👤 Ver ficha
            </button>
          )}
          <button onClick={() => imprimirFicha(alumno, escuela, docentes)}
            style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            📄 Imprimir ficha
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 14px", borderRadius: 20, border: "2px solid", whiteSpace: "nowrap", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer", borderColor: tab === t.id ? ec : BD, background: tab === t.id ? ec : "#fff", color: tab === t.id ? "#fff" : "#475569" }}>{t.l}</button>
        ))}
      </div>

      {/* Tab historial */}
      {tab === "historial" && <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 10 }}>
          <select value={filMateria} onChange={e => { setFilMateria(e.target.value); setPag(0); }} style={{ border: `1.5px solid ${BD}`, borderRadius: 10, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", background: "#fff", width: "100%", boxSizing: "border-box" }}>
            <option value="">Todas las materias</option>
            {materias.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input type="date" value={filDesde} onChange={e => { setFilDesde(e.target.value); setPag(0); }} style={{ border: `1.5px solid ${BD}`, borderRadius: 10, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box", minWidth: 0 }} />
            <input type="date" value={filHasta} onChange={e => { setFilHasta(e.target.value); setPag(0); }} style={{ border: `1.5px solid ${BD}`, borderRadius: 10, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box", minWidth: 0 }} />
          </div>
        </div>
        <button onClick={exportarHistorial} style={{ width: "100%", padding: "10px", borderRadius: 12, border: `1.5px solid ${ec}`, background: "#fff", color: ec, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>
          📄 Exportar historial PDF ({regsFil.length} registros)
        </button>
        {regsFil.length === 0
          ? <Card sx={{ textAlign: "center", padding: 32 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📝</div><div style={{ color: GR }}>Sin registros{filMateria ? ` en ${filMateria}` : ""}</div></Card>
          : <>
            {regsPag.map((r, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BD}`, borderLeft: `3px solid ${bcAsist(r.asistencia)}`, borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{r.materia}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: bcAsist(r.asistencia) + "20", color: bcAsist(r.asistencia), borderRadius: 20, padding: "2px 8px" }}>{r.asistencia}</span>
                    <span style={{ fontSize: 11, color: GL }}>{fmtF(r.fecha)}</span>
                  </div>
                </div>
                {r.docente && <div style={{ fontSize: 11, color: GR, marginBottom: 4 }}>{r.docente}</div>}
                {r.avance && <div style={{ fontSize: 12, color: "#475569" }}>{r.avance}</div>}
                {r.acuerdo && <div style={{ fontSize: 12, color: "#1d4ed8", marginTop: 4 }}>🤝 {r.acuerdo}</div>}
                {r.recordatorio && <div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>⏰ {r.recordatorio}</div>}
              </div>
            ))}
            {totalPags > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 12 }}>
                <button onClick={() => setPag(p => Math.max(0, p - 1))} disabled={pag === 0} style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${BD}`, background: "#fff", fontFamily: "inherit", fontWeight: 700, cursor: pag === 0 ? "not-allowed" : "pointer", color: pag === 0 ? GL : TX }}>← Ant</button>
                <span style={{ fontSize: 13, color: GR, fontWeight: 600 }}>Pág {pag + 1} / {totalPags}</span>
                <button onClick={() => setPag(p => Math.min(totalPags - 1, p + 1))} disabled={pag === totalPags - 1} style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${BD}`, background: "#fff", fontFamily: "inherit", fontWeight: 700, cursor: pag === totalPags - 1 ? "not-allowed" : "pointer", color: pag === totalPags - 1 ? GL : TX }}>Sig →</button>
              </div>
            )}
          </>}
      </div>}

      {tab === "ppi" && <EditorPPI alumno={alumno} docentes={docentes} escuela={escuela} docs={docs} setDoc={setDoc} generando={generando} setGenerando={setGenerando} regsAlu={regsAlu} />}
      {(tab === "medio" || tab === "final") && <EditorInforme tipo={tab} alumno={alumno} escuela={escuela} docentes={docentes} docs={docs} setDoc={setDoc} generando={generando} setGenerando={setGenerando} regsAlu={regsAlu} />}
    </div>
  );
}

// ── Vista Por Fecha ───────────────────────────────────────────
function VistaFecha({ alumnos, escuelas, docentes }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [regsHoy, setRegsHoy] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!fecha) return;
    setCargando(true);
    fetch("/api/db/registros_alumnos", { headers: authHeaders() })
      .then(r => r.json())
      .then(rows => setRegsHoy((rows || []).filter(r => r.fecha === fecha && !r.eliminado)))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [fecha]);

  return (
    <div>
      <Card>
        <SecT text="Registros por fecha" />
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
      </Card>
      {cargando && <div style={{ textAlign: "center", padding: 32, color: GR }}>Cargando...</div>}
      {!cargando && regsHoy.length === 0 && fecha && <Card sx={{ textAlign: "center", padding: 32 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📅</div><div style={{ color: GR }}>Sin registros para el {fmtF(fecha)}</div></Card>}
      {regsHoy.map((r, i) => {
        const alu = alumnos.find(a => String(a.id) === String(r.alumnoId));
        const esc = alu ? escuelas.find(e => e.id === alu.escuelaId) : null;
        const bc = r.asistencia === "presente" ? G : r.asistencia === "ausente" ? "#dc2626" : "#f59e0b";
        return (
          <div key={i} style={{ background: "#fff", border: `1px solid ${BD}`, borderLeft: `3px solid ${bc}`, borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{alu?.nombre || "Alumno eliminado"}</div>
              <span style={{ fontSize: 10, fontWeight: 700, background: bc + "20", color: bc, borderRadius: 20, padding: "2px 8px" }}>{r.asistencia}</span>
            </div>
            <div style={{ fontSize: 12, color: GR }}>{r.materia}{esc ? ` · ${esc.nombre}` : ""}</div>
            {r.avance && <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{r.avance}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Vista Por Escuela ─────────────────────────────────────────
function VistaEscuela({ alumnos, escuelas, docentes }) {
  const [escId, setEscId] = useState("");
  const esc = escuelas.find(e => e.id === escId);
  const ec = esc?.color || G;
  const alusEsc = alumnos.filter(a => a.escuelaId === escId && !a.eliminado);
  return (
    <div>
      <select value={escId} onChange={e => setEscId(e.target.value)} style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 12, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", background: "#fff", color: escId ? TX : GL, boxSizing: "border-box", marginBottom: 16 }}>
        <option value="">Seleccioná una escuela...</option>
        {escuelas.filter(e => !e.eliminado).map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>
      {!escId && <Card sx={{ textAlign: "center", padding: 32 }}><div style={{ fontSize: 32, marginBottom: 8 }}>🏫</div><div style={{ color: GR }}>Elegí una institución para ver sus alumnos</div></Card>}
      {escId && <>
        {esc && <div style={{ background: `linear-gradient(135deg,${ec},${ec}88)`, borderRadius: 14, padding: "12px 16px", color: "#fff", marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{esc.nombre}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)", marginTop: 2 }}>{alusEsc.length} alumnos activos · {esc.nivel || ""}</div>
        </div>}
        {alusEsc.length === 0
          ? <Card sx={{ textAlign: "center", padding: 32 }}><div style={{ fontSize: 32, marginBottom: 8 }}>👤</div><div style={{ color: GR }}>Sin alumnos en esta institución</div></Card>
          : alusEsc.map(a => (
            <Card key={a.id} sx={{ borderLeft: `4px solid ${ec}` }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: TX }}>{a.nombre}</div>
              <div style={{ fontSize: 12, color: GR, marginTop: 2 }}>{a.curso} · {a.diagnostico}</div>
            </Card>
          ))}
      </>}
    </div>
  );
}

// ── Reportes principal ────────────────────────────────────────
export default function Reportes({ alumnos, docentes, pros, escuelas, registros, recs, onVerAlumno }) {
  const [aluId, setAluId] = useState("");
  const alumno = aluId ? alumnos.find(a => String(a.id) === String(aluId) && !a.eliminado) : null;

  return (
    <div style={{ paddingBottom: 80, overflowX: "hidden" }}>
      <div style={{ background: "linear-gradient(135deg,#1a202c,#2d3748)", padding: "16px 20px", color: "#fff" }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>📊 Reportes</div>
      </div>

      <div style={{ padding: 16 }}>
        <select value={aluId} onChange={e => setAluId(e.target.value)} style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 12, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", background: "#fff", color: aluId ? TX : GL, boxSizing: "border-box", marginBottom: 16 }}>
          <option value="">Seleccionar estudiante...</option>
          {alumnos.filter(a => !a.eliminado && a.nombre).map(a => {
            const e = escuelas.find(x => x.id === a.escuelaId);
            return <option key={a.id} value={String(a.id)}>{a.nombre}{e ? ` — ${e.nombre}` : ""}</option>;
          })}
        </select>
        {!alumno
          ? <Card sx={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 40, marginBottom: 12 }}>📊</div><div style={{ fontWeight: 700, fontSize: 16, color: TX, marginBottom: 6 }}>Seleccioná un alumno</div><div style={{ fontSize: 13, color: GR }}>Para ver el historial de registros y generar informes pedagógicos.</div></Card>
          : <VistaAlumno alumno={alumno} escuelas={escuelas} docentes={docentes} alumnos={alumnos} registros={registros} onVerAlumno={id => onVerAlumno(id)} />}
      </div>
    </div>
  );
}
