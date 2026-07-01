import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LIMITE_ALUMNOS } from '../../constants';

const PLANES_META = {
  basico:      { label:'Básico',      alumnos:'15 alumnos',  ia:false, color:'#6b7280' },
  profesional: { label:'Profesional', alumnos:'25 alumnos',  ia:true,  color:'#4f46e5' },
  premium:     { label:'Premium',     alumnos:'Ilimitados',  ia:true,  color:'#d97706' },
};
function formatPrecio(n) { return '$' + Number(n).toLocaleString('es-AR'); }

const PLAN_META = {
  basico:      { label:'Básico',      color:'#6b7280', bg:'#f8fafc' },
  profesional: { label:'Profesional', color:'#4f46e5', bg:'#f5f3ff' },
  premium:     { label:'Premium',     color:'#d97706', bg:'#fffbeb' },
};

export default function MiPlan({ alumnos, usuario, onActualizarUsuario }) {
  const { planDocente } = useAppContext();
  const plan    = planDocente || 'basico';
  const limite  = LIMITE_ALUMNOS[plan] ?? 15;
  const activos = alumnos.filter(a => !a.eliminado && a.activo !== false).length;
  const pct     = limite === Infinity ? 0 : Math.min(100, Math.round(activos / limite * 100));
  const meta    = PLAN_META[plan] || PLAN_META.basico;

  const acceso  = usuario?.acceso || {};
  const fechaFin = acceso.fechaFin ? new Date(acceso.fechaFin) : null;
  const tieneMP  = !!acceso.mpPreapprovalId;

  const [planesDB,        setPlanesDB]        = useState([]);
  const [vistaUpgrade,    setVistaUpgrade]    = useState(false);
  const [planUpgradeSel,  setPlanUpgradeSel]  = useState('premium');
  const [cargandoUpgrade, setCargandoUpgrade] = useState(false);
  const [cargandoCancel,  setCargandoCancel]  = useState(false);
  const [errorMsg,        setErrorMsg]        = useState('');
  const [confirmarCancel, setConfirmarCancel] = useState(false);

  useEffect(() => {
    fetch('/api/planes-precios')
      .then(r => r.json())
      .then(data => {
        if (data.planes?.length) {
          const ordenados = ['basico', 'profesional', 'premium']
            .map(id => {
              const row = data.planes.find(p => p.plan === id);
              if (!row) return null;
              const meta = PLANES_META[id] || { label: id, alumnos: '', ia: false, color: '#6b7280' };
              return { id, ...meta, precio: formatPrecio(row.precio_mensual) };
            })
            .filter(Boolean);
          setPlanesDB(ordenados);
        }
      })
      .catch(() => {});
  }, []);

  async function iniciarUpgrade() {
    setCargandoUpgrade(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/mp-crear-suscripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planUpgradeSel }),
      });
      const data = await res.json();
      if (!res.ok || !data.init_point) {
        setErrorMsg(data.error || 'Error al iniciar el pago. Intentá de nuevo.');
        setCargandoUpgrade(false);
        return;
      }
      window.location.href = data.init_point;
    } catch {
      setErrorMsg('Error de conexión. Intentá de nuevo.');
      setCargandoUpgrade(false);
    }
  }

  async function cancelarSuscripcion() {
    setCargandoCancel(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/mp-cancelar-suscripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Error al cancelar. Intentá de nuevo.');
        setCargandoCancel(false);
        setConfirmarCancel(false);
        return;
      }
      // Actualizar estado local
      if (onActualizarUsuario && usuario) {
        onActualizarUsuario({ ...usuario, acceso: { ...acceso, mpPreapprovalId: null, estado: 'cancelado' } });
      }
      setConfirmarCancel(false);
    } catch {
      setErrorMsg('Error de conexión. Intentá de nuevo.');
    }
    setCargandoCancel(false);
  }

  const planesUpgrade = planesDB.filter(p => p.id !== plan);

  // ── Vista upgrade ──────────────────────────────────────────
  if (vistaUpgrade) {
    return (
      <div style={{ padding:'4px 0 24px' }}>
        <button onClick={() => setVistaUpgrade(false)}
          style={{ background:'none', border:'none', color:'#4f46e5', fontSize:13, fontWeight:700,
            cursor:'pointer', padding:'0 0 16px', display:'flex', alignItems:'center', gap:6 }}>
          ← Volver a Mi plan
        </button>

        <div style={{ fontSize:18, fontWeight:800, color:'#111827', marginBottom:4 }}>Cambiar plan</div>
        <div style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>
          El nuevo plan se activa de inmediato con débito automático mensual.
        </div>

        {planesUpgrade.map(p => (
          <div key={p.id} onClick={() => setPlanUpgradeSel(p.id)}
            style={{ background:'#fff', border:`2px solid ${planUpgradeSel===p.id ? p.color : '#e2e8f0'}`,
              borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer',
              display:'flex', alignItems:'center', gap:14,
              boxShadow: planUpgradeSel===p.id ? `0 4px 16px ${p.color}22` : 'none' }}>
            <div style={{ width:20, height:20, borderRadius:'50%',
              border:`2px solid ${planUpgradeSel===p.id ? p.color : '#d1d5db'}`,
              background: planUpgradeSel===p.id ? p.color : '#fff',
              flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {planUpgradeSel===p.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }}/>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span style={{ fontSize:15, fontWeight:800, color:p.color }}>{p.label}</span>
                <span style={{ fontSize:15, fontWeight:800, color:'#111827' }}>{p.precio}<span style={{ fontSize:11, fontWeight:400, color:'#6b7280' }}>/mes</span></span>
              </div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>
                {p.alumnos} · {p.ia ? 'Co-Piloto IA incluido' : 'Sin IA'}
              </div>
            </div>
          </div>
        ))}

        {errorMsg && (
          <div style={{ fontSize:12, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5',
            borderRadius:8, padding:'8px 12px', marginBottom:12 }}>
            {errorMsg}
          </div>
        )}

        <button onClick={iniciarUpgrade} disabled={cargandoUpgrade}
          style={{ width:'100%', padding:'14px 20px', borderRadius:14, border:'none',
            background: cargandoUpgrade ? '#d1d5db' : '#4f46e5',
            color:'#fff', fontSize:14, fontWeight:800, cursor: cargandoUpgrade ? 'default' : 'pointer',
            boxShadow: cargandoUpgrade ? 'none' : '0 4px 20px #4f46e544' }}>
          {cargandoUpgrade ? 'Redirigiendo a Mercado Pago...' : `Suscribirme al plan ${planesDB.find(p=>p.id===planUpgradeSel)?.label || planUpgradeSel}`}
        </button>
      </div>
    );
  }

  // ── Vista principal ────────────────────────────────────────
  return (
    <div style={{ padding:'4px 0 24px' }}>
      {/* Tarjeta plan actual */}
      <div style={{ background:meta.bg, border:`2px solid ${meta.color}`,
        borderRadius:16, padding:'18px 20px', marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:meta.color,
          textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>Tu plan actual</div>
        <div style={{ fontSize:24, fontWeight:900, color:meta.color, marginBottom:12 }}>
          {meta.label}
        </div>

        {/* Barra alumnos */}
        <div style={{ marginBottom:fechaFin ? 12 : 0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12,
            fontWeight:700, color:'#1a202c', marginBottom:6 }}>
            <span>👤 Alumnos activos</span>
            <span style={{ color:activos >= limite ? '#dc2626' : meta.color }}>
              {activos} / {limite === Infinity ? '∞' : limite}
            </span>
          </div>
          {limite !== Infinity && (
            <div style={{ background:'#e2e8f0', borderRadius:99, height:8, overflow:'hidden' }}>
              <div style={{
                width:`${pct}%`, height:'100%', borderRadius:99,
                background: pct >= 100 ? '#dc2626' : pct >= 80 ? '#f59e0b' : meta.color,
                transition:'width .4s',
              }}/>
            </div>
          )}
        </div>

        {/* Fecha de renovación */}
        {fechaFin && (
          <div style={{ fontSize:12, color:'#374151', marginTop:8, paddingTop:8,
            borderTop:'1px solid rgba(0,0,0,.08)' }}>
            🔄 Próxima renovación: <strong>{fechaFin.toLocaleDateString('es-AR')}</strong>
            {acceso.diasRestantes != null && acceso.diasRestantes > 0 && (
              <span style={{ color:'#6b7280' }}> ({acceso.diasRestantes} días)</span>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:14,
        padding:'16px 20px', marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#64748b',
          textTransform:'uppercase', marginBottom:12 }}>Incluido en tu plan</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:16 }}>👤</span>
            <span style={{ fontSize:13, fontWeight:600, color:'#1a202c' }}>
              {limite === Infinity ? 'Alumnos ilimitados' : `Hasta ${limite} alumnos activos`}
            </span>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:16 }}>{plan === 'basico' ? '🔒' : '🤖'}</span>
            <span style={{ fontSize:13, fontWeight:600,
              color:plan === 'basico' ? '#94a3b8' : '#1a202c' }}>
              Co-Piloto IA {plan === 'basico' ? '(no incluido)' : 'incluido'}
            </span>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:16 }}>📄</span>
            <span style={{ fontSize:13, fontWeight:600, color:'#1a202c' }}>
              Informes y PDFs incluidos
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade */}
      {plan !== 'premium' && (
        <button onClick={() => setVistaUpgrade(true)}
          style={{ width:'100%', padding:'13px 20px', borderRadius:12, border:'1.5px solid #4f46e5',
            background:'#eff6ff', color:'#4338ca', fontSize:13, fontWeight:700, cursor:'pointer',
            marginBottom:12, textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
          <span>⬆️</span>
          <span>Mejorar mi plan</span>
          <span style={{ marginLeft:'auto', opacity:.5 }}>›</span>
        </button>
      )}

      {/* Cancelar suscripción */}
      {tieneMP && !confirmarCancel && (
        <button onClick={() => setConfirmarCancel(true)}
          style={{ width:'100%', padding:'11px 20px', borderRadius:12, border:'1.5px solid #e2e8f0',
            background:'#fff', color:'#6b7280', fontSize:12, fontWeight:600, cursor:'pointer' }}>
          Cancelar débito automático
        </button>
      )}

      {tieneMP && confirmarCancel && (
        <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:12, padding:'16px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#991b1b', marginBottom:8 }}>
            ¿Cancelar el débito automático?
          </div>
          <div style={{ fontSize:12, color:'#7f1d1d', marginBottom:14, lineHeight:1.5 }}>
            Tu acceso continúa hasta el vencimiento. Después deberás suscribirte de nuevo para renovar.
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={cancelarSuscripcion} disabled={cargandoCancel}
              style={{ flex:1, padding:'10px', borderRadius:10, border:'none',
                background:'#dc2626', color:'#fff', fontSize:13, fontWeight:700,
                cursor: cargandoCancel ? 'default' : 'pointer', opacity: cargandoCancel ? .7 : 1 }}>
              {cargandoCancel ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
            <button onClick={() => setConfirmarCancel(false)} disabled={cargandoCancel}
              style={{ flex:1, padding:'10px', borderRadius:10, border:'1.5px solid #e2e8f0',
                background:'#fff', color:'#374151', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              No, mantener
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div style={{ marginTop:12, fontSize:12, color:'#dc2626', background:'#fef2f2',
          border:'1px solid #fca5a5', borderRadius:8, padding:'8px 12px' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
