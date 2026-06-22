import React, { useState } from 'react';
import { G, GD, GR, GL, BD, TX, DIAS_L } from '../../constants';
import { uid } from '../../utils/helpers';
import { Card, Btn, Fld, Sel, SecT, WA, Mail, Confirm } from '../ui';

const COLORES = ["#2D6A4F","#1d4ed8","#7c3aed","#dc2626","#d97706","#0891b2","#be185d","#15803d"];

function defaultTurno() {
  return { secretaria:'', telefonoSecretaria:'', mailSecretaria:'', preceptores:[], eoe:[] };
}

function migrarTurno(turno) {
  if (!turno) return turno;
  // Retrocompatibilidad: si tiene preceptor como string, lo convierte a array
  if (typeof turno.preceptor === 'string' && turno.preceptor) {
    const { preceptor, telefonoPreceptor, mailPreceptor, ...resto } = turno;
    return { ...resto, preceptores: [{ nombre: preceptor, telefono: telefonoPreceptor||'', mail: mailPreceptor||'' }] };
  }
  if (!turno.preceptores) return { ...turno, preceptores: [] };
  return turno;
}

function SeccionTurnoForm({ label, icon, turno, onChange }) {
  const t = migrarTurno(turno);
  const set = (k, v) => onChange({ ...t, [k]: v });
  const setPre = (i, k, v) => onChange({ ...t, preceptores: t.preceptores.map((p, pi) => pi === i ? { ...p, [k]: v } : p) });
  const addPre = () => onChange({ ...t, preceptores: [...(t.preceptores || []), { nombre:'', telefono:'', mail:'' }] });
  const delPre = i => onChange({ ...t, preceptores: t.preceptores.filter((_, pi) => pi !== i) });
  const setEoe = (i, k, v) => onChange({ ...t, eoe: t.eoe.map((m, mi) => mi === i ? { ...m, [k]: v } : m) });
  const addEoe = () => onChange({ ...t, eoe: [...(t.eoe || []), { nombre:'', rol:'Orientadora', telefono:'', mail:'' }] });
  const delEoe = i => onChange({ ...t, eoe: t.eoe.filter((_, mi) => mi !== i) });
  return (
    <div style={{ background:'#fff', border:`1.5px solid ${BD}`, borderRadius:12, padding:'12px 14px', marginBottom:14 }}>
      <div style={{ fontWeight:700, fontSize:13, color:TX, marginBottom:10 }}>{icon} {label}</div>
      <Fld label="Secretaria/o" value={t.secretaria||''} onChange={v=>set('secretaria',v)} placeholder="Apellido, Nombre" />
      <Fld label="Teléfono secretaria/o" value={t.telefonoSecretaria||''} onChange={v=>set('telefonoSecretaria',v)} placeholder="11-xxxx-xxxx" />
      <Fld label="Mail secretaria/o" value={t.mailSecretaria||''} onChange={v=>set('mailSecretaria',v)} placeholder="" />

      {/* Preceptores — array */}
      <div style={{ marginTop:10, borderTop:`1px solid ${BD}`, paddingTop:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontWeight:700, fontSize:12, color:GR }}>🗂 Preceptores</div>
          <button onClick={addPre} style={{ background:G+'18', border:'none', borderRadius:8, padding:'3px 8px', fontSize:11, fontWeight:700, color:G, cursor:'pointer', fontFamily:'inherit' }}>+ Agregar</button>
        </div>
        {(t.preceptores||[]).length === 0
          ? <div style={{ fontSize:12, color:GL, fontStyle:'italic' }}>Sin preceptores</div>
          : (t.preceptores||[]).map((p, i) => (
              <div key={i} style={{ borderTop:`1px solid ${BD}`, paddingTop:8, marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ fontWeight:600, fontSize:12 }}>Preceptor/a {i+1}</div>
                  <button onClick={()=>delPre(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', fontSize:13, padding:0 }}>🗑</button>
                </div>
                <Fld label="Nombre" value={p.nombre} onChange={v=>setPre(i,'nombre',v)} placeholder="Apellido, Nombre" />
                <Fld label="Teléfono" value={p.telefono||''} onChange={v=>setPre(i,'telefono',v)} placeholder="11-xxxx-xxxx" />
                <Fld label="Mail" value={p.mail||''} onChange={v=>setPre(i,'mail',v)} />
              </div>
            ))}
      </div>

      {/* EOE */}
      <div style={{ marginTop:10, borderTop:`1px solid ${BD}`, paddingTop:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontWeight:700, fontSize:12, color:GR }}>🔬 EOE</div>
          <button onClick={addEoe} style={{ background:G+'18', border:'none', borderRadius:8, padding:'3px 8px', fontSize:11, fontWeight:700, color:G, cursor:'pointer', fontFamily:'inherit' }}>+ Agregar</button>
        </div>
        {(t.eoe||[]).length === 0
          ? <div style={{ fontSize:12, color:GL, fontStyle:'italic' }}>Sin integrantes EOE</div>
          : (t.eoe||[]).map((m, i) => (
              <div key={i} style={{ borderTop:`1px solid ${BD}`, paddingTop:8, marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ fontWeight:600, fontSize:12 }}>Integrante {i+1}</div>
                  <button onClick={()=>delEoe(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', fontSize:13, padding:0 }}>🗑</button>
                </div>
                <Fld label="Nombre" value={m.nombre} onChange={v=>setEoe(i,'nombre',v)} placeholder="Lic. ..." />
                <Fld label="Rol" value={m.rol} onChange={v=>setEoe(i,'rol',v)} placeholder="Orientadora..." />
                <Fld label="Teléfono" value={m.telefono||''} onChange={v=>setEoe(i,'telefono',v)} placeholder="11-xxxx-xxxx" />
                <Fld label="Mail" value={m.mail||''} onChange={v=>setEoe(i,'mail',v)} />
              </div>
            ))}
      </div>
    </div>
  );
}

function TurnoCard({ turno, label, icon, inline }) {
  if (!turno) return null;
  const t = migrarTurno(turno);
  const hasSec = t.secretaria;
  const hasPre = (t.preceptores||[]).length > 0;
  const hasEoe = (t.eoe||[]).length > 0;
  if (!hasSec && !hasPre && !hasEoe) {
    const empty = <div style={{ color:GL, fontSize:13, fontStyle:'italic' }}>Sin personal cargado para este turno</div>;
    return inline ? empty : <Card><SecT text={`${icon} ${label}`} />{empty}</Card>;
  }
  const items = [
    hasSec && { titulo:'Secretaria/o', nombre:t.secretaria, tel:t.telefonoSecretaria, mail:t.mailSecretaria },
    ...(t.preceptores||[]).map((p, i) => ({ titulo: (t.preceptores.length > 1 ? `Preceptor/a ${i+1}` : 'Preceptor/a'), nombre:p.nombre, tel:p.telefono, mail:p.mail })),
    ...(t.eoe||[]).map(m => ({ titulo:`EOE — ${m.rol||'Integrante'}`, nombre:m.nombre, tel:m.telefono, mail:m.mail })),
  ].filter(Boolean);
  const content = items.map((it, i) => (
    <div key={i} style={{ padding:'10px 0', borderBottom:i<items.length-1?`1px solid ${BD}`:'none' }}>
      <div style={{ fontSize:11, fontWeight:700, color:GR, textTransform:'uppercase', marginBottom:4 }}>{it.titulo}</div>
      <div style={{ fontWeight:700, fontSize:14, color:TX }}>{it.nombre}</div>
      <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
        {it.tel && <WA tel={it.tel} />}
        {it.mail && <Mail mail={it.mail} />}
      </div>
    </div>
  ));
  if (inline) return <>{content}</>;
  return <Card><SecT text={`${icon} ${label}`} />{content}</Card>;
}

// ── Modal cierre de escuela ───────────────────────────────────
function ModalCierreEscuela({ escuela, alusAct, docsEsc, onArchivarTodo, onCerrarCiclo, onClose }) {
  const ec = escuela.color || G;
  const cicloActual = String(new Date().getFullYear());
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20 }}>
      <div style={{ background:"#fff",borderRadius:20,padding:24,maxWidth:360,width:"100%" }}>
        <div style={{ fontSize:22,textAlign:"center",marginBottom:8 }}>🏫</div>
        <div style={{ fontWeight:800,fontSize:16,textAlign:"center",marginBottom:4 }}>{escuela.nombre}</div>
        <div style={{ fontSize:13,color:GR,textAlign:"center",marginBottom:20 }}>
          {alusAct.length} alumnos activos · {docsEsc.length} docentes
        </div>

        {/* Opción 1: cerrar ciclo */}
        <button onClick={onCerrarCiclo} style={{ width:"100%",background:"#fffbeb",border:"2px solid #f59e0b",borderRadius:14,padding:14,cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:10 }}>
          <div style={{ fontWeight:800,fontSize:14,color:"#92400e",marginBottom:4 }}>🗓 Cerrar ciclo {cicloActual}</div>
          <div style={{ fontSize:12,color:"#b45309",lineHeight:1.5 }}>
            La escuela <strong>sigue activa</strong> el año que viene.<br/>
            Se archivan los alumnos y docentes del ciclo actual.
          </div>
        </button>

        {/* Opción 2: archivar todo */}
        <button onClick={onArchivarTodo} style={{ width:"100%",background:"#fef2f2",border:"2px solid #fca5a5",borderRadius:14,padding:14,cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:16 }}>
          <div style={{ fontWeight:800,fontSize:14,color:"#991b1b",marginBottom:4 }}>📦 Archivar escuela completa</div>
          <div style={{ fontSize:12,color:"#b91c1c",lineHeight:1.5 }}>
            La escuela <strong>se archiva</strong> junto con todos sus<br/>
            docentes y alumnos. No aparece más activa.
          </div>
        </button>

        <button onClick={onClose} style={{ width:"100%",padding:"10px",borderRadius:10,border:`1.5px solid ${BD}`,background:"#fff",color:GR,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Ficha Escuela ─────────────────────────────────────────────
function FichaEscuela({ escuela, alumnos, docentes, onEditar, onToggleActivo, onArchivarAlumnos, onDelete, onBack }) {
  const [conf, setConf] = useState(null);
  const [modalCierre, setModalCierre] = useState(false);
  const [turnoFicha, setTurnoFicha] = useState('mañana');
  const ec = escuela.color || G;
  const alusAct = alumnos.filter(a => a.escuelaId === escuela.id && !a.eliminado && a.activo !== false);
  const docsEsc = docentes.filter(d => d.escuelaId === escuela.id && !d.eliminado);
  const inact = escuela.activo === false;
  const cicloActual = String(new Date().getFullYear());

  const handleCerrarCiclo = () => {
    setModalCierre(false);
    onArchivarAlumnos(escuela.id, cicloActual, true); // archiva alumnos + docentes, escuela sigue activa
    onBack();
  };

  const handleArchivarTodo = () => {
    setModalCierre(false);
    onArchivarAlumnos(escuela.id, cicloActual, true); // archiva alumnos + docentes
    onToggleActivo(escuela.id);                        // archiva la escuela
    onBack();
  };

  return (
    <div>
      {conf && <Confirm msg={conf.msg} onOk={conf.ok} onNo={() => setConf(null)} />}
      {modalCierre && (
        <ModalCierreEscuela
          escuela={escuela}
          alusAct={alusAct}
          docsEsc={docsEsc}
          onCerrarCiclo={handleCerrarCiclo}
          onArchivarTodo={handleArchivarTodo}
          onClose={() => setModalCierre(false)}
        />
      )}
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
        {inact
          ? <button onClick={() => setConf({ msg:`¿Reactivar "${escuela.nombre}"? Los alumnos del ciclo anterior no se reactivarán — podés ingresarlos nuevamente si los necesitás.`, ok:()=>{ onToggleActivo(escuela.id); setConf(null); onBack(); } })}
              style={{ flex:1,background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:G }}>
              ▶ Reactivar
            </button>
          : <button onClick={() => setModalCierre(true)}
              style={{ flex:1,background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:GR }}>
              🗓 Cerrar / Archivar
            </button>
        }
        <button onClick={() => setConf({ msg:`¿Eliminar ${escuela.nombre}? Esta acción no se puede deshacer.`, ok:()=>{ onDelete(escuela.id); setConf(null); onBack(); } })}
          style={{ flex:1,background:"#fff",border:"1.5px solid #fca5a5",borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:"#dc2626" }}>
          🗑 Eliminar
        </button>
      </div>

      {/* Equipo directivo */}
      {(escuela.director || escuela.vicedirector) && (
        <Card>
          <SecT text="Equipo directivo" />
          {escuela.director && (
            <div style={{ padding:"10px 0", borderBottom:escuela.vicedirector?`1px solid ${BD}`:"none" }}>
              <div style={{ fontSize:11,fontWeight:700,color:GR,textTransform:"uppercase",marginBottom:4 }}>Director/a</div>
              <div style={{ fontWeight:700,fontSize:14,color:TX }}>{escuela.director}</div>
              <div style={{ display:"flex",gap:8,marginTop:6,flexWrap:"wrap" }}>
                {escuela.telefonoDirector && <WA tel={escuela.telefonoDirector} />}
                {escuela.mailDirector && <Mail mail={escuela.mailDirector} />}
              </div>
            </div>
          )}
          {escuela.vicedirector && (
            <div style={{ padding:"10px 0" }}>
              <div style={{ fontSize:11,fontWeight:700,color:GR,textTransform:"uppercase",marginBottom:4 }}>Vicedirector/a</div>
              <div style={{ fontWeight:700,fontSize:14,color:TX }}>{escuela.vicedirector}</div>
              <div style={{ display:"flex",gap:8,marginTop:6,flexWrap:"wrap" }}>
                {escuela.telefonoVicedirector && <WA tel={escuela.telefonoVicedirector} />}
                {escuela.mailVicedirector && <Mail mail={escuela.mailVicedirector} />}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Tabs turnos */}
      {((escuela.turnoDia && (escuela.turnoDia.secretaria||(escuela.turnoDia.preceptores||[]).length>0||escuela.turnoDia.preceptor||(escuela.turnoDia.eoe||[]).length>0)) ||
        (escuela.turnoTarde && (escuela.turnoTarde.secretaria||(escuela.turnoTarde.preceptores||[]).length>0||escuela.turnoTarde.preceptor||(escuela.turnoTarde.eoe||[]).length>0))) && (
        <Card>
          <div style={{ display:'flex', gap:0, marginBottom:12, borderRadius:10, overflow:'hidden', border:`1.5px solid ${BD}` }}>
            {[['mañana','☀️ Mañana'],['tarde','🌙 Tarde']].map(([k,l])=>(
              <button key={k} onClick={()=>setTurnoFicha(k)} style={{ flex:1,padding:'10px',border:'none',background:turnoFicha===k?ec:'#fff',color:turnoFicha===k?'#fff':TX,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>{l}</button>
            ))}
          </div>
          {turnoFicha==='mañana'
            ? <TurnoCard turno={escuela.turnoDia}   label="Turno Mañana" icon="☀️" inline />
            : <TurnoCard turno={escuela.turnoTarde} label="Turno Tarde"  icon="🌙" inline />}
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
  const [form, setForm] = useState(() => {
    if (inicial) return {
      director:'', telefonoDirector:'', mailDirector:'',
      vicedirector:'', telefonoVicedirector:'', mailVicedirector:'',
      telefono:'', direccion:'',
      ...inicial,
      turnoDia:   inicial.turnoDia   || defaultTurno(),
      turnoTarde: inicial.turnoTarde || defaultTurno(),
    };
    return {
      id:uid(), nombre:'', nivel:'Primaria', color:G, direccion:'', telefono:'',
      director:'', telefonoDirector:'', mailDirector:'',
      vicedirector:'', telefonoVicedirector:'', mailVicedirector:'',
      turnoDia:   defaultTurno(),
      turnoTarde: defaultTurno(),
      eliminado:false,
    };
  });
  const [turnoTab, setTurnoTab] = useState('mañana');
  const [mismoPersonal, setMismoPersonal] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

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

      {/* Estructura de jornada */}
      <div style={{ background:"#fff", border:`1.5px solid ${BD}`, borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:13, color:TX, marginBottom:10 }}>🕐 Estructura de jornada</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:GR, textTransform:"uppercase", marginBottom:6 }}>Hora de entrada</div>
            <input type="time" value={form.jornadaEntrada||"08:00"} onChange={e=>set("jornadaEntrada",e.target.value)} style={{ width:"100%", border:`1.5px solid ${BD}`, borderRadius:10, padding:"9px 12px", fontSize:14, fontFamily:"inherit", boxSizing:"border-box" }} />
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:GR, textTransform:"uppercase", marginBottom:6 }}>Cant. bloques</div>
            <select value={form.jornadaBloques||4} onChange={e=>set("jornadaBloques",Number(e.target.value))} style={{ width:"100%", border:`1.5px solid ${BD}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:"inherit", background:"#fff", boxSizing:"border-box" }}>
              {[2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n} bloques</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:GR, textTransform:"uppercase", marginBottom:6 }}>Duración bloque (min)</div>
            <select value={form.jornadaDurBloque||50} onChange={e=>set("jornadaDurBloque",Number(e.target.value))} style={{ width:"100%", border:`1.5px solid ${BD}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:"inherit", background:"#fff", boxSizing:"border-box" }}>
              {[30,35,40,45,50,55,60,80,90].map(n=><option key={n} value={n}>{n} min</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:GR, textTransform:"uppercase", marginBottom:6 }}>Duración recreo (min)</div>
            <select value={form.jornadaDurRecreo||10} onChange={e=>set("jornadaDurRecreo",Number(e.target.value))} style={{ width:"100%", border:`1.5px solid ${BD}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:"inherit", background:"#fff", boxSizing:"border-box" }}>
              {[0,5,10,15,20,25,30].map(n=><option key={n} value={n}>{n === 0 ? "Sin recreo" : `${n} min`}</option>)}
            </select>
          </div>
        </div>
        {/* Preview de la jornada */}
        {(() => {
          const entrada = form.jornadaEntrada || "08:00";
          const durBloque = form.jornadaDurBloque || 50;
          const durRecreo = form.jornadaDurRecreo ?? 10;
          const bloques = form.jornadaBloques || 4;
          const [h, m] = entrada.split(":").map(Number);
          let mins = h * 60 + m;
          const fmt = t => `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;
          const items = [];
          for (let i = 0; i < bloques; i++) {
            items.push(`${fmt(mins)}–${fmt(mins+durBloque)} · Bloque ${i+1}`);
            mins += durBloque;
            if (durRecreo > 0 && i < bloques - 1) { items.push(`${fmt(mins)}–${fmt(mins+durRecreo)} · Recreo`); mins += durRecreo; }
          }
          return (
            <div style={{ background:"#f8fafc", borderRadius:8, padding:"8px 10px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:GR, marginBottom:6, textTransform:"uppercase" }}>Vista previa</div>
              {items.map((it,i) => <div key={i} style={{ fontSize:12, color: it.includes("Recreo") ? G : TX, fontWeight: it.includes("Recreo") ? 600 : 400, marginBottom:2 }}>{it.includes("Recreo") ? "☕ " : "📚 "}{it}</div>)}
              <div style={{ fontSize:11, color:GL, marginTop:4 }}>Salida: {fmt(mins)}</div>
            </div>
          );
        })()}
      </div>

      {/* Equipo directivo */}
      <div style={{ background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"12px 14px",marginBottom:14 }}>
        <div style={{ fontWeight:700,fontSize:13,color:TX,marginBottom:10 }}>👤 Director/a</div>
        <Fld label="Nombre completo" value={form.director||""} onChange={v=>set("director",v)} placeholder="Apellido, Nombre" />
        <Fld label="Teléfono" value={form.telefonoDirector||""} onChange={v=>set("telefonoDirector",v)} placeholder="11-xxxx-xxxx" />
        <Fld label="Mail" value={form.mailDirector||""} onChange={v=>set("mailDirector",v)} placeholder="director@escuela.edu.ar" />
      </div>
      <div style={{ background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"12px 14px",marginBottom:14 }}>
        <div style={{ fontWeight:700,fontSize:13,color:TX,marginBottom:10 }}>👤 Vicedirector/a</div>
        <Fld label="Nombre completo" value={form.vicedirector||""} onChange={v=>set("vicedirector",v)} placeholder="Apellido, Nombre" />
        <Fld label="Teléfono" value={form.telefonoVicedirector||""} onChange={v=>set("telefonoVicedirector",v)} placeholder="11-xxxx-xxxx" />
        <Fld label="Mail" value={form.mailVicedirector||""} onChange={v=>set("mailVicedirector",v)} placeholder="vice@escuela.edu.ar" />
      </div>

      {/* Tabs turnos */}
      <div style={{ display:'flex', gap:0, borderRadius:10, overflow:'hidden', border:`1.5px solid ${BD}`, marginBottom:10 }}>
        {[['mañana','☀️ Mañana'],['tarde','🌙 Tarde']].map(([k,l])=>(
          <button key={k} onClick={()=>setTurnoTab(k)} style={{ flex:1,padding:'10px',border:'none',background:turnoTab===k?(form.color||G):'#fff',color:turnoTab===k?'#fff':TX,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>{l}</button>
        ))}
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, cursor:'pointer' }}>
        <input type="checkbox" checked={mismoPersonal} onChange={e=>{
          const v = e.target.checked;
          setMismoPersonal(v);
          if (v) setForm(p=>({...p, turnoTarde:{...p.turnoDia}}));
        }} style={{ width:16, height:16 }} />
        <span style={{ fontSize:13, fontWeight:600, color:GR }}>Mismo personal en ambos turnos</span>
      </label>
      {turnoTab==='mañana'
        ? <SeccionTurnoForm label="Turno Mañana" icon="☀️" turno={form.turnoDia} onChange={t=>{
            set('turnoDia', t);
            if (mismoPersonal) set('turnoTarde', t);
          }} />
        : mismoPersonal
          ? <div style={{ textAlign:'center', color:GL, fontSize:13, fontStyle:'italic', padding:'20px 0' }}>Mismo personal que turno mañana</div>
          : <SeccionTurnoForm label="Turno Tarde" icon="🌙" turno={form.turnoTarde} onChange={t=>set('turnoTarde',t)} />
      }

      <div style={{ display:"flex",gap:8 }}>
        <Btn outline onClick={onCancel} color={GR}>Cancelar</Btn>
        <Btn onClick={()=>onSave(form)} color={form.color||G} full disabled={!form.nombre}>Guardar</Btn>
      </div>
    </div>
  );
}

// ── SecEscuelas ───────────────────────────────────────────────
function SecEscuelas({ escuelas, alumnos, docentes, onSave, onDelete, onToggleActivo, onArchivarAlumnos }) {
  const [form, setForm] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [verArch, setVerArch] = useState(false);
  const activas = escuelas.filter(e => !e.eliminado && (verArch ? e.activo === false : e.activo !== false));

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
      onArchivarAlumnos={onArchivarAlumnos}
      onDelete={onDelete}
      onBack={()=>setFicha(null)}
    />
  );

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <button onClick={()=>setForm("nueva")} style={{ flex:1,padding:13,borderRadius:14,border:"none",background:G,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 8px rgba(45,106,79,.35)" }}>+ Nueva escuela</button>
        <button onClick={()=>setVerArch(v=>!v)} style={{ padding:"13px 14px",borderRadius:14,border:"2px solid",borderColor:verArch?"#94a3b8":BD,background:verArch?"#f1f5f9":"#fff",color:"#94a3b8",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>
          {verArch?"✅ Activas":"📦 Arch."}
        </button>
      </div>
      {activas.length===0
        ? <div onClick={verArch ? undefined : ()=>setForm("nueva")}
            style={{ textAlign:"center",padding:40,borderRadius:16,border:`2px dashed ${G}`,background:"#f0fdf4",cursor:verArch?"default":"pointer" }}>
            <div style={{ fontSize:40,marginBottom:10 }}>🏫</div>
            <div style={{ color:verArch?GR:G,fontWeight:700,fontSize:15 }}>{verArch?"Sin escuelas archivadas":"Sin escuelas — tocá para agregar"}</div>
            {!verArch && <div style={{ color:GL,fontSize:12,marginTop:6 }}>+ Nueva escuela</div>}
          </div>
        : activas.map(e=>{
            const aluCount = alumnos.filter(a=>a.escuelaId===e.id&&!a.eliminado&&(verArch?a.activo===false:a.activo!==false)).length;
            return (
              <Card key={e.id} onClick={()=>setFicha(e)} sx={{ borderLeft:`4px solid ${verArch?"#cbd5e0":e.color||G}`,opacity:verArch?.75:1,cursor:"pointer" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    {verArch && <div style={{ fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",marginBottom:3 }}>📦 Archivada</div>}
                    <div style={{ fontWeight:800,fontSize:16,color:TX }}>{e.nombre}</div>
                    <div style={{ fontSize:12,color:GR,marginTop:2 }}>{e.nivel}{e.direccion?` · ${e.direccion}`:""}</div>
                    <div style={{ fontSize:12,color:GL,marginTop:2 }}>👤 {aluCount} alumnos archivados{e.director?` · ${e.director}`:""}</div>
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
function FichaDocente({ docente, escuelas, alumnos, onEditar, onDelete, onToggleActivo, onBack }) {
  const [conf, setConf] = useState(null);
  const esc = escuelas.find(e=>e.id===docente.escuelaId);
  const ec = esc?.color || G;
  const inact = docente.activo === false;
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
        {inact
          ? <button onClick={()=>setConf({ msg:`¿Reactivar a ${docente.nombre}?`, ok:()=>{ onToggleActivo(docente.id); setConf(null); onBack(); } })}
              style={{ flex:1,background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:G }}>
              ▶ Reactivar
            </button>
          : <button onClick={()=>setConf({ msg:`¿Archivar a ${docente.nombre}? Dejará de aparecer en la lista activa.`, ok:()=>{ onToggleActivo(docente.id); setConf(null); onBack(); } })}
              style={{ flex:1,background:"#fff",border:`1.5px solid ${BD}`,borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:GR }}>
              📦 Archivar
            </button>
        }
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
function SecDocentes({ docentes, escuelas, alumnos, onSave, onDelete, onToggleActivo }) {
  const [form, setForm] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [busq, setBusq] = useState("");
  const [filEsc, setFilEsc] = useState("");
  const [verArch, setVerArch] = useState(false);
  const activos = docentes.filter(d => !d.eliminado && (verArch ? d.activo === false : d.activo !== false));
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
      onToggleActivo={id=>{ onToggleActivo(id); setFicha(null); }}
      onBack={()=>setFicha(null)}
    />
  );

  return (
    <div>
      <button onClick={()=>setForm({id:uid(),nombre:"",materia:"",escuelaId:"",telefono:"",mail:"",eliminado:false})}
        style={{ width:"100%",padding:13,borderRadius:14,border:"none",background:G,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginBottom:12,boxShadow:"0 2px 8px rgba(45,106,79,.35)" }}>
        + Nuevo docente
      </button>

      <div style={{ display:"flex",gap:8,marginBottom:8,alignItems:"center" }}>
        <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="🔍 Buscar por nombre o materia..."
          style={{ flex:1,border:`1.5px solid ${BD}`,borderRadius:10,padding:"9px 14px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }} />
        <button onClick={()=>setVerArch(v=>!v)} style={{ padding:"9px 12px",borderRadius:10,border:"2px solid",borderColor:verArch?"#94a3b8":BD,background:verArch?"#f1f5f9":"#fff",color:"#94a3b8",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>
          {verArch?"✅ Activos":"📦 Arch."}
        </button>
      </div>
      {!verArch && escuelas.filter(e=>!e.eliminado&&e.activo!==false).length>1 && (
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
          <button onClick={()=>setFilEsc("")} style={{ padding:"6px 12px",borderRadius:20,border:"2px solid",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer",borderColor:!filEsc?G:BD,background:!filEsc?G:"#fff",color:!filEsc?"#fff":"#475569",whiteSpace:"nowrap" }}>Todas</button>
          {escuelas.filter(e=>!e.eliminado&&e.activo!==false).map(e=>(
            <button key={e.id} onClick={()=>setFilEsc(filEsc===e.id?"":e.id)}
              style={{ padding:"6px 12px",borderRadius:20,border:"2px solid",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer",borderColor:filEsc===e.id?(e.color||G):BD,background:filEsc===e.id?(e.color||G):"#fff",color:filEsc===e.id?"#fff":"#475569",whiteSpace:"nowrap" }}>
              {e.nombre}
            </button>
          ))}
        </div>
      )}

      {filtrados.length===0
        ? <div onClick={(!verArch && activos.length===0) ? ()=>setForm({id:uid(),nombre:"",materia:"",escuelaId:"",telefono:"",mail:"",eliminado:false}) : undefined}
            style={{ textAlign:"center",padding:40,borderRadius:16,border:`2px dashed ${G}`,background:"#f0fdf4",cursor:(!verArch&&activos.length===0)?"pointer":"default" }}>
            <div style={{ fontSize:40,marginBottom:10 }}>👩‍🏫</div>
            <div style={{ color:(!verArch&&activos.length===0)?G:GR,fontWeight:700,fontSize:15 }}>
              {verArch?"Sin docentes archivados":activos.length===0?"Sin docentes — tocá para agregar":"Sin resultados."}
            </div>
            {!verArch && activos.length===0 && <div style={{ color:GL,fontSize:12,marginTop:6 }}>+ Nuevo docente</div>}
          </div>
        : filtrados.map(d=>{
            const esc = escuelas.find(e=>e.id===d.escuelaId);
            return (
              <Card key={d.id} onClick={()=>setFicha(d)} sx={{ borderLeft:`4px solid ${verArch?"#cbd5e0":esc?.color||G}`,opacity:verArch?.75:1,cursor:"pointer" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    {verArch && <div style={{ fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",marginBottom:3 }}>📦 Archivado/a</div>}
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
// Vista agregada: lee las terapias de todos los alumnos.
// No tiene formulario propio — los profesionales se cargan desde el alumno.
function SecProfesionales({ alumnos }) {
  const [busq, setBusq] = useState('');

  // Agrupar por nombre+teléfono para deduplicar
  const mapa = {};
  (alumnos || []).filter(a => !a.eliminado && a.activo !== false).forEach(a => {
    (a.terapias || []).filter(t => t.profesional).forEach(t => {
      const key = `${t.profesional.trim().toLowerCase()}||${t.telefono||''}`;
      if (!mapa[key]) mapa[key] = { nombre:t.profesional, especialidad:t.nombre||'', telefono:t.telefono||'', alumnos:[] };
      mapa[key].alumnos.push({ nombre:a.nombre, frecuencia:t.frecuencia||'' });
    });
  });
  const lista = Object.values(mapa).sort((a,b) => a.nombre.localeCompare(b.nombre));

  const filtrados = busq
    ? lista.filter(p => {
        const q = busq.toLowerCase();
        return p.nombre.toLowerCase().includes(q)
          || p.especialidad.toLowerCase().includes(q)
          || p.alumnos.some(a => a.nombre.toLowerCase().includes(q));
      })
    : lista;

  return (
    <div>
      <div style={{ fontSize:12, color:GL, marginBottom:10 }}>
        Los profesionales se cargan desde las terapias de cada alumno.
      </div>
      <input
        value={busq} onChange={e=>setBusq(e.target.value)}
        placeholder="🔍 Buscar por nombre, especialidad o alumno..."
        style={{ width:'100%', border:`1.5px solid ${BD}`, borderRadius:10, padding:'9px 14px', fontSize:13, fontFamily:'inherit', boxSizing:'border-box', marginBottom:12 }}
      />
      {filtrados.length === 0
        ? <Card sx={{ textAlign:'center', padding:32, color:GR }}>
            {lista.length === 0 ? 'Todavía no hay profesionales cargados en las terapias de los alumnos.' : 'Sin resultados.'}
          </Card>
        : filtrados.map((p, idx) => (
            <Card key={idx} sx={{ borderLeft:'4px solid #7c3aed' }}>
              <div style={{ fontWeight:800, fontSize:15, color:TX }}>{p.nombre}</div>
              {p.especialidad && <div style={{ fontSize:12, color:'#7c3aed', fontWeight:700, marginTop:2 }}>{p.especialidad}</div>}
              <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                {p.telefono && <WA tel={p.telefono} />}
              </div>
              {p.alumnos.length > 0 && (
                <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${BD}` }}>
                  {p.alumnos.map((a, i) => (
                    <div key={i} style={{ fontSize:12, color:GR, marginBottom:2 }}>
                      👤 {a.nombre}{a.frecuencia ? <span style={{ color:GL }}> · {a.frecuencia}</span> : ''}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
      }
    </div>
  );
}

// ── Directorio principal ──────────────────────────────────────
export default function Directorio({ alumnos, escuelas, docentes, onVer, saveEsc, delEsc, saveDoc, delDoc, toggleActivoEsc, toggleActivoDoc, archivarAlumnosEsc }) {
  const [seccion, setSeccion] = useState("escuelas");
  const SECS = [
    { id:"escuelas", icon:"🏫", label:"Escuelas"      },
    { id:"docentes", icon:"👩‍🏫", label:"Docentes"      },
    { id:"pros",     icon:"🔬", label:"Profesionales" },
  ];
  return (
    <div>
      <div style={{ background:`linear-gradient(135deg,${GD},${GD}ee)`,padding:"16px 20px 0",color:"#fff" }}>
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
        {seccion==="escuelas" && <SecEscuelas escuelas={escuelas} alumnos={alumnos} docentes={docentes} onSave={saveEsc} onDelete={delEsc} onToggleActivo={toggleActivoEsc} onArchivarAlumnos={archivarAlumnosEsc} />}
        {seccion==="docentes" && <SecDocentes docentes={docentes} escuelas={escuelas} alumnos={alumnos} onSave={saveDoc} onDelete={delDoc} onToggleActivo={toggleActivoDoc} />}
        {seccion==="pros"     && <SecProfesionales alumnos={alumnos} />}
      </div>
    </div>
  );
}
