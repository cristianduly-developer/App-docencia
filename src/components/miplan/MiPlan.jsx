import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { LIMITE_ALUMNOS } from '../../constants';

export default function MiPlan({ alumnos }) {
  const { planDocente } = useAppContext();
  const plan   = planDocente || 'basico';
  const limite = LIMITE_ALUMNOS[plan] ?? 15;
  const activos = alumnos.filter(a => !a.eliminado && a.activo !== false).length;
  const pct = limite === Infinity ? 0 : Math.min(100, Math.round(activos / limite * 100));

  const PLAN_META = {
    basico:      { label:'Básico',      color:'#6b7280', bg:'#f8fafc' },
    profesional: { label:'Profesional', color:'#4f46e5', bg:'#f5f3ff' },
    premium:     { label:'Premium',     color:'#d97706', bg:'#fffbeb' },
  };
  const meta = PLAN_META[plan] || PLAN_META.basico;

  return (
    <div style={{ padding:"4px 0 24px" }}>
      {/* Tarjeta plan actual */}
      <div style={{ background:meta.bg, border:`2px solid ${meta.color}`,
        borderRadius:16, padding:"18px 20px", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:meta.color,
          textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>Tu plan actual</div>
        <div style={{ fontSize:24, fontWeight:900, color:meta.color, marginBottom:12 }}>
          {meta.label}
        </div>

        {/* Barra alumnos */}
        <div style={{ marginBottom:4 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12,
            fontWeight:700, color:"#1a202c", marginBottom:6 }}>
            <span>👤 Alumnos activos</span>
            <span style={{ color:activos >= limite ? '#dc2626' : meta.color }}>
              {activos} / {limite === Infinity ? '∞' : limite}
            </span>
          </div>
          {limite !== Infinity && (
            <div style={{ background:"#e2e8f0", borderRadius:99, height:8, overflow:"hidden" }}>
              <div style={{
                width:`${pct}%`, height:"100%", borderRadius:99,
                background: pct >= 100 ? "#dc2626" : pct >= 80 ? "#f59e0b" : meta.color,
                transition:"width .4s",
              }}/>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14,
        padding:"16px 20px", marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#64748b",
          textTransform:"uppercase", marginBottom:12 }}>Incluido en tu plan</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:16 }}>👤</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#1a202c" }}>
              {limite === Infinity ? "Alumnos ilimitados" : `Hasta ${limite} alumnos activos`}
            </span>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:16 }}>{plan === 'basico' ? '🔒' : '🤖'}</span>
            <span style={{ fontSize:13, fontWeight:600,
              color:plan === 'basico' ? "#94a3b8" : "#1a202c" }}>
              Co-Piloto IA {plan === 'basico' ? "(no incluido)" : "incluido"}
            </span>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:16 }}>📄</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#1a202c" }}>
              Informes y PDFs incluidos
            </span>
          </div>
        </div>
      </div>

      {plan === 'basico' && (
        <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:12,
          padding:"14px 16px", fontSize:13, color:"#1e40af", fontWeight:600, lineHeight:1.5 }}>
          💡 Actualizá a <b>Profesional</b> para tener Co-Piloto IA y hasta 25 alumnos,
          o a <b>Premium</b> para alumnos ilimitados.
        </div>
      )}
      {plan === 'profesional' && (
        <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:12,
          padding:"14px 16px", fontSize:13, color:"#1e40af", fontWeight:600, lineHeight:1.5 }}>
          💡 Actualizá a <b>Premium</b> para tener alumnos ilimitados.
        </div>
      )}
    </div>
  );
}
