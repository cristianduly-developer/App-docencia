import React, { useState } from 'react';
import { G, GR, GL, BD, TX, DIAS_L } from '../../constants';
import { uid } from '../../utils/helpers';
import { Card, Btn, Fld, Sel, SecT, WA, Mail, Confirm } from '../ui';

const COLORES = ["#2D6A4F","#1d4ed8","#7c3aed","#dc2626","#d97706","#0891b2","#be185d","#15803d"];

// ── Ficha Escuela ─────────────────────────────────────────────
function FichaEscuela({ escuela, alumnos, docentes, onEditar, onToggleActivo, onDelete, onBack }) {
  const [conf, setConf] = useState(null);
  const ec = escuela.color || G;
  const alusAct = alumnos.filter(a => a.escuelaId === escuela.id && !a.eliminado && a.activo !== false);
  const docsEsc = docentes.filter(d => d.escuelaId === escuela.id && !d.eliminado);
  const inact = escuela.activo === false;

  return (
    <div>
      {conf && <Confirm msg={conf.msg} onOk={conf.ok} onNo={() => setConf(null)} />}
      <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:ec,fontWeight:700,fontSize:14,padding:0,marginBottom:16,fontFamily:"inherit" }}>← Volver</button>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${ec},${ec}99)`,borderRadius:20,padding:20,color:"#fff",marginBottom:16 }}>
        <div style={{ fontSize:11,color:"rgba(255,255,255,.7)",textTransform:"uppercase",letterSpacing:1 }}>{escuela.nivel}</div>
        <div style={{ fontSize:24,fontWeight:800,marginTop:6 }}>{escuela.nombre}</div>
        {escuela.direccion && <div style={{ fontSize:13,color:"rgba(255,255,255,.85)",marginTop:6 }}>📍 {escuela.direccion}</div>}
        {escuela.telefono && <div style={{ fontSize:13,color:"rgba(255,255,255,.85)",marginTop:4 }}>📞 {escuela.telefono}</div>}
      </div>

      {/* Acciones */}
      <div style={{ display:"flex",gap:8,marginBottom:16 }}>
        <button onClick={() => onEditar(escuela)} style={{ flex:1,background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:TX }}>✏️ Editar</button>
        <button onClick={() => setConf({ msg:`¿${inact?"Reactivar":"Archivar"} ${escuela.nombre}? Sus datos se conservan.`, ok:()=>{ onToggleActivo(escuela.id); setConf(null); onBack(); } })}
          style={{ flex:1,background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:inact?G:GR }}>
          {inact?"▶ Reactivar":"⏸ Archivar"}
        </button>
        <button onClick={() => setConf({ msg:`¿Eliminar ${escuela.nombre}? Esta acción no se puede deshacer.`, ok:()=>{ onDelete(escuela.id); setConf(null); onBack(); } })}
          style={{ flex:1,background:"#fff",border:"1.5px solid #fca5a5",borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:"#dc2626" }}>
          🗑 Eliminar
        </button>
      </div>

      {/* Equipo directivo */}
      {(escuela.director || escuela.secretaria || (escuela.eoe||[]).length>0) && (
        <Card>
          <SecT text="Equipo directivo" />
          {escuela.director && (
            <div style={{ padding:"10px 0",borderBottom:`1px solid ${BD}` }}>
              <div style={{ fontSize:11,fontWeight:700,color:GR,textTransform:"uppercase",marginBottom:4 }}>Director/a</div>
              <div style={{ fontWeight:700,fontSize:14,color:TX }}>{escuela.director}</div>
              <div style={{ display:"flex",gap:8,marginTop:6,flexWrap:"wrap" }}>
                {escuela.telefonoDirector && <WA tel={escuela.telefonoDirector} />}
                {escuela.mailDirector && <Mail mail={escuela.mailDirector} />}
              </div>
            </div>
          )}
          {escuela.secretaria && (
            <div style={{ padding:"10px 0",borderBottom:`1px solid ${BD}` }}>
              <div style={{ fontSize:11,fontWeight:700,color:GR,textTransform:"uppercase",marginBottom:4 }}>Secretaria/o</div>
              <div style={{ fontWeight:700,fontSize:14,color:TX }}>{escuela.secretaria}</div>
              <div style={{ display:"flex",gap:8,marginTop:6,flexWrap:"wrap" }}>
                {escuela.telefonoSecretaria && <WA tel={escuela.telefonoSecretaria} />}
                {escuela.mailSecretaria && <Mail mail={escuela.mailSecretaria} />}
              </div>
            </div>
          )}
          {(escuela.eoe||[]).map((m,i,arr) => (
            <div key={i} style={{ padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${BD}`:"none" }}>
              <div style={{ fontSize:11,fontWeight:700,color:GR,textTransform:"uppercase",marginBottom:4 }}>EOE — {m.rol||"Integrante"}</div>
              <div style={{ fontWeight:700,fontSize:14,color:TX }}>{m.nombre}</div>
              <div style={{ display:"flex",gap:8,marginTop:6,flexWrap:"wrap" }}>
                {m.telefono && <WA tel={m.telefono} />}
                {m.mail && <Mail mail={m.mail} />}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Docentes */}
      {docsEsc.length>0 && (
        <Card>
          <SecT text={`Docentes (${docsEsc.length})`} />
          {docsEsc.map((d,i,arr) => (
            <div key={d.id} style={{ padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${BD}`:"none" }}>
              <div style={{ fontWeight:700,fontSize:14,color:TX }}>{d.materia}</div>
              <div style={{ fontSize:13,color:GR,marginTop:1 }}>{d.nombre}</div>
              <div style={{ display:"flex",gap:8,marginTop:6 }}>
                {d.telefono && <WA tel={d.telefono} />}
                {d.mail && <Mail mail={d.mail} />}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Alumnos */}
      <Card>
        <SecT text={`Alumnos activos (${alusAct.length})`} />
        {alusAct.length===0
          ? <div style={{ color:GL,fontSize:13,fontStyle:"italic" }}>Sin alumnos activos</div>
          : alusAct.map((a,i,arr) => (
              <div key={a.id} style={{ padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${BD}`:"none" }}>
                <div style={{ fontWeight:600,fontSize:14,color:TX }}>{a.nombre}</div>
                <div style={{ fontSize:12,color:GR }}>{a.curso} · {a.diagnostico}</div>
              </div>
            ))}
      </Card>
    </div>
  );
}

// ── Form Escuela ──────────────────────────────────────────────
function FormEscuela({ inicial, escuelas, onSave, onCancel }) {
  const [form, setForm] = useState(() => inicial ? { ...inicial } : {
    id:uid(), nombre:"", nivel:"Primaria", color:G, direccion:"", telefono:"",
    director:"", telefonoDirector:"", mailDirector:"",
    secretaria:"", telefonoSecretaria:"", mailSecretaria:"",
    eoe:[], eliminado:false,
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const setEoe = (i,k,v) => setForm(p=>({...p,eoe:p.eoe.map((m,mi)=>mi===i?{...m,[k]:v}:m)}));
  const addEoe = () => setForm(p=>({...p,eoe:[...(p.eoe||[]),{nombre:"",rol:"Orientadora",telefono:"",mail:""}]}));
  const delEoe = i => setForm(p=>({...p,eoe:p.eoe.filter((_,mi)=>mi!==i)}));

  return (
    <div style={{ background:"#f8fafc",border:`2px solid ${form.color||G}`,borderRadius:16,padding:16,marginBottom:12 }}>
      <div style={{ fontWeight:800,fontSize:15,marginBottom:12 }}>{inicial?"Editar escuela":"Nueva escuela"}</div>
      <Fld label="Nombre" value={form.nombre} onChange={v=>set("nombre",v)} placeholder="Escuela N° ..." />
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12,fontWeight:700,color:GR,textTransform:"uppercase",marginBottom:6 }}>Nivel</div>
        <select value={form.nivel||"Primaria"} onChange={e=>set("nivel",e.target.value)} style={{ width:"100%",border:`1.5px solid ${BD}`,borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"inherit",background:"#f8fafc",boxSizing:"border-box" }}>
          {["Inicial","Primaria","Secundaria","Especial"].map(n=><option key={n}>{n}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12,fontWeight:700,color:GR,textTransform:"uppercase",marginBottom:8 }}>Color</div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          {COLORES.map(c=><button key={c} onClick={()=>set("color",c)} style={{ width:32,height:32,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",outline:form.color===c?`3px solid ${c}`:"none",cursor:"pointer" }} />)}
        </div>
      </div>
      <Fld label="Dirección" value={form.direccion||""} onChange={v=>set("direccion",v)} placeholder="Calle, número..." />
      <Fld label="Teléfono institucional" value={form.telefono||""} onChange={v=>set("telefono",v)} placeholder="011-xxxx-xxxx" />
      <div style={{ background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"12px 14px",marginBottom:14 }}>
        <div style={{ fontWeight:700,fontSize:13,color:TX,marginBottom:10 }}>👤 Director/a</div>
        <Fld label="Nombre completo" value={form.director||""} onChange={v=>set("director",v)} placeholder="Apellido, Nombre" />
        <Fld label="Teléfono" value={form.telefonoDirector||""} onChange={v=>set("telefonoDirector",v)} placeholder="11-xxxx-xxxx" />
        <Fld label="Mail" value={form.mailDirector||""} onChange={v=>set("mailDirector",v)} placeholder="director@escuela.edu.ar" />
      </div>
      <div style={{ background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"12px 14px",marginBottom:14 }}>
        <div style={{ fontWeight:700,fontSize:13,color:TX,marginBottom:10 }}>📋 Secretaria/o</div>
        <Fld label="Nombre completo" value={form.secretaria||""} onChange={v=>set("secretaria",v)} placeholder="Apellido, Nombre" />
        <Fld label="Teléfono" value={form.telefonoSecretaria||""} onChange={v=>set("telefonoSecretaria",v)} placeholder="11-xxxx-xxxx" />
        <Fld label="Mail" value={form.mailSecretaria||""} onChange={v=>set("mailSecretaria",v)} placeholder="secretaria@escuela.edu.ar" />
      </div>
      <div style={{ background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"12px 14px",marginBottom:14 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <div style={{ fontWeight:700,fontSize:13,color:TX }}>🔬 EOE</div>
          <button onClick={addEoe} style={{ background:G+"18",border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,color:G,cursor:"pointer",fontFamily:"inherit" }}>+ Agregar</button>
        </div>
        {(form.eoe||[]).length===0
          ? <div style={{ fontSize:12,color:GL,fontStyle:"italic" }}>Sin integrantes cargados</div>
          : (form.eoe||[]).map((m,i)=>(
              <div key={i} style={{ borderTop:`1px solid ${BD}`,paddingTop:10,marginTop:10 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                  <div style={{ fontWeight:600,fontSize:13 }}>Integrante {i+1}</div>
                  <button onClick={()=>delEoe(i)} style={{ background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:14,padding:0 }}>🗑</button>
                </div>
                <Fld label="Nombre" value={m.nombre} onChange={v=>setEoe(i,"nombre",v)} placeholder="Lic. ..." />
                <Fld label="Rol" value={m.rol} onChange={v=>setEoe(i,"rol",v)} placeholder="Orientadora..." />
                <Fld label="Teléfono" value={m.telefono||""} onChange={v=>setEoe(i,"telefono",v)} placeholder="11-xxxx-xxxx" />
                <Fld label="Mail" value={m.mail||""} onChange={v=>setEoe(i,"mail",v)} placeholder="eoe@escuela.edu.ar" />
              </div>
            ))}
      </div>
      <div style={{ display:"flex",gap:8 }}>
        <Btn outline onClick={onCancel} color={GR}>Cancelar</Btn>
        <Btn onClick={()=>onSave(form)} color={form.color||G} full disabled={!form.nombre}>Guardar</Btn>
      </div>
    </div>
  );
}

// ── SecEscuelas ───────────────────────────────────────────────
function SecEscuelas({ escuelas, alumnos, docentes, onSave, onDelete, onToggleActivo }) {
  const [form, setForm] = useState(null);   // null | escuela a editar | "nueva"
  const [ficha, setFicha] = useState(null);
  const activas = escuelas.filter(e=>!e.eliminado);

  if (form) return (
    <FormEscuela
      inicial={form === "nueva" ? null : form}
      escuelas={escuelas}
      onSave={e=>{ onSave(e); setForm(null); setFicha(null); }}
      onCancel={()=>setForm(null)}
    />
  );

  if (ficha) return (
    <FichaEscuela
      escuela={ficha}
      alumnos={alumnos}
      docentes={docentes}
      onEditar={e=>setForm(e)}
      onToggleActivo={onToggleActivo}
      onDelete={onDelete}
      onBack={()=>setFicha(null)}
    />
  );

  return (
    <div>
      <button onClick={()=>setForm("nueva")} style={{ width:"100%",padding:12,borderRadius:14,border:`2px dashed ${G}`,background:"#f0fdf4",color:G,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginBottom:12 }}>+ Nueva escuela</button>
      {activas.length===0
        ? <Card sx={{ textAlign:"center",padding:32,color:GR }}>Sin escuelas. Agregá la primera.</Card>
        : activas.map(e=>{
            const aluCount = alumnos.filter(a=>a.escuelaId===e.id&&!a.eliminado&&a.activo!==false).length;
            const inact = e.activo===false;
            return (
              <Card key={e.id} onClick={()=>setFicha(e)} sx={{ borderLeft:`4px solid ${inact?"#cbd5e0":e.color||G}`,opacity:inact?.7:1,cursor:"pointer" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800,fontSize:16,color:TX }}>{e.nombre}</div>
                    <div style={{ fontSize:12,color:GR,marginTop:2 }}>{e.nivel}{e.direccion?` · ${e.direccion}`:""}</div>
                    <div style={{ fontSize:12,color:GL,marginTop:2 }}>👤 {aluCount} alumnos{e.director?` · ${e.director}`:""}</div>
                  </div>
                  <div style={{ fontSize:22,color:"#cbd5e0",marginLeft:8 }}>›</div>
                </div>
              </Card>
            );
          })}
    </div>
  );
}

// ── Ficha Docente ─────────────────────────────────────────────
function FichaDocente({ docente, escuelas, alumnos, onEditar, onDelete, onBack }) {
  const [conf, setConf] = useState(null);
  const esc = escuelas.find(e=>e.id===docente.escuelaId);
  const ec = esc?.color || G;
  const alusDoc = alumnos.filter(a=>!a.eliminado&&a.activo!==false&&(a.horarios||[]).some(h=>h.docenteId===docente.id));

  return (
    <div>
      {conf && <Confirm msg={conf.msg} onOk={conf.ok} onNo={()=>setConf(null)} />}
      <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:ec,fontWeight:700,fontSize:14,padding:0,marginBottom:16,fontFamily:"inherit" }}>← Volver</button>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${ec},${ec}99)`,borderRadius:20,padding:20,color:"#fff",marginBottom:16 }}>
        <div style={{ fontSize:11,color:"rgba(255,255,255,.7)",textTransform:"uppercase",letterSpacing:1 }}>{docente.materia}</div>
        <div style={{ fontSize:24,fontWeight:800,marginTop:6 }}>{docente.nombre}</div>
        {esc && <div style={{ fontSize:13,color:"rgba(255,255,255,.85)",marginTop:6 }}>🏫 {esc.nombre}</div>}
        <div style={{ display:"flex",gap:8,marginTop:14,flexWrap:"wrap" }}>
          {docente.telefono && (
            <a href={`https://wa.me/54${docente.telefono.replace(/[-\s]/g,"")}`} target="_blank" rel="noreferrer"
              style={{ display:"inline-flex",alignItems:"center",gap:8,background:"#25D366",color:"#fff",borderRadius:12,padding:"10px 16px",fontSize:13,fontWeight:800,textDecoration:"none" }}>
              💬 WhatsApp · {docente.telefono}
            </a>
          )}
          {docente.mail && (
            <a href={`mailto:${docente.mail}`}
              style={{ display:"inline-flex",alignItems:"center",gap:8,background:"#3b82f6",color:"#fff",borderRadius:12,padding:"10px 16px",fontSize:13,fontWeight:800,textDecoration:"none" }}>
              ✉ Mail
            </a>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display:"flex",gap:8,marginBottom:16 }}>
        <button onClick={()=>onEditar(docente)} style={{ flex:1,background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:TX }}>✏️ Editar</button>
        <button onClick={()=>setConf({ msg:`¿Eliminar a ${docente.nombre}? Esta acción no se puede deshacer.`, ok:()=>{ onDelete(docente.id); setConf(null); onBack(); } })}
          style={{ flex:1,background:"#fff",border:"1.5px solid #fca5a5",borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:"#dc2626" }}>
          🗑 Eliminar
        </button>
      </div>

      {/* Alumnos que atiende */}
      <Card>
        <SecT text={`Alumnos asignados (${alusDoc.length})`} />
        {alusDoc.length===0
          ? <div style={{ color:GL,fontSize:13,fontStyle:"italic" }}>Sin alumnos con horarios asignados</div>
          : alusDoc.map((a,i,arr)=>(
              <div key={a.id} style={{ padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${BD}`:"none" }}>
                <div style={{ fontWeight:600,fontSize:14,color:TX }}>{a.nombre}</div>
                <div style={{ fontSize:12,color:GR }}>{a.curso} · {a.diagnostico}</div>
              </div>
            ))}
      </Card>
    </div>
  );
}

// ── SecDocentes ───────────────────────────────────────────────
function SecDocentes({ docentes, escuelas, alumnos, onSave, onDelete }) {
  const [form, setForm] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [busq, setBusq] = useState("");
  const [filEsc, setFilEsc] = useState("");
  const activos = docentes.filter(d=>!d.eliminado);
  const filtrados = activos.filter(d=>{
    if (filEsc && d.escuelaId!==filEsc) return false;
    if (busq) { const q=busq.toLowerCase(); return d.nombre.toLowerCase().includes(q)||d.materia.toLowerCase().includes(q); }
    return true;
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  if (form) return (
    <div style={{ background:"#f8fafc",border:`2px solid ${G}`,borderRadius:16,padding:16,marginBottom:12 }}>
      <div style={{ fontWeight:800,fontSize:15,marginBottom:12 }}>{activos.find(d=>d.id===form.id)?"Editar docente":"Nuevo docente"}</div>
      <Fld label="Nombre completo" value={form.nombre} onChange={v=>set("nombre",v)} placeholder="Apellido, Nombre" />
      <Fld label="Materia / Área" value={form.materia} onChange={v=>set("materia",v)} placeholder="Matemática, Lengua..." />
      <Sel label="Escuela" value={form.escuelaId} onChange={v=>set("escuelaId",v)} opts={escuelas.filter(e=>!e.eliminado).map(e=>({v:e.id,l:e.nombre}))} ph="Seleccionar..." />
      <Fld label="Teléfono" value={form.telefono} onChange={v=>set("telefono",v)} placeholder="11-xxxx-xxxx" />
      <Fld label="Mail" value={form.mail} onChange={v=>set("mail",v)} placeholder="docente@escuela.edu.ar" />
      <div style={{ display:"flex",gap:8 }}>
        <Btn outline onClick={()=>{ setForm(null); }} color={GR}>Cancelar</Btn>
        <Btn onClick={()=>{ onSave(form); setForm(null); }} full disabled={!form.nombre||!form.materia}>Guardar</Btn>
      </div>
    </div>
  );

  if (ficha) return (
    <FichaDocente
      docente={ficha}
      escuelas={escuelas}
      alumnos={alumnos}
      onEditar={d=>{ setFicha(null); setForm({...d}); }}
      onDelete={onDelete}
      onBack={()=>setFicha(null)}
    />
  );

  return (
    <div>
      <button onClick={()=>setForm({id:uid(),nombre:"",materia:"",escuelaId:"",telefono:"",mail:"",eliminado:false})}
        style={{ width:"100%",padding:12,borderRadius:14,border:`2px dashed ${G}`,background:"#f0fdf4",color:G,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginBottom:12 }}>
        + Nuevo docente
      </button>

      {activos.length>0 && <>
        <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="🔍 Buscar por nombre o materia..."
          style={{ width:"100%",border:`1.5px solid ${BD}`,borderRadius:10,padding:"9px 14px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",marginBottom:8 }} />
        {escuelas.filter(e=>!e.eliminado).length>1 && (
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
            <button onClick={()=>setFilEsc("")} style={{ padding:"6px 12px",borderRadius:20,border:"2px solid",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer",borderColor:!filEsc?G:BD,background:!filEsc?G:"#fff",color:!filEsc?"#fff":"#475569",whiteSpace:"nowrap" }}>Todas</button>
            {escuelas.filter(e=>!e.eliminado).map(e=>(
              <button key={e.id} onClick={()=>setFilEsc(filEsc===e.id?"":e.id)}
                style={{ padding:"6px 12px",borderRadius:20,border:"2px solid",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer",borderColor:filEsc===e.id?(e.color||G):BD,background:filEsc===e.id?(e.color||G):"#fff",color:filEsc===e.id?"#fff":"#475569",whiteSpace:"nowrap" }}>
                {e.nombre}
              </button>
            ))}
          </div>
        )}
      </>}

      {filtrados.length===0
        ? <Card sx={{ textAlign:"center",padding:32,color:GR }}>{activos.length===0?"Sin docentes cargados.":"Sin resultados."}</Card>
        : filtrados.map(d=>{
            const esc = escuelas.find(e=>e.id===d.escuelaId);
            return (
              <Card key={d.id} onClick={()=>setFicha(d)} sx={{ borderLeft:`4px solid ${esc?.color||G}`,cursor:"pointer" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800,fontSize:15,color:TX }}>{d.materia}</div>
                    <div style={{ fontSize:13,color:GR,marginTop:2 }}>{d.nombre}</div>
                    <div style={{ fontSize:11,color:GL,marginTop:2 }}>{esc?.nombre}{d.telefono?` · ${d.telefono}`:""}</div>
                  </div>
                  <div style={{ fontSize:22,color:"#cbd5e0",marginLeft:8 }}>›</div>
                </div>
              </Card>
            );
          })}
    </div>
  );
}

// ── SecProfesionales ──────────────────────────────────────────
function SecProfesionales({ pros, onSave, onDelete }) {
  const [form, setForm] = useState(null);
  const [conf, setConf] = useState(null);
  const activos = pros.filter(p=>!p.eliminado);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  return (
    <div>
      {conf && <Confirm msg={conf.msg} onOk={conf.ok} onNo={()=>setConf(null)} />}
      {form ? (
        <div style={{ background:"#f8fafc",border:"2px solid #7c3aed",borderRadius:16,padding:16,marginBottom:12 }}>
          <div style={{ fontWeight:800,fontSize:15,marginBottom:12 }}>{activos.find(p=>p.id===form.id)?"Editar profesional":"Nuevo profesional"}</div>
          <Fld label="Nombre completo" value={form.nombre} onChange={v=>set("nombre",v)} placeholder="Lic. ..." />
          <Fld label="Rol / Especialidad" value={form.rol} onChange={v=>set("rol",v)} placeholder="Psicopedagoga..." />
          <Fld label="Teléfono" value={form.telefono} onChange={v=>set("telefono",v)} placeholder="11-xxxx-xxxx" />
          <Fld label="Mail" value={form.mail} onChange={v=>set("mail",v)} placeholder="prof@consultorio.com" />
          <div style={{ display:"flex",gap:8 }}>
            <Btn outline onClick={()=>setForm(null)} color={GR}>Cancelar</Btn>
            <Btn onClick={()=>{ onSave(form); setForm(null); }} color="#7c3aed" full disabled={!form.nombre}>Guardar</Btn>
          </div>
        </div>
      ) : (
        <button onClick={()=>setForm({id:uid(),nombre:"",rol:"",telefono:"",mail:"",eliminado:false})}
          style={{ width:"100%",padding:12,borderRadius:14,border:"2px dashed #7c3aed",background:"#faf5ff",color:"#7c3aed",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginBottom:12 }}>
          + Nuevo profesional externo
        </button>
      )}
      {activos.length===0
        ? <Card sx={{ textAlign:"center",padding:32,color:GR }}>Sin profesionales externos.</Card>
        : activos.map(p=>(
            <Card key={p.id} sx={{ borderLeft:"4px solid #7c3aed" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:15,color:TX }}>{p.nombre}</div>
                  <div style={{ fontSize:12,color:GR,marginTop:2 }}>{p.rol}</div>
                  {p.mail && <div style={{ fontSize:11,color:GL,marginTop:2 }}>✉ {p.mail}</div>}
                  <div style={{ display:"flex",gap:8,marginTop:8 }}>
                    {p.telefono && <WA tel={p.telefono} />}
                    {p.mail && <Mail mail={p.mail} />}
                  </div>
                </div>
                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                  <button onClick={()=>setForm({...p})} style={{ background:"#f5f3ff",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",color:"#7c3aed",fontWeight:700,fontSize:12,fontFamily:"inherit" }}>Editar</button>
                  <button onClick={()=>setConf({ msg:`¿Eliminar a ${p.nombre}?`,ok:()=>{ onDelete(p.id); setConf(null); } })} style={{ background:"#fef2f2",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",color:"#dc2626",fontWeight:700,fontSize:12,fontFamily:"inherit" }}>🗑</button>
                </div>
              </div>
            </Card>
          ))}
    </div>
  );
}

// ── Directorio principal ──────────────────────────────────────
export default function Directorio({ alumnos, escuelas, docentes, pros, onVer, saveEsc, delEsc, saveDoc, savePro, delDoc, delPro, toggleActivoEsc }) {
  const [seccion, setSeccion] = useState("escuelas");
  const SECS = [
    { id:"escuelas", icon:"🏫", label:"Escuelas"      },
    { id:"docentes", icon:"👩‍🏫", label:"Docentes"      },
    { id:"pros",     icon:"🔬", label:"Profesionales" },
  ];
  return (
    <div>
      <div style={{ background:"linear-gradient(135deg,#1a202c,#2d3748)",padding:"16px 20px 0",color:"#fff" }}>
        <div style={{ fontWeight:800,fontSize:18,marginBottom:12 }}>🏫 Directorio</div>
        <div style={{ display:"flex",gap:0,borderBottom:"2px solid rgba(255,255,255,.1)" }}>
          {SECS.map(s=>(
            <button key={s.id} onClick={()=>setSeccion(s.id)} style={{ flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px 10px",fontFamily:"inherit",borderBottom:seccion===s.id?"2px solid #40916c":"2px solid transparent",marginBottom:-2 }}>
              <span style={{ fontSize:18 }}>{s.icon}</span>
              <span style={{ fontSize:9,fontWeight:seccion===s.id?800:600,color:seccion===s.id?"#40916c":"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:.3 }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:"16px 16px 80px" }}>
        {seccion==="escuelas" && <SecEscuelas escuelas={escuelas} alumnos={alumnos} docentes={docentes} onSave={saveEsc} onDelete={delEsc} onToggleActivo={toggleActivoEsc} />}
        {seccion==="docentes" && <SecDocentes docentes={docentes} escuelas={escuelas} alumnos={alumnos} onSave={saveDoc} onDelete={delDoc} />}
        {seccion==="pros"     && <SecProfesionales pros={pros} onSave={savePro} onDelete={delPro} />}
      </div>
    </div>
  );
}
