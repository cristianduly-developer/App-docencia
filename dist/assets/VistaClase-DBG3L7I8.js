import{r as z,G as E,j as e,a as W,A as U,C as S,S as N,b as j,W as q,B as F,T as B,c as D,R as V,d as R,F as L,e as G,f as _,g as H,h as J,u as Q}from"./index-sdZt596c.js";import{F as X}from"./FormReg-BpLSV9qA.js";function Y({ec:i,ctx:o,alumnoId:p,onSave:d,onCancel:h}){const[x,v]=z.useState(""),[l,g]=z.useState("media"),y={alta:"#dc2626",media:"#f59e0b",baja:E},m=()=>{x.trim()&&d({id:"rc"+Q(),alumnoId:p||"",texto:o?`[${o}] ${x}`:x,fecha:J(),prioridad:l,eliminado:!1})};return e.jsxs(S,{sx:{border:`2px solid ${i}`,marginBottom:8},children:[e.jsx("div",{style:{fontWeight:800,fontSize:15,marginBottom:4},children:"Anotar algo"}),e.jsxs("div",{style:{fontSize:12,color:D,marginBottom:14},children:["📍 Contexto: ",e.jsx("strong",{children:o||"general"}),e.jsx("div",{style:{fontSize:11,color:D,marginTop:2},children:"Va a aparecer en ⏰ Avisos con este contexto."})]}),e.jsx(L,{label:"¿Qué querés recordar?",value:x,onChange:v,multiline:!0,placeholder:"Acordar con la docente... / Hablar con los padres... / Traer material..."}),e.jsxs("div",{style:{marginBottom:14},children:[e.jsx("div",{style:{fontSize:12,fontWeight:700,color:j,textTransform:"uppercase",marginBottom:8},children:"Prioridad"}),e.jsx("div",{style:{display:"flex",gap:8},children:["alta","media","baja"].map(a=>e.jsx("button",{onClick:()=>g(a),style:{flex:1,padding:8,borderRadius:8,border:"2px solid",borderColor:l===a?y[a]:F,background:l===a?y[a]:"#fff",color:l===a?"#fff":"#475569",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"},children:a},a))})]}),e.jsxs("div",{style:{display:"flex",gap:10},children:[e.jsx(R,{outline:!0,onClick:h,color:j,children:"Cancelar"}),e.jsx(R,{onClick:m,color:i,full:!0,disabled:!x.trim(),children:"Guardar en Avisos"})]})]})}function K(i,o){const p=i.match(/(\d+)\/(\d+)/);if(!p)return"";const d=parseInt(p[1]),h=parseInt(p[2]);if(h<2||h>16||d<1)return"";const x=Array.from({length:h},(v,l)=>`<div style="flex:1;min-width:16px;max-width:48px;height:32px;border:2px solid ${l<d?o:"#cbd5e0"};border-radius:5px;background:${l<d?o:"#f8fafc"}"></div>`).join("");return`<div style="display:flex;align-items:center;gap:14px;background:#f8fafc;border-radius:10px;padding:12px 16px;margin-bottom:14px;flex-wrap:wrap">
    <div style="font-size:18px;font-weight:800;color:${o}">${i}</div>
    <div style="display:flex;gap:4px">${x}</div>
    <div style="font-size:13px;color:#475569">${d} parte${d>1?"s":""} de ${h}</div>
  </div>`}function Z(i,o){if(!/^EJERCICIO\s+\d+:/im.test(i))return ee(i,o);const d=i.split(/(?=^EJERCICIO\s+\d+:)/im).filter(x=>x.trim()),h=[o,"#1D4ED8","#B45309","#6D28D9","#0F766E"];return d.map((x,v)=>{const l=x.trim().split(`
`).map(n=>n.trim()).filter(Boolean),g=h[v%h.length],y=l[0].match(/^EJERCICIO\s+\d+:\s*(.*)/i),m=y?y[1]:l[0];let a="",t=1;for(;t<l.length;){const n=l[t];if(/^CONCEPTO:/i.test(n)){const c=n.replace(/^CONCEPTO:\s*/i,"");a+=`<div style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:14px;line-height:1.6">💡 <strong>Para recordar:</strong> ${c}</div>`,t++;continue}if(/^VISUAL:/i.test(n)){a+=K(n.replace(/^VISUAL:\s*/i,"").trim(),g),t++;continue}if(/^PASOS:/i.test(n)){for(a+='<div style="margin-bottom:14px">',t++;t<l.length&&/^\d+[.)]\s/.test(l[t]);){const c=l[t].match(/^(\d+)/)[1],s=l[t].replace(/^\d+[.)]\s*/,"");a+=`<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">
            <div style="width:26px;height:26px;border-radius:50%;background:${g};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;flex-shrink:0;margin-top:1px">${c}</div>
            <div style="font-size:15px;line-height:1.65;padding-top:3px">${s}</div>
          </div>`,t++}a+="</div>";continue}if(/^TABLA:/i.test(n)){a+='<div style="overflow-x:auto;margin-bottom:16px"><table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">',t++;let c=!0;for(;t<l.length&&l[t].includes("|");){const s=l[t].split("|").map(f=>f.trim());c?(a+=`<thead><tr>${s.map(f=>`<th style="background:${g};color:#fff;padding:10px 14px;font-size:13px;font-weight:700;text-align:left">${f}</th>`).join("")}</tr></thead><tbody>`,c=!1):a+=`<tr>${s.map(f=>f==="?"||f===""?'<td style="padding:14px;border-bottom:1px solid #e2e8f0;min-width:80px"><div style="border-bottom:2px solid #94a3b8;height:28px"></div></td>':`<td style="padding:12px 14px;font-size:14px;font-weight:600;border-bottom:1px solid #e2e8f0">${f}</td>`).join("")}</tr>`,t++}c||(a+="</tbody>"),a+="</table></div>";continue}if(/^COMPLETAR:/i.test(n)){const s=n.replace(/^COMPLETAR:\s*/i,"").replace(/_{3,}/g,'<span style="display:inline-block;min-width:80px;border-bottom:2px solid #94a3b8;margin:0 4px">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>');a+=`<div style="background:#f0f9ff;border-left:4px solid ${g};padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:12px;font-size:15px;line-height:2">${s}</div>`,t++;continue}if(/^PREGUNTA:/i.test(n)){const c=n.replace(/^PREGUNTA:\s*/i,"");a+=`<div style="margin-bottom:16px">
          <div style="font-size:15px;font-weight:600;margin-bottom:8px;color:#1a202c">❓ ${c}</div>
          <div style="border-bottom:2px solid #94a3b8;height:30px;margin-bottom:6px"></div>
          <div style="border-bottom:1.5px solid #e2e8f0;height:28px"></div>
        </div>`,t++;continue}if(/^UNIR:/i.test(n)){const c=n.replace(/^UNIR:\s*/i,"").split(",").map(A=>A.trim()).filter(Boolean),s=Math.ceil(c.length/2),f=c.slice(0,s),I=c.slice(s),k=f.map((A,T)=>`<tr>
          <td style="padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:14px;font-weight:600;background:#f8fafc">${A}</td>
          <td style="padding:8px 16px;font-size:18px;color:#94a3b8;text-align:center">·····</td>
          <td style="padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:14px;font-weight:600;background:#f8fafc">${I[T]||""}</td>
        </tr>`).join("");a+=`<div style="margin-bottom:16px"><div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Uní con una línea</div><table style="border-spacing:0 6px">${k}</table></div>`,t++;continue}if(/^VF:/i.test(n)){const c=n.replace(/^VF:\s*/i,"");a+=`<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;background:#f8fafc;border-radius:8px;padding:10px 14px">
          <div style="font-size:14px;flex:1;line-height:1.5">${c}</div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <div style="border:1.5px solid #86efac;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;color:#166534">V</div>
            <div style="border:1.5px solid #fca5a5;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;color:#991b1b">F</div>
          </div>
        </div>`,t++;continue}if(/_{3,}/.test(n)){a+='<div style="border-bottom:2px solid #94a3b8;margin:8px 0 22px;height:30px"></div>',t++;continue}a+=`<p style="margin-bottom:10px;font-size:14px;line-height:1.7">${n}</p>`,t++}return`<div style="border:2px solid ${g};border-radius:12px;margin-bottom:24px;overflow:hidden;page-break-inside:avoid">
      <div style="background:${g};color:#fff;padding:12px 18px;display:flex;align-items:center;gap:12px">
        <div style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:17px;flex-shrink:0">${v+1}</div>
        <div style="font-size:16px;font-weight:800">${m}</div>
      </div>
      <div style="padding:16px 18px">${a}</div>
    </div>`}).join("")}function ee(i,o){return i.split(`
`).map(p=>p.trim()).filter(Boolean).map(p=>/^[\d]+[.)]\s/.test(p)?`<div style="background:${o}0d;border-left:4px solid ${o};padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:12px;font-size:16px;font-weight:600;line-height:1.6">${p}</div>`:/_{3,}/.test(p)?'<div style="border-bottom:2px solid #94a3b8;margin:8px 0 22px;height:30px"></div>':`<p style="margin-bottom:10px;font-size:14px;line-height:1.7">${p}</p>`).join("")}function ie({alumno:i,materia:o,docente:p,ec:d,registros:h=[],onCancel:x}){const[v,l]=z.useState("foto"),[g,y]=z.useState(""),[m,a]=z.useState(""),[t,n]=z.useState(null),c=V.useRef(null),s=i.fechaNacimiento?Math.floor((Date.now()-new Date(i.fechaNacimiento))/315576e5)+" años":null,f=[i.anio,i.division].filter(Boolean).join(" ")||i.curso||null,I=(i.terapias||[]).filter(r=>r.nombre).map(r=>`${r.nombre} — ${r.profesional||"-"} (${r.frecuencia||"-"})`).join("; "),k=h.filter(r=>!r.eliminado).sort((r,b)=>(b.fecha||"").localeCompare(r.fecha||"")).slice(0,8).map(r=>`[${r.fecha||""}${r.materia?` · ${r.materia}`:""}] ${r.avance||""}${r.acuerdo?` / Acuerdo: ${r.acuerdo}`:""}`).filter(r=>r.trim().length>10).join(`
`),A=async()=>{var r,b;if(!(!g.trim()&&!t)){l("analizando");try{const u=[];t&&u.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:t}}),u.push({type:"text",text:`Sos una AP (Docente de Inclusión) con experiencia en adaptaciones curriculares de Modalidad Especial bonaerense. Tu trabajo es crear adaptaciones REALMENTE individualizadas, no versiones genéricas simplificadas.

═══ PERFIL DEL ALUMNO ═══
Nombre: ${i.nombre}${s?` | ${s}`:""}${f?` | ${f}`:""}
Diagnóstico: ${i.diagnostico||"-"}
Terapias: ${I||"-"}${k?`

Registros de clase recientes:
${k}`:""}

═══ TAREA A ADAPTAR ═══
Materia: ${o||"-"}${g?`
Indicación de la AP: ${g}`:""}
(ver imagen adjunta)

═══ CÓMO TRABAJAR ═══
Antes de escribir, analizá:
1. ¿Qué implica el diagnóstico para ESTA tarea concreta? (carga cognitiva, atención sostenida, procesamiento, lenguaje)
2. ¿Qué dicen los registros? ¿Qué funciona y qué no para este chico/a?
3. ¿Qué aportan las terapias? (fonoaudiología → apoyos en lenguaje escrito/oral; psicomotricidad → actividades con motor fino; psicología → regulación emocional)
4. ¿Cuántos ejercicios puede resolver en una clase sin saturarse?

Con eso en mente, escribí la adaptación usando los elementos que MEJOR sirvan a este alumno/a específico:

EJERCICIO 1: [emoji] [título en lenguaje simple]
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

Reglas:
- Incluí solo los ejercicios que la tarea original tiene — no agregues más
- Verificá que los números sean matemáticamente correctos
- En TABLA: celdas separadas por |, poné ? en las que completa el alumno
- En UNIR: primero todos los ítems izquierda, luego todos los de derecha, separados por coma
- Lenguaje simple, directo, sin tecnicismos, sin asteriscos ni #`});const $=await(await fetch("/api/claude",{method:"POST",headers:H(),body:JSON.stringify({max_tokens:1800,messages:[{role:"user",content:u}]})})).json();a(((b=(r=$.content)==null?void 0:r[0])==null?void 0:b.text)||"No se pudo adaptar la tarea."),l("resultado")}catch{a("Error al conectar con Claude. Intentá de nuevo."),l("resultado")}}},T=()=>{const r=new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"}),b=d||E,u=Z(m,b),w=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a202c;font-size:15px;line-height:1.75}
      .page{max-width:740px;margin:0 auto}
      .banner{background:${b};padding:22px 36px 16px;color:#fff}
      .banner-eyebrow{font-size:10px;letter-spacing:2px;text-transform:uppercase;opacity:.7;margin-bottom:5px}
      .banner-titulo{font-size:22px;font-weight:900;margin-bottom:2px}
      .banner-sub{font-size:12px;opacity:.75}
      .body{padding:22px 36px 16px}
      .ficha{display:flex;margin-bottom:18px;border-radius:10px;overflow:hidden;border:1.5px solid #e2e8f0}
      .ficha-left{background:${b}12;padding:12px 16px;flex:1}
      .ficha-right{background:#f8fafc;padding:12px 16px;flex:1;border-left:1.5px solid #e2e8f0}
      .ficha-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:2px}
      .ficha-val{font-size:13px;font-weight:700;color:#1a202c;margin-bottom:7px}
      .ficha-val:last-child{margin-bottom:0}
      .divider{height:3px;background:linear-gradient(90deg,${b},${b}22,transparent);margin-bottom:18px;border-radius:2px}
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
        <div class="banner-titulo">${o||"Actividad adaptada"}</div>
        <div class="banner-sub">${r}</div>
      </div>
      <div class="body">
        <div class="ficha">
          <div class="ficha-left">
            <div class="ficha-label">Alumno/a</div>
            <div class="ficha-val">${i.nombre}</div>
            ${s?`<div class="ficha-label">Edad</div><div class="ficha-val">${s}</div>`:""}
            ${f?`<div class="ficha-label">Curso</div><div class="ficha-val">${f}</div>`:""}
          </div>
          <div class="ficha-right">
            <div class="ficha-label">Materia</div>
            <div class="ficha-val">${o||"-"}</div>
            <div class="ficha-label">Docente de grado</div>
            <div class="ficha-val">${(p==null?void 0:p.nombre)||"-"}</div>
          </div>
        </div>
        <div class="divider"></div>
        ${u}
        <div class="firma">
          <div class="firma-bloque">
            <div class="firma-linea"></div>
            <div class="firma-nombre">${_.nombreDocente||"Docente de Inclusión"}</div>
            <div class="firma-rol">AP · Modalidad Especial</div>
          </div>
          <div class="firma-bloque">
            <div class="firma-linea"></div>
            <div class="firma-nombre">Docente de Grado</div>
            <div class="firma-rol">${o||""}</div>
          </div>
          <div class="firma-bloque">
            <div class="firma-linea"></div>
            <div class="firma-nombre">Director/a</div>
            <div class="firma-rol">Sello institucional</div>
          </div>
        </div>
        <div class="footer">Res. 1664/17 · DGCyE · Generado con apoyo de IA y revisado por la AP</div>
      </div>
    </div></body></html>`,$=window.open("","_blank");$.document.write(w),$.document.close(),$.focus(),setTimeout(()=>$.print(),500)},O=()=>{const r=new Date().toLocaleDateString("es-AR"),b=`*Adaptación de tarea — ${o||"Clase"}*
*Alumno/a:* ${i.nombre}${f?` | ${f}`:""}
*Fecha:* ${r}

${m}`;window.open(`https://wa.me/?text=${encodeURIComponent(b)}`,"_blank")},M=r=>{const b=r.target.files[0];if(!b)return;const u=new Image,w=URL.createObjectURL(b);u.onload=()=>{const P=Math.min(1,1024/Math.max(u.width,u.height)),C=document.createElement("canvas");C.width=u.width*P,C.height=u.height*P,C.getContext("2d").drawImage(u,0,0,C.width,C.height),n(C.toDataURL("image/jpeg",.75).split(",")[1]),URL.revokeObjectURL(w)},u.src=w};return v==="analizando"?e.jsxs(S,{sx:{border:`2px solid ${d}`,textAlign:"center",padding:32},children:[e.jsx("div",{style:{fontSize:48,marginBottom:16},children:"🧠"}),e.jsx("div",{style:{fontWeight:800,fontSize:16,marginBottom:8},children:"Adaptando la tarea..."}),e.jsxs("div",{style:{fontSize:13,color:j},children:["Claude está analizando y adaptando para ",i.nombre,"."]})]}):v==="resultado"?e.jsxs(S,{sx:{border:`2px solid ${d}`,marginBottom:8},children:[e.jsx("div",{style:{fontWeight:800,fontSize:15,marginBottom:4},children:"Adaptación lista"}),e.jsxs("div",{style:{fontSize:12,color:j,marginBottom:12},children:[i.nombre,f?` · ${f}`:""," · ",o]}),e.jsx("div",{style:{background:"#f8fafc",borderRadius:10,padding:"14px 16px",fontSize:13,color:B,lineHeight:1.8,marginBottom:16,border:"1px solid #e2e8f0",whiteSpace:"pre-wrap",maxHeight:320,overflowY:"auto"},children:m}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsx("button",{onClick:T,style:{width:"100%",padding:13,borderRadius:12,border:"none",background:d,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"},children:"📄 Exportar PDF"}),e.jsx("button",{onClick:O,style:{width:"100%",padding:13,borderRadius:12,border:"none",background:"#25D366",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"},children:"📱 Enviar por WhatsApp"}),e.jsx(R,{outline:!0,onClick:x,color:j,children:"Cerrar"})]})]}):e.jsxs(S,{sx:{border:`2px solid ${d}`,marginBottom:8},children:[e.jsx("div",{style:{fontWeight:800,fontSize:15,marginBottom:4},children:"📸 Adaptar tarea con IA"}),e.jsxs("div",{style:{fontSize:12,color:j,marginBottom:16,lineHeight:1.5},children:["Subí la foto de la tarea del aula. Claude la va a adaptar para ",e.jsx("strong",{children:i.nombre}),f?` (${f})`:""," según su diagnóstico."]}),e.jsxs("div",{style:{marginBottom:14},children:[e.jsx("input",{ref:c,type:"file",accept:"image/*",onChange:M,style:{display:"none"}}),e.jsx("button",{onClick:()=>{var r;return(r=c.current)==null?void 0:r.click()},style:{width:"100%",padding:16,borderRadius:12,border:`2px dashed ${t?d:F}`,background:t?d+"10":"#f8fafc",color:t?d:j,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"},children:t?"✓ Imagen seleccionada — tocar para cambiar":"📷 Sacar foto o elegir de galería"})]}),e.jsx(L,{label:"Indicación para la IA (opcional)",value:g,onChange:y,multiline:!0,placeholder:"Ej: que sea solo oral, que reduzca a 2 ejercicios, que simplifique las tablas..."}),e.jsxs("div",{style:{display:"flex",gap:10},children:[e.jsx(R,{outline:!0,onClick:x,color:j,children:"Cancelar"}),e.jsx(R,{onClick:A,color:d,full:!0,disabled:!t&&!g.trim(),children:"✨ Adaptar"})]})]})}function te({r:i}){const o=i.asistencia==="presente"?E:i.asistencia==="ausente"?"#dc2626":"#f59e0b",p=d=>{if(!d)return"—";const[h,x,v]=d.split("-");return`${v}/${x}/${h}`};return e.jsxs(S,{children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:700,fontSize:14},children:i.materia}),e.jsxs("div",{style:{fontSize:12,color:j},children:[p(i.fecha),i.docente&&` · ${i.docente}`]})]}),e.jsx(G,{text:i.asistencia,bg:o})]}),i.avance&&e.jsxs("div",{style:{fontSize:13,color:"#475569",background:"#f8fafc",borderRadius:8,padding:"8px 12px",marginBottom:6},children:["📖 ",i.avance]}),i.acuerdo&&e.jsxs("div",{style:{fontSize:13,color:"#1d4ed8",background:"#eff6ff",borderRadius:8,padding:"8px 12px",marginBottom:6},children:["🤝 ",i.acuerdo]}),i.recordatorio&&e.jsxs("div",{style:{fontSize:13,color:"#92400e",background:"#fffbeb",borderRadius:8,padding:"8px 12px"},children:["⏰ ",i.recordatorio]})]})}function ne({ev:i,alumno:o,docentes:p,registros:d,escuelas:h,onAddReg:x,onAddRec:v,onFicha:l,onBack:g}){const[y,m]=z.useState(null),a=h.find(s=>s.id===o.escuelaId),t=(a==null?void 0:a.color)||E,n=i.docenteId?p.find(s=>s.id===i.docenteId):null,c=(d[o.id]||[]).filter(s=>s.materia===i.materia&&!s.eliminado);return e.jsxs("div",{children:[e.jsx("button",{onClick:g,style:{background:"none",border:"none",cursor:"pointer",color:t,fontWeight:700,fontSize:14,padding:0,marginBottom:16,fontFamily:"inherit"},children:"← Volver al mapa"}),e.jsxs("div",{style:{background:`linear-gradient(135deg,${W},${W}ee)`,borderRadius:20,padding:20,color:"#fff",marginBottom:16},children:[e.jsx("div",{style:{marginBottom:10},children:i.cur?e.jsx("span",{style:{background:"#f59e0b",color:"#fff",borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:800},children:"● En curso"}):e.jsx("span",{style:{background:"rgba(255,255,255,.15)",color:"rgba(255,255,255,.7)",borderRadius:20,padding:"3px 12px",fontSize:12},children:"Clase pasada / próxima"})}),e.jsx("div",{style:{fontSize:26,fontWeight:800,marginBottom:4},children:i.materia}),e.jsxs("div",{style:{fontSize:14,color:"rgba(255,255,255,.75)"},children:[i.horaInicio,"–",i.horaFin," · ",i.aula]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12,marginTop:16,paddingTop:16,borderTop:"1px solid rgba(255,255,255,.1)"},children:[e.jsx(U,{nombre:o.nombre,size:40,bg:t}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{style:{fontWeight:800,fontSize:16},children:o.nombre}),e.jsxs("div",{style:{fontSize:12,color:"rgba(255,255,255,.65)",marginTop:2},children:[o.curso," · ",o.diagnostico]})]}),e.jsx("button",{onClick:l,style:{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,color:"#fff",fontSize:12,fontWeight:700,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit"},children:"Ver ficha →"})]})]}),n&&e.jsxs(S,{sx:{borderLeft:`4px solid ${t}`},children:[e.jsx(N,{text:"Docente de esta clase"}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12},children:[e.jsx("div",{style:{width:44,height:44,borderRadius:"50%",background:t+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800,color:t},children:(n.nombre||"?").split(" ").pop()[0]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:800,fontSize:15},children:n.nombre}),e.jsxs("div",{style:{fontSize:12,color:j},children:[n.materia," · ",n.telefono]})]})]}),e.jsx(q,{tel:n.telefono})]})]}),!y&&e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4},children:[e.jsxs("button",{onClick:()=>m("reg"),style:{background:t,color:"#fff",border:"none",borderRadius:12,padding:"14px 12px",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("span",{style:{fontSize:22},children:"📝"}),"Registrar clase"]}),e.jsxs("button",{onClick:()=>m("nota"),style:{background:"#fff",color:B,border:`2px solid ${F}`,borderRadius:12,padding:"14px 12px",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[e.jsx("span",{style:{fontSize:22},children:"⏰"}),"Anotar algo"]}),e.jsxs("button",{onClick:()=>m("adaptar"),style:{background:"linear-gradient(135deg,#7c3aed,#a78bfa)",color:"#fff",border:"none",borderRadius:12,padding:"14px 12px",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:6,gridColumn:"1/-1"},children:[e.jsx("span",{style:{fontSize:22},children:"📸"}),"Adaptar tarea desde foto"]})]}),y==="adaptar"&&e.jsx(ie,{alumno:o,materia:i.materia,docente:n,ec:t,registros:d[o.id]||[],onCancel:()=>m(null)}),y==="reg"&&e.jsx(X,{alumno:o,docentes:p,escColor:t,docPre:n,onSave:s=>{x(o.id,s),m(null)},onCancel:()=>m(null)}),y==="nota"&&e.jsx(Y,{ec:t,ctx:`${i.materia}${n?` con ${n.nombre}`:""}`,alumnoId:o.id,onSave:s=>{v(s),m(null)},onCancel:()=>m(null)}),e.jsxs("div",{style:{marginTop:8},children:[e.jsxs("div",{style:{fontWeight:800,fontSize:16,color:B,marginBottom:4},children:["Historial en ",i.materia]}),e.jsx("div",{style:{fontSize:12,color:D,marginBottom:12},children:c.length===0?"Sin registros aún":`${c.length} clases registradas`}),c.length===0?e.jsxs(S,{sx:{textAlign:"center",padding:28},children:[e.jsx("div",{style:{fontSize:34,marginBottom:8},children:"📋"}),e.jsx("div",{style:{fontWeight:700,color:"#475569"},children:"Sin registros aún en esta materia"})]}):c.map(s=>e.jsx(te,{r:s},s.id))]})]})}export{ne as default};
