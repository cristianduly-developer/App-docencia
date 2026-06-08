import React, { useRef, useEffect } from 'react';
import { G, GR, GL, BD, TX, DIAS_L } from '../../constants';
import { hMin, hoy } from '../../utils/helpers';
import { Tag, Avatar, Card, SecT } from '../ui';

function BadgeAusentismo({ alumnoId, mapaFaltas }) {
  const n = mapaFaltas?.[alumnoId] || 0;
  if (n < 3) return null;
  if (n <= 4) return <span style={{background:"#FEF3C7",color:"#D97706",padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:800,display:"inline-flex",alignItems:"center",gap:3}}>⚠️ {n} faltas</span>;
  return <span style={{background:"#FEE2E2",color:"#DC2626",padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:800,display:"inline-flex",alignItems:"center",gap:3}}>🚨 {n} faltas</span>;
}

function IndicadoresMapa({ alumnosHoy, registros, hoyStr }) {
  const programados = alumnosHoy.length;
  const ausentes = alumnosHoy.filter(a => (registros[a.id]||[]).some(r => r.fecha===hoyStr && r.tipo==="ausencia_total" && !r.eliminado)).length;
  const presentes = Math.max(0, programados - ausentes);
  return (
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {[
        {label:"Programados",valor:programados,bg:"#f8fafc",bo:"#e2e8f0",tx:"#334155",lc:"#64748b"},
        {label:"Presentes",  valor:presentes,  bg:"#ecfdf5",bo:"#a7f3d0",tx:"#059669",lc:"#065f46"},
        {label:"Ausentes",   valor:ausentes,   bg:"#fef2f2",bo:"#fca5a5",tx:"#dc2626",lc:"#991b1b"},
      ].map(({label,valor,bg,bo,tx,lc})=>(
        <div key={label} style={{flex:1,background:bg,border:`1px solid ${bo}`,borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
          <div style={{fontSize:10,color:lc,fontWeight:800,letterSpacing:.5}}>{label.toUpperCase()}</div>
          <div style={{fontSize:18,fontWeight:900,color:tx,lineHeight:1.2,marginTop:2}}>{valor}</div>
        </div>
      ))}
    </div>
  );
}

export default function MapaDia({ alumnos, docentes, escuelas, registros, recs, onVerClase, onVerAlumno,
  dia, diaReal, onCambioDia, onVolverAHoy, minActual, fechaHoy,
  onMarcarAusente, onRehabilitarAlumno, ausentismo }) {

  const ahoraRef = useRef(null);
  const ahoraStr = `${String(Math.floor(minActual/60)).padStart(2,"0")}:${String(minActual%60).padStart(2,"0")}`;
  const esHoy = diaReal >= 1 && diaReal <= 5 && dia === diaReal;
  const evs = [];

  alumnos.filter(a=>!a.eliminado&&a.activo!==false).forEach(alumno => {
    const esc = escuelas.find(e=>e.id===alumno.escuelaId);
    (alumno.horarios||[]).filter(h=>h.dia===dia).forEach(h => {
      const doc = h.docenteId ? docentes.find(d=>d.id===h.docenteId) : null;
      const regHoy = (registros[alumno.id]||[]).find(r=>r.fecha===hoy()&&!r.eliminado);
      const ausenteTotal = esHoy && (registros[alumno.id]||[]).some(r=>r.fecha===hoy()&&r.tipo==="ausencia_total"&&!r.eliminado);
      const cur = !ausenteTotal && esHoy && hMin(h.horaInicio)<=minActual && minActual<hMin(h.horaFin);
      const alertaAlta = (recs||[]).find(r=>r.alumnoId===alumno.id&&r.prioridad==="alta"&&!r.eliminado)?.texto||null;
      evs.push({
        alumnoId:alumno.id, alumnoNombre:alumno.nombre,
        horaInicio:h.horaInicio, horaFin:h.horaFin,
        materia:h.esRecreo?"☕ Recreo":(doc?.materia||""),
        docenteNombre:doc?.nombre||"", docenteId:h.docenteId||null,
        aula:h.aula, color:esc?.color||G,
        nivel:esc?.nivel==="Primaria"?"PRI":esc?.nivel==="Inicial"?"INI":"SEC",
        esRecreo:h.esRecreo||false,
        asist:regHoy?.asistencia||null, cur, alertaAlta, ausenteTotal,
      });
    });
  });
  evs.sort((a,b)=>hMin(a.horaInicio)-hMin(b.horaInicio));

  const DIAS_HAB = [1,2,3,4,5];
  const evsFiltrados = evs.filter(ev=>!ev.ausenteTotal);
  const primerFutIdx = esHoy ? evsFiltrados.findIndex(ev=>hMin(ev.horaFin)>minActual) : -1;
  const hayCur = esHoy && evsFiltrados.some(ev=>ev.cur);

  useEffect(()=>{
    if(esHoy && ahoraRef.current) ahoraRef.current.scrollIntoView({behavior:"smooth",block:"center"});
  },[dia]);

  return (
    <div style={{padding:"16px 16px 0"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a202c,#2d3748)",borderRadius:20,padding:20,marginBottom:16,color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={()=>onCambioDia&&onCambioDia(DIAS_HAB[Math.max(0,DIAS_HAB.indexOf(dia)-1)])} disabled={dia===1}
            style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:10,color:dia===1?"rgba(255,255,255,.3)":"#fff",width:36,height:36,fontSize:20,cursor:dia===1?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{esHoy?"Hoy en vivo":"Semana"}</div>
            <div style={{fontSize:26,fontWeight:800}}>{DIAS_L[dia]}</div>
            {esHoy&&fechaHoy&&<div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:1,fontStyle:"italic"}}>{fechaHoy}</div>}
            <div style={{fontSize:13,color:"#94a3b8",marginTop:2}}>
              {esHoy?`🕐 ${ahoraStr} · ${evs.length} bloques`:`${evs.length} bloques programados`}
            </div>
          </div>
          <button onClick={()=>onCambioDia&&onCambioDia(DIAS_HAB[Math.min(4,DIAS_HAB.indexOf(dia)+1)])} disabled={dia===5}
            style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:10,color:dia===5?"rgba(255,255,255,.3)":"#fff",width:36,height:36,fontSize:20,cursor:dia===5?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:10}}>
          {DIAS_HAB.map(d=>(
            <button key={d} onClick={()=>onCambioDia&&onCambioDia(d)} style={{padding:"5px 10px",borderRadius:20,border:"none",fontFamily:"inherit",background:d===dia?"#fff":(d===diaReal?"rgba(255,255,255,.25)":"rgba(255,255,255,.1)"),color:d===dia?"#1a202c":(d===diaReal?"#fff":"rgba(255,255,255,.55)"),fontWeight:d===dia||d===diaReal?800:600,fontSize:12,cursor:"pointer",position:"relative"}}>
              {DIAS_L[d].slice(0,3)}
              {d===diaReal&&d!==dia&&<span style={{position:"absolute",top:1,right:2,width:5,height:5,borderRadius:"50%",background:"#f59e0b"}}/>}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {esHoy&&<div style={{fontSize:10,color:"rgba(255,255,255,.4)",display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
            Se actualiza automáticamente cada minuto
          </div>}
          {onVolverAHoy
            ? <button onClick={onVolverAHoy} style={{background:"#f59e0b",border:"none",borderRadius:20,color:"#fff",padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Resumen</button>
            : !esHoy&&onCambioDia&&<button onClick={()=>onCambioDia(diaReal||1)} style={{background:"#f59e0b",border:"none",borderRadius:20,color:"#fff",padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>● Volver a hoy</button>
          }
        </div>
      </div>

      {/* Alertas del día */}
      {esHoy&&(recs||[]).filter(r=>!r.eliminado&&(!r.fecha||r.fecha===hoy())).length>0&&(
        <div style={{marginBottom:12}}>
          {(recs||[]).filter(r=>!r.eliminado&&(!r.fecha||r.fecha===hoy()))
            .sort((a,b)=>({alta:0,media:1,baja:2})[a.prioridad]-({alta:0,media:1,baja:2})[b.prioridad])
            .map(r=>{
              const p={alta:{bg:"#fef2f2",bo:"#fca5a5",tx:"#dc2626",ic:"🔴"},media:{bg:"#fffbeb",bo:"#fcd34d",tx:"#d97706",ic:"🟡"},baja:{bg:"#f0fdf4",bo:"#86efac",tx:"#16a34a",ic:"🟢"}}[r.prioridad]||{bg:"#fffbeb",bo:"#fcd34d",tx:"#d97706",ic:"🟡"};
              const alu=alumnos.find(a=>a.id===r.alumnoId);
              return <div key={r.id} style={{background:p.bg,border:`1.5px solid ${p.bo}`,borderRadius:12,padding:"10px 14px",marginBottom:6,display:"flex",alignItems:"flex-start",gap:10}}>
                <span style={{fontSize:16,flexShrink:0}}>{p.ic}</span>
                <div><div style={{fontWeight:700,fontSize:13,color:p.tx}}>{r.texto}</div>{alu&&<div style={{fontSize:11,color:GR,marginTop:2}}>👤 {alu.nombre}</div>}</div>
              </div>;
            })}
        </div>
      )}

      {/* Indicadores presentes/ausentes */}
      {esHoy && evs.length>0 && (()=>{
        const unicos = [...new Map(evs.filter(e=>!e.esRecreo).map(e=>[e.alumnoId,{id:e.alumnoId}])).values()];
        return <IndicadoresMapa alumnosHoy={unicos} registros={registros} hoyStr={hoy()}/>;
      })()}

      {/* Alertas ausentismo mensual */}
      {esHoy && ausentismo?.alertasSistemicas?.length>0 && (
        <div style={{marginBottom:12}}>
          {ausentismo.alertasSistemicas.map(a=>(
            <div key={a.id} style={{background:a.color==="rojo"?"#fef2f2":"#fffbeb",border:`1.5px solid ${a.color==="rojo"?"#fca5a5":"#fcd34d"}`,borderRadius:12,padding:"9px 14px",marginBottom:6,fontSize:12,fontWeight:600,color:a.color==="rojo"?"#dc2626":"#d97706"}}>
              {a.texto}
            </div>
          ))}
        </div>
      )}

      {/* Ausentes hoy */}
      {esHoy && (()=>{
        const ausentes = [...new Map(evs.filter(ev=>ev.ausenteTotal&&!ev.esRecreo).map(ev=>[ev.alumnoId,ev])).values()];
        if (ausentes.length === 0) return null;
        return <div style={{marginBottom:12}}>
          <SecT text={`🚫 Ausentes hoy (${ausentes.length})`}/>
          {ausentes.map(ev => {
            const alu = alumnos.find(a=>a.id===ev.alumnoId);
            const tutor = (alu?.tutores||[]).find(t=>t.principal)||(alu?.tutores||[])[0];
            const telLimpio = (tutor?.telefono||'').replace(/[^0-9]/g,'');
            const telWA = telLimpio.startsWith('54') ? telLimpio : telLimpio ? '54'+telLimpio : null;
            const msgWA = encodeURIComponent(`Hola ${tutor?.nombre||''}! Te contacto porque ${alu?.nombre||'el/la alumno/a'} no vino al colegio hoy. ¿Está todo bien? 🙏`);
            return <div key={ev.alumnoId} style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:14,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
              <Avatar nombre={ev.alumnoNombre} size={36} bg="#dc2626"/>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:14,color:"#dc2626"}}>{ev.alumnoNombre}</div>
                {tutor?.nombre&&<div style={{fontSize:11,color:"#ef4444",marginTop:2}}>👤 {tutor.nombre} · {tutor.relacion}</div>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {telWA&&<a href={`https://wa.me/${telWA}?text=${msgWA}`} target="_blank" rel="noreferrer"
                  style={{background:"#dcfce7",border:"1.5px solid #86efac",borderRadius:8,color:"#16a34a",fontSize:11,fontWeight:700,padding:"4px 8px",textDecoration:"none"}}>📱 WA</a>}
                <button onClick={e=>{e.stopPropagation();onRehabilitarAlumno(ev.alumnoId,hoy());}}
                  style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:8,color:"#16a34a",fontSize:11,fontWeight:700,padding:"4px 8px",cursor:"pointer",fontFamily:"inherit"}}>✓ Presente</button>
              </div>
            </div>;
          })}
        </div>;
      })()}

      {/* Lista de bloques */}
      {evs.length===0
        ? <Card sx={{textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:8}}>📅</div><div style={{fontWeight:700}}>Sin clases el {DIAS_L[dia]}</div></Card>
        : evsFiltrados.map((ev,i) => {
            const past = esHoy && hMin(ev.horaFin)<=minActual;
            const esRef = esHoy && (ev.cur || (!hayCur && i===primerFutIdx));
            return <div key={i} ref={esRef?ahoraRef:null}>
              {esRef && <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,marginTop:i>0?4:0}}>
                <div style={{flex:1,height:2,background:"#f59e0b",borderRadius:2}}/>
                <span style={{background:"#f59e0b",color:"#fff",borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:800}}>● AHORA {ahoraStr}</span>
                <div style={{flex:1,height:2,background:"#f59e0b",borderRadius:2}}/>
              </div>}
              <div onClick={()=>!ev.esRecreo&&onVerClase(ev)} style={{cursor:ev.esRecreo?"default":"pointer"}}>
                <div style={{display:"flex",gap:12,marginBottom:8,alignItems:"stretch"}}>
                  <div style={{minWidth:54,textAlign:"right",paddingTop:16,fontSize:12,fontWeight:700,color:ev.cur?G:GL}}>
                    <div>{ev.horaInicio}</div><div style={{fontSize:10,marginTop:2}}>{ev.horaFin}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div style={{width:12,height:12,borderRadius:"50%",marginTop:18,flexShrink:0,background:ev.cur?G:(past?"#e2e8f0":ev.color),border:ev.cur?"3px solid #b7e4c7":"none"}}/>
                    {i<evsFiltrados.length-1&&<div style={{width:2,flex:1,background:BD,minHeight:16}}/>}
                  </div>
                  <div style={{flex:1,background:ev.cur?"#f0fdf4":(past?"#fafafa":"#fff"),borderRadius:14,borderLeft:ev.cur?"4px solid "+G:(past?"4px solid #e2e8f0":"4px solid transparent"),padding:"12px 14px",marginBottom:4,opacity:past?.55:1}}>
                    {ev.esRecreo
                      ? <div style={{color:GR,fontWeight:600,fontSize:14}}>☕ Recreo · {ev.aula}</div>
                      : <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:800,fontSize:17,color:TX}}>{ev.materia}</div>
                            <div style={{fontSize:14,fontWeight:700,color:ev.cur?G:"#334155",marginTop:3}}>{ev.alumnoNombre}</div>
                            <div style={{fontSize:11,color:GL,marginTop:3}}>{ev.docenteNombre&&`👤 ${ev.docenteNombre}`}{ev.docenteNombre&&" · "}{ev.aula}</div>
                            {ev.alertaAlta&&<div style={{marginTop:6,background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,padding:"3px 8px",fontSize:11,fontWeight:700,color:"#dc2626",display:"inline-flex",alignItems:"center",gap:4}}>🔴 {ev.alertaAlta.slice(0,50)}{ev.alertaAlta.length>50?"...":""}</div>}
                            {ausentismo&&<div style={{marginTop:4}}><BadgeAusentismo alumnoId={ev.alumnoId} mapaFaltas={ausentismo.faltasPorAlumno}/></div>}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                            <Tag text={ev.nivel} bg={ev.color}/>
                            {ev.asist&&<Tag text={ev.asist==="presente"?"✓":ev.asist==="ausente"?"✗ Ausente":ev.asist} bg={ev.asist==="presente"?G:ev.asist==="ausente"?"#dc2626":"#f59e0b"}/>}
                            {ev.cur&&<Tag text="● Ahora" bg="#f59e0b"/>}
                            {esHoy&&onMarcarAusente&&!ev.ausenteTotal&&(
                              <button onClick={e=>{e.stopPropagation();onMarcarAusente(ev.alumnoId,hoy());}}
                                style={{marginTop:4,background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,color:"#dc2626",fontSize:10,fontWeight:800,padding:"3px 8px",cursor:"pointer",fontFamily:"inherit"}}>🚫 Ausente</button>
                            )}
                          </div>
                        </div>
                    }
                  </div>
                </div>
              </div>
            </div>;
          })}
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );
}
