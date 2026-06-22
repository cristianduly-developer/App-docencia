import React, { useState } from 'react';
import { appState } from '../../context/AppContext';
import { G, GD, GR, GL, BD, TX } from '../../constants';
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

// ── Helpers para el PDF visual ────────────────────────────────────
function fraccionHTML(frac, color) {
  const m = frac.match(/(\d+)\/(\d+)/);
  if (!m) return "";
  const num = parseInt(m[1]), den = parseInt(m[2]);
  if (den < 2 || den > 16 || num < 1) return "";
  const partes = Array.from({ length: den }, (_, i) =>
    `<div style="flex:1;min-width:16px;max-width:48px;height:32px;border:2px solid ${i < num ? color : "#cbd5e0"};border-radius:5px;background:${i < num ? color : "#f8fafc"}"></div>`
  ).join("");
  return `<div style="display:flex;align-items:center;gap:14px;background:#f8fafc;border-radius:10px;padding:12px 16px;margin-bottom:14px;flex-wrap:wrap">
    <div style="font-size:18px;font-weight:800;color:${color}">${frac}</div>
    <div style="display:flex;gap:4px">${partes}</div>
    <div style="font-size:13px;color:#475569">${num} parte${num > 1 ? "s" : ""} de ${den}</div>
  </div>`;
}

function parsearActividad(texto, color) {
  const tieneEjercicios = /EJERCICIO\s+\d+:/i.test(texto);
  // Detectar marcadores aunque vengan con espacios, guiones o markdown bold
  const textoLimpio = texto.replace(/\*\*/g, '').replace(/^[-–•]\s*/gm, '');
  const tieneMarcadores = /(TABLA|CONCEPTO|PASOS|COMPLETAR|PREGUNTA|VF|UNIR|VISUAL)\s*:/i.test(textoLimpio);
  if (!tieneEjercicios && !tieneMarcadores) return renderSimpleActividad(texto, color);
  if (!tieneEjercicios && tieneMarcadores) {
    return parsearActividad(`EJERCICIO 1: 📝 Actividad\n${textoLimpio}`, color);
  }

  const bloques = texto.split(/(?=^EJERCICIO\s+\d+:)/im).filter(b => b.trim());
  const coloresSec = [color, "#1D4ED8", "#B45309", "#6D28D9", "#0F766E"];

  return bloques.map((bloque, idx) => {
    const lineas = bloque.trim().split("\n").map(l => l.trim().replace(/\*\*/g, '').replace(/^[-–•]\s*/, '')).filter(Boolean);
    const colorSec = coloresSec[idx % coloresSec.length];
    const headerMatch = lineas[0].match(/^EJERCICIO\s+\d+:\s*(.*)/i);
    const EMOJIS_EJ = ['🔢', '✏️', '🧩', '💡', '⭐', '🎯'];
    const tituloRaw = headerMatch ? headerMatch[1] : lineas[0];
    const tieneEmoji = /\p{Emoji}/u.test(tituloRaw.charAt(0));
    const titulo = tieneEmoji ? tituloRaw : `${EMOJIS_EJ[idx % EMOJIS_EJ.length]} ${tituloRaw}`;

    let contenido = "";
    let i = 1;
    while (i < lineas.length) {
      const l = lineas[i];

      if (/^CONCEPTO:/i.test(l)) {
        const txt = l.replace(/^CONCEPTO:\s*/i, "");
        contenido += `<div style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:14px;line-height:1.6">💡 <strong>Para recordar:</strong> ${txt}</div>`;
        i++; continue;
      }

      if (/^VISUAL:/i.test(l)) {
        contenido += fraccionHTML(l.replace(/^VISUAL:\s*/i, "").trim(), colorSec);
        i++; continue;
      }

      if (/^PASOS:/i.test(l)) {
        contenido += `<div style="margin-bottom:14px">`;
        i++;
        while (i < lineas.length && /^\d+[.)]\s/.test(lineas[i])) {
          const num = lineas[i].match(/^(\d+)/)[1];
          const paso = lineas[i].replace(/^\d+[.)]\s*/, "");
          contenido += `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">
            <div style="width:26px;height:26px;border-radius:50%;background:${colorSec};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;flex-shrink:0;margin-top:1px">${num}</div>
            <div style="font-size:15px;line-height:1.65;padding-top:3px">${paso}</div>
          </div>`;
          i++;
        }
        contenido += `</div>`;
        continue;
      }

      if (/^TABLA:/i.test(l)) {
        contenido += `<div style="overflow-x:auto;margin-bottom:16px"><table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">`;
        i++;
        let firstRow = true;
        while (i < lineas.length && lineas[i].includes("|")) {
          const celdas = lineas[i].split("|").map(c => c.trim());
          if (firstRow) {
            contenido += `<thead><tr>${celdas.map(c =>
              `<th style="background:${colorSec};color:#fff;padding:10px 14px;font-size:13px;font-weight:700;text-align:left">${c}</th>`
            ).join("")}</tr></thead><tbody>`;
            firstRow = false;
          } else {
            contenido += `<tr>${celdas.map(c =>
              c === "?" || c === ""
                ? `<td style="padding:14px;border-bottom:1px solid #e2e8f0;min-width:80px"><div style="border-bottom:2px solid #94a3b8;height:28px"></div></td>`
                : `<td style="padding:12px 14px;font-size:14px;font-weight:600;border-bottom:1px solid #e2e8f0">${c}</td>`
            ).join("")}</tr>`;
          }
          i++;
        }
        if (!firstRow) contenido += `</tbody>`;
        contenido += `</table></div>`;
        continue;
      }

      // COMPLETAR: oración con ___ para completar
      if (/^COMPLETAR:/i.test(l)) {
        const oracion = l.replace(/^COMPLETAR:\s*/i, "");
        const renderizada = oracion.replace(/_{3,}/g, `<span style="display:inline-block;min-width:80px;border-bottom:2px solid #94a3b8;margin:0 4px">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`);
        contenido += `<div style="background:#f0f9ff;border-left:4px solid ${colorSec};padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:12px;font-size:15px;line-height:2">${renderizada}</div>`;
        i++; continue;
      }

      // PREGUNTA: pregunta abierta con espacio de respuesta
      if (/^PREGUNTA:/i.test(l)) {
        const preg = l.replace(/^PREGUNTA:\s*/i, "");
        contenido += `<div style="margin-bottom:16px">
          <div style="font-size:15px;font-weight:600;margin-bottom:8px;color:#1a202c">❓ ${preg}</div>
          <div style="border-bottom:2px solid #94a3b8;height:30px;margin-bottom:6px"></div>
          <div style="border-bottom:1.5px solid #e2e8f0;height:28px"></div>
        </div>`;
        i++; continue;
      }

      // UNIR: lista de ítems para unir (separados por — o →)
      if (/^UNIR:/i.test(l)) {
        const items = l.replace(/^UNIR:\s*/i, "").split(",").map(s => s.trim()).filter(Boolean);
        const mitad = Math.ceil(items.length / 2);
        const izq = items.slice(0, mitad);
        const der = items.slice(mitad);
        const filas = izq.map((it, k) => `<tr>
          <td style="padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:14px;font-weight:600;background:#f8fafc">${it}</td>
          <td style="padding:8px 16px;font-size:18px;color:#94a3b8;text-align:center">·····</td>
          <td style="padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:14px;font-weight:600;background:#f8fafc">${der[k] || ""}</td>
        </tr>`).join("");
        contenido += `<div style="margin-bottom:16px"><div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Uní con una línea</div><table style="border-spacing:0 6px">${filas}</table></div>`;
        i++; continue;
      }

      // VF: verdadero o falso
      if (/^VF:/i.test(l)) {
        const afirmacion = l.replace(/^VF:\s*/i, "");
        contenido += `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;background:#f8fafc;border-radius:8px;padding:10px 14px">
          <div style="font-size:14px;flex:1;line-height:1.5">${afirmacion}</div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <div style="border:1.5px solid #86efac;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;color:#166534">V</div>
            <div style="border:1.5px solid #fca5a5;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;color:#991b1b">F</div>
          </div>
        </div>`;
        i++; continue;
      }

      if (/_{3,}/.test(l)) {
        contenido += `<div style="border-bottom:2px solid #94a3b8;margin:8px 0 22px;height:30px"></div>`;
        i++; continue;
      }

      contenido += `<p style="margin-bottom:10px;font-size:14px;line-height:1.7">${l}</p>`;
      i++;
    }

    return `<div style="border:2px solid ${colorSec};border-radius:12px;margin-bottom:24px;overflow:hidden;page-break-inside:avoid">
      <div style="background:${colorSec};color:#fff;padding:12px 18px;display:flex;align-items:center;gap:12px">
        <div style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:17px;flex-shrink:0">${idx + 1}</div>
        <div style="font-size:16px;font-weight:800">${titulo}</div>
      </div>
      <div style="padding:16px 18px">${contenido}</div>
    </div>`;
  }).join("");
}

function renderSimpleActividad(texto, color) {
  return texto.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
    if (/^[\d]+[.)]\s/.test(l))
      return `<div style="background:${color}0d;border-left:4px solid ${color};padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:12px;font-size:16px;font-weight:600;line-height:1.6">${l}</div>`;
    if (/_{3,}/.test(l))
      return `<div style="border-bottom:2px solid #94a3b8;margin:8px 0 22px;height:30px"></div>`;
    return `<p style="margin-bottom:10px;font-size:14px;line-height:1.7">${l}</p>`;
  }).join("");
}

// ── AdaptarTarea inline ───────────────────────────────────────────
function AdaptarTarea({ alumno, materia, docente, ec, registros = [], onCancel }) {
  const [paso, setPaso] = useState("foto");
  const [desc, setDesc] = useState("");
  const [resultado, setResultado] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const fileRef = React.useRef(null);

  const edad = alumno.fechaNacimiento
    ? Math.floor((Date.now() - new Date(alumno.fechaNacimiento)) / 31557600000) + " años"
    : null;
  const curso = [alumno.anio, alumno.division].filter(Boolean).join(" ") || alumno.curso || null;
  const terapiasStr = (alumno.terapias || []).filter(t => t.nombre)
    .map(t => `${t.nombre} — ${t.profesional || "-"} (${t.frecuencia || "-"})`).join("; ");
  const regsCtx = registros
    .filter(r => !r.eliminado)
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))
    .slice(0, 8)
    .map(r => `[${r.fecha || ""}${r.materia ? ` · ${r.materia}` : ""}] ${r.avance || ""}${r.acuerdo ? ` / Acuerdo: ${r.acuerdo}` : ""}`)
    .filter(s => s.trim().length > 10)
    .join("\n");

  const analizar = async () => {
    if (!desc.trim() && !imageBase64) return;
    setPaso("analizando");
    try {
      const msgs = [];
      if (imageBase64) {
        msgs.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } });
      }
      msgs.push({ type: "text", text: `Sos una AP (Docente de Inclusión) con experiencia en adaptaciones curriculares de Modalidad Especial bonaerense. Tu trabajo es crear adaptaciones REALMENTE individualizadas, no versiones genéricas simplificadas.

═══ PERFIL DEL ALUMNO ═══
Nombre: ${alumno.nombre}${edad ? ` | ${edad}` : ""}${curso ? ` | ${curso}` : ""}
Diagnóstico: ${alumno.diagnostico || "-"}
Terapias: ${terapiasStr || "-"}${regsCtx ? `\n\nRegistros de clase recientes:\n${regsCtx}` : ""}

═══ TAREA A ADAPTAR ═══
Materia: ${materia || "-"}${desc ? `\nIndicación de la AP: ${desc}` : ""}
(ver imagen adjunta)

═══ CÓMO TRABAJAR ═══
Antes de escribir, analizá:
1. ¿Qué implica el diagnóstico para ESTA tarea concreta? (carga cognitiva, atención sostenida, procesamiento, lenguaje)
2. ¿Qué dicen los registros? ¿Qué funciona y qué no para este chico/a?
3. ¿Qué aportan las terapias? (fonoaudiología → apoyos en lenguaje escrito/oral; psicomotricidad → actividades con motor fino; psicología → regulación emocional)
4. ¿Cuántos ejercicios puede resolver en una clase sin saturarse?

Con eso en mente, escribí la adaptación. IMPORTANTE: usá EXACTAMENTE este formato, respetando cada etiqueta en mayúscula al inicio de la línea:

EJERCICIO 1: 🔢 [título corto en lenguaje simple]
CONCEPTO: [idea clave en una oración, hablándole de vos]
VISUAL: [solo si hay fracciones — escribí la fracción, ej: 1/4]
PASOS:
1. [paso concreto]
2. [paso concreto]
TABLA:
[Col 1] | [Col 2] | [Col 3]
[dato] | ? | [dato]
COMPLETAR: [Oración con ___ donde escribe el alumno]
PREGUNTA: [pregunta abierta con espacio de respuesta]
VF: [afirmación — marca V o F]
UNIR: [término 1, término 2, término 3, definición 1, definición 2, definición 3]

EJERCICIO 2: ✏️ [título corto]
[continuar con los marcadores que correspondan]

Reglas OBLIGATORIAS — si no las seguís, la app no puede mostrar el resultado:
- Cada ejercicio DEBE empezar con "EJERCICIO N: emoji título" en su propia línea
- Usá solo los marcadores de arriba (CONCEPTO, PASOS, TABLA, COMPLETAR, PREGUNTA, VF, UNIR)
- En TABLA: primera fila son los encabezados, luego una fila por dato, celdas separadas por |, poné ? donde el alumno completa
- En UNIR: primero todos los ítems izquierda, luego todos los de derecha, separados por coma
- Sin asteriscos, sin #, sin guiones antes de los marcadores, sin texto libre fuera de los bloques` });

      const res = await fetch("/api/claude", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ max_tokens: 1800, messages: [{ role: "user", content: msgs }] })
      });
      const data = await res.json();
      setResultado(data.content?.[0]?.text || "No se pudo adaptar la tarea.");
      setPaso("resultado");
    } catch {
      setResultado("Error al conectar con Claude. Intentá de nuevo.");
      setPaso("resultado");
    }
  };

  const exportarPDF = () => {
    const fechaStr = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
    const colorEsc = ec || G;
    const contenidoHTML = parsearActividad(resultado, colorEsc);
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a202c;font-size:15px;line-height:1.75}
      .page{max-width:740px;margin:0 auto}
      .banner{background:${colorEsc};padding:22px 36px 16px;color:#fff}
      .banner-eyebrow{font-size:10px;letter-spacing:2px;text-transform:uppercase;opacity:.7;margin-bottom:5px}
      .banner-titulo{font-size:22px;font-weight:900;margin-bottom:2px}
      .banner-sub{font-size:12px;opacity:.75}
      .body{padding:22px 36px 16px}
      .ficha{display:flex;margin-bottom:18px;border-radius:10px;overflow:hidden;border:1.5px solid #e2e8f0}
      .ficha-left{background:${colorEsc}12;padding:12px 16px;flex:1}
      .ficha-right{background:#f8fafc;padding:12px 16px;flex:1;border-left:1.5px solid #e2e8f0}
      .ficha-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:2px}
      .ficha-val{font-size:13px;font-weight:700;color:#1a202c;margin-bottom:7px}
      .ficha-val:last-child{margin-bottom:0}
      .divider{height:3px;background:linear-gradient(90deg,${colorEsc},${colorEsc}22,transparent);margin-bottom:18px;border-radius:2px}
      .firma{margin-top:36px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between}
      .firma-bloque{text-align:center}
      .firma-linea{width:150px;border-bottom:1.5px solid #94a3b8;margin:0 auto 5px}
      .firma-nombre{font-size:11px;font-weight:700;color:#1a202c}
      .firma-rol{font-size:10px;color:#718096}
      .footer{margin-top:16px;text-align:center;font-size:10px;color:#cbd5e0;padding-bottom:14px}
      @media print{@page{margin:1.2cm}body{font-size:14px}}
    </style></head><body><div class="page">
      <div class="banner">
        <div class="banner-eyebrow">Ajuste Razonable · Modalidad Especial DGCyE</div>
        <div class="banner-titulo">${materia || "Actividad adaptada"}</div>
        <div class="banner-sub">${fechaStr}</div>
      </div>
      <div class="body">
        <div class="ficha">
          <div class="ficha-left">
            <div class="ficha-label">Alumno/a</div>
            <div class="ficha-val">${alumno.nombre}</div>
            ${edad ? `<div class="ficha-label">Edad</div><div class="ficha-val">${edad}</div>` : ""}
            ${curso ? `<div class="ficha-label">Curso</div><div class="ficha-val">${curso}</div>` : ""}
          </div>
          <div class="ficha-right">
            <div class="ficha-label">Materia</div>
            <div class="ficha-val">${materia || "-"}</div>
            <div class="ficha-label">Docente de grado</div>
            <div class="ficha-val">${docente?.nombre || "-"}</div>
          </div>
        </div>
        <div class="divider"></div>
        ${contenidoHTML}
        <div class="firma">
          <div class="firma-bloque">
            <div class="firma-linea"></div>
            <div class="firma-nombre">${appState.nombreDocente || "Docente de Inclusión"}</div>
            <div class="firma-rol">AP · Modalidad Especial</div>
          </div>
          <div class="firma-bloque">
            <div class="firma-linea"></div>
            <div class="firma-nombre">Docente de Grado</div>
            <div class="firma-rol">${materia || ""}</div>
          </div>
          <div class="firma-bloque">
            <div class="firma-linea"></div>
            <div class="firma-nombre">Director/a</div>
            <div class="firma-rol">Sello institucional</div>
          </div>
        </div>
        <div class="footer">Res. 1664/17 · DGCyE · Generado con apoyo de IA y revisado por la AP</div>
      </div>
    </div></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const enviarWA = () => {
    const fechaStr = new Date().toLocaleDateString("es-AR");
    const texto = `*Adaptación de tarea — ${materia || "Clase"}*\n*Alumno/a:* ${alumno.nombre}${curso ? ` | ${curso}` : ""}\n*Fecha:* ${fechaStr}\n\n${resultado}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const MAX = 1024;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      setImageBase64(canvas.toDataURL("image/jpeg", 0.75).split(",")[1]);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (paso === "analizando") return (
    <Card sx={{ border: `2px solid ${ec}`, textAlign: "center", padding: 32 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Adaptando la tarea...</div>
      <div style={{ fontSize: 13, color: GR }}>Claude está analizando y adaptando para {alumno.nombre}.</div>
    </Card>
  );

  if (paso === "resultado") return (
    <Card sx={{ border: `2px solid ${ec}`, marginBottom: 8 }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Adaptación lista</div>
      <div style={{ fontSize: 12, color: GR, marginBottom: 12 }}>{alumno.nombre}{curso ? ` · ${curso}` : ""} · {materia}</div>
      <div
        style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 16, border: "1px solid #e2e8f0", maxHeight: 480, overflowY: "auto" }}
        dangerouslySetInnerHTML={{ __html: parsearActividad(resultado, ec) }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={exportarPDF} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: ec, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          📄 Exportar PDF
        </button>
        <button onClick={enviarWA} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: "#25D366", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          📱 Enviar por WhatsApp
        </button>
        <Btn outline onClick={onCancel} color={GR}>Cerrar</Btn>
      </div>
    </Card>
  );

  return (
    <Card sx={{ border: `2px solid ${ec}`, marginBottom: 8 }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>📸 Adaptar tarea con IA</div>
      <div style={{ fontSize: 12, color: GR, marginBottom: 16, lineHeight: 1.5 }}>
        Subí la foto de la tarea del aula. Claude la va a adaptar para <strong>{alumno.nombre}</strong>{curso ? ` (${curso})` : ""} según su diagnóstico.
      </div>

      <div style={{ marginBottom: 14 }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: 16, borderRadius: 12, border: `2px dashed ${imageBase64 ? ec : BD}`, background: imageBase64 ? ec + "10" : "#f8fafc", color: imageBase64 ? ec : GR, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          {imageBase64 ? "✓ Imagen seleccionada — tocar para cambiar" : "📷 Sacar foto o elegir de galería"}
        </button>
      </div>

      <Fld label="Indicación para la IA (opcional)" value={desc} onChange={setDesc} multiline placeholder="Ej: que sea solo oral, que reduzca a 2 ejercicios, que simplifique las tablas..." />

      <div style={{ display: "flex", gap: 10 }}>
        <Btn outline onClick={onCancel} color={GR}>Cancelar</Btn>
        <Btn onClick={analizar} color={ec} full disabled={!imageBase64 && !desc.trim()}>✨ Adaptar</Btn>
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
      <div style={{ background: `linear-gradient(135deg,${GD},${GD}ee)`, borderRadius: 20, padding: 20, color: "#fff", marginBottom: 16 }}>
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

      {modo === "adaptar" && <AdaptarTarea alumno={alumno} materia={ev.materia} docente={doc} ec={ec} registros={registros[alumno.id] || []} onCancel={() => setModo(null)} />}
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
