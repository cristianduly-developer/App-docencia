import React, { useState, useEffect } from 'react';
import { FO, BD, G, GR, GL, TX, LIMITE_ALUMNOS, ESC_DEF, DOC_DEF, PRO_DEF, ALU_DEF, REG_DEF, REC_DEF } from './constants';
import { hoy, leer, grabar, normAlu } from './utils/helpers';
import { getSessionToken, setSessionToken } from './utils/session';
import { DB } from './utils/db';
import { AppProvider, appState } from './context/AppContext';

import PantallaLogin    from './components/auth/PantallaLogin';
import MapaDia          from './components/mapa/MapaDia';
import MapaFinde        from './components/mapa/MapaFinde';
import ResumenNocturno  from './components/mapa/ResumenNocturno';
import VistaClase       from './components/mapa/VistaClase';
import SecAlumnosPanel  from './components/alumnos/SecAlumnosPanel';
import FichaAlumno      from './components/alumnos/FichaAlumno';
import FormAlumno       from './components/alumnos/FormAlumno';
import Directorio       from './components/directorio/Directorio';
import Reportes         from './components/reportes/Reportes';
import Avisos           from './components/alertas/Avisos';
import CoPilot          from './components/copilot/CoPilot';
import MiPlan           from './components/miplan/MiPlan';

export default function App() {
  // ── Autenticación ──────────────────────────────────────────
  const [usuario, setUsuario] = useState(() => {
    const u = leer("aye_sesion", null);
    if (!u || !getSessionToken()) return null;
    if (u.nombre) appState.nombreDocente = u.nombre;
    if (u.plan)   appState.planDocente   = u.plan;
    return u;
  });

  const login = u => {
    setUsuario(u);
    grabar("aye_sesion", u);
    localStorage.setItem("aye_last_activity", Date.now());
    if (u?.nombre) appState.nombreDocente = u.nombre;
    if (u?.plan)   appState.planDocente   = u.plan;
  };

  const logout = () => {
    setUsuario(null);
    setSessionToken(null);
    localStorage.removeItem("aye_sesion");
    localStorage.removeItem("aye_last_activity");
    if (window.google) window.google.accounts.id.disableAutoSelect();
    window._gsiIniciado = false;
  };

  // Sesión expirada (401 del server)
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('aye:sesion-expirada', handler);
    return () => window.removeEventListener('aye:sesion-expirada', handler);
  }, []);

  // Auto-logout por inactividad 30 min
  useEffect(() => {
    if (!usuario) return;
    const reg = () => localStorage.setItem("aye_last_activity", Date.now());
    const check = () => { if (Date.now() - parseInt(localStorage.getItem("aye_last_activity") || "0") > 30 * 60 * 1000) logout(); };
    ["click", "touchstart", "keydown"].forEach(ev => window.addEventListener(ev, reg));
    const t = setInterval(check, 60000);
    return () => { ["click", "touchstart", "keydown"].forEach(ev => window.removeEventListener(ev, reg)); clearInterval(t); };
  }, [usuario]);

  // ── Datos maestros ─────────────────────────────────────────
  const [escuelas,  setEscuelas]  = useState(() => leer("aye_escuelas",      ESC_DEF));
  const [docentes,  setDocentes]  = useState(() => leer("aye_docentes",      DOC_DEF));
  const [pros,      setPros]      = useState(() => leer("aye_profesionales", PRO_DEF));
  const [alumnos,   setAlumnos]   = useState(() => leer("aye_alumnos",       ALU_DEF).map(normAlu));
  const [registros, setRegistros] = useState(() => leer("aye_registros",     REG_DEF));
  const [recs,      setRecs]      = useState(() => leer("aye_avisos",        REC_DEF));

  // Sync con Supabase al iniciar
  useEffect(() => {
    if (!usuario) return;
    (async () => {
      const [esc, doc, pro, alu, regs, avs] = await Promise.all([
        DB.load("escuelas",      ESC_DEF),
        DB.load("docentes",      DOC_DEF),
        DB.load("profesionales", PRO_DEF),
        DB.load("alumnos",       ALU_DEF),
        DB.load("registros",     REG_DEF),
        DB.load("avisos",        REC_DEF),
      ]);
      setEscuelas(esc);
      setDocentes(doc);
      setPros(pro);
      setAlumnos(alu.map(normAlu));
      setRegistros(regs);
      setRecs(avs);
    })();
  }, [usuario?.email]);

  // Persistir cambios localmente
  useEffect(() => { grabar("aye_registros", registros); }, [registros]);
  useEffect(() => { grabar("aye_avisos",    recs);      }, [recs]);

  // ── Mutators ───────────────────────────────────────────────
  const saveEsc = e => { setEscuelas(p => p.find(x => x.id === e.id) ? p.map(x => x.id === e.id ? e : x) : [...p, e]); DB.save("escuelas", e); };
  const saveDoc = d => { setDocentes(p => p.find(x => x.id === d.id) ? p.map(x => x.id === d.id ? d : x) : [...p, d]); DB.save("docentes", d); };
  const saveAlu = a => { setAlumnos(p => p.find(x => x.id === a.id) ? p.map(x => x.id === a.id ? normAlu(a) : x) : [...p, normAlu(a)]); DB.save("alumnos", a); };
  const delAlu  = id => { const upd = { ...alumnos.find(a => a.id === id), eliminado: true }; setAlumnos(p => p.map(a => a.id === id ? upd : a)); DB.save("alumnos", upd); };
  const delEsc  = id => { const upd = { ...escuelas.find(e => e.id === id), eliminado: true }; setEscuelas(p => p.map(e => e.id === id ? upd : e)); DB.save("escuelas", upd); };
  const delDoc  = id => { const upd = { ...docentes.find(d => d.id === id), eliminado: true }; setDocentes(p => p.map(d => d.id === id ? upd : d)); DB.save("docentes", upd); };
  const toggleActivoAlu = id => { const a = alumnos.find(x => x.id === id); const upd = { ...a, activo: a.activo === false }; setAlumnos(p => p.map(x => x.id === id ? upd : x)); DB.save("alumnos", upd); };
  const toggleActivoEsc = id => { const e = escuelas.find(x => x.id === id); const upd = { ...e, activo: e.activo === false }; setEscuelas(p => p.map(x => x.id === id ? upd : x)); DB.save("escuelas", upd); };
  const toggleActivoDoc = id => { const d = docentes.find(x => x.id === id); const upd = { ...d, activo: d.activo === false }; setDocentes(p => p.map(x => x.id === id ? upd : x)); DB.save("docentes", upd); };
  const archivarAlumnosEsc = (escId, ciclo, tambienDocentes) => {
    const updAlumnos = alumnos.map(a => a.escuelaId === escId && a.activo !== false ? { ...a, activo: false, cicloArchivado: ciclo } : a);
    setAlumnos(updAlumnos);
    updAlumnos.filter(a => a.escuelaId === escId && a.activo === false).forEach(a => DB.save("alumnos", a));
    if (tambienDocentes) { const updDocs = docentes.map(d => d.escuelaId === escId ? { ...d, activo: false } : d); setDocentes(updDocs); updDocs.filter(d => d.escuelaId === escId).forEach(d => DB.save("docentes", d)); }
  };

  const addReg = (aId, reg) => { setRegistros(p => ({ ...p, [aId]: [reg, ...(p[aId] || [])] })); DB.save("registros", { ...reg, alumnoId: aId }); };
  const delReg = (aId, rId) => setRegistros(p => { const upd = { ...p, [aId]: (p[aId] || []).map(r => r.id === rId ? { ...r, eliminado: true } : r) }; const reg = upd[aId].find(r => r.id === rId); if (reg) DB.save("registros", { ...reg, alumnoId: aId }); return upd; });
  const addRec = r => { setRecs(p => [r, ...p]); DB.save("avisos", r); };
  const delRec = id => setRecs(p => { const upd = p.map(r => r.id === id ? { ...r, eliminado: true } : r); const rec = upd.find(r => r.id === id); if (rec) DB.save("avisos", rec); return upd; });

  // ── Ausencias ──────────────────────────────────────────────
  const marcarAusenteTotal = (alumnoId, fecha) => {
    if ((registros[alumnoId] || []).some(r => r.fecha === fecha && r.tipo === "ausencia_total" && !r.eliminado)) return;
    const reg = { id: "reg_" + Date.now(), fecha, tipo: "ausencia_total", materia: "Asistencia General", asistencia: "ausente", avance: "Alumno ausente toda la jornada.", acuerdo: "", docente: "", eliminado: false };
    setRegistros(p => ({ ...p, [alumnoId]: [reg, ...(p[alumnoId] || [])] }));
    DB.save("registros", { ...reg, alumnoId });
  };

  const rehabilitarAlumno = (alumnoId, fecha) => {
    const reg = (registros[alumnoId] || []).find(r => r.fecha === fecha && r.tipo === "ausencia_total" && !r.eliminado);
    if (!reg) return;
    const upd = { ...reg, eliminado: true };
    setRegistros(p => ({ ...p, [alumnoId]: p[alumnoId].map(r => r.id === reg.id ? upd : r) }));
    DB.save("registros", { ...upd, alumnoId });
  };

  // ── Ausentismo mensual ─────────────────────────────────────
  const ausentismo = React.useMemo(() => {
    const hoyDate = new Date();
    const mes = hoyDate.getMonth(), anio = hoyDate.getFullYear();
    const faltasPorAlumno = {}, alertasSistemicas = [];
    alumnos.filter(a => a.activo !== false && !a.eliminado).forEach(alumno => {
      const faltas = (registros[alumno.id] || []).filter(r => {
        if (r.eliminado || r.tipo !== "ausencia_total") return false;
        const f = new Date(r.fecha + "T00:00:00");
        return f.getMonth() === mes && f.getFullYear() === anio;
      }).length;
      faltasPorAlumno[alumno.id] = faltas;
      if (faltas >= 5) alertasSistemicas.push({ id: `crit_${alumno.id}`, color: "rojo", texto: `🚨 ${alumno.nombre} registra ${faltas} inasistencias este mes. Preparar informe para EOE.` });
      else if (faltas >= 3) alertasSistemicas.push({ id: `mod_${alumno.id}`, color: "amarillo", texto: `⚠️ ${alumno.nombre} acumuló ${faltas} inasistencias este mes. Realizar seguimiento.` });
    });
    return { faltasPorAlumno, alertasSistemicas };
  }, [alumnos, registros]);

  // ── Reloj en vivo ──────────────────────────────────────────
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setAhora(new Date()), 60000); return () => clearInterval(t); }, []);
  const DIA_REAL = ahora.getDay();
  const MIN      = ahora.getHours() * 60 + ahora.getMinutes();
  const FECHA_HOY = ahora.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  // Cargar historial completo al abrir ficha
  const cargarHistorialAlumno = async (id) => {
    const regs = await DB.loadRegistrosAlumno(id);
    if (regs.length > 0) setRegistros(p => ({ ...p, [id]: regs }));
  };

  // ── Navegación ─────────────────────────────────────────────
  const [pant,          setPant]         = useState("mapa");
  const [diaVista,      setDiaVista]     = useState(DIA_REAL || 1);
  const [aluSel,        setAluSel]       = useState(null);
  const [evSel,         setEvSel]        = useState(null);
  const [fichaAlu,      setFichaAlu]     = useState(null);
  const [editandoAlu,   setEditandoAlu]  = useState(null);
  const [forceMapaDia,  setForceMapaDia] = useState(false);
  const [menuUsuario,   setMenuUsuario]  = useState(false);

  const irAFicha = (a) => { setFichaAlu(a); setAluSel(a); setPant("alumnos"); cargarHistorialAlumno(a.id); };

  // Urgentes para badge
  const urgentes = recs.filter(r => r.prioridad === "alta" && !r.eliminado && (!r.fecha || r.fecha === hoy())).length;

  // Guardar alumno con curso compuesto
  const saveAluConCurso = (a) => {
    const { anio, division, ...rest } = a;
    const aComp = { ...rest, curso: [anio, division].filter(Boolean).join(" ") || rest.curso };
    saveAlu(aComp);
  };

  if (!usuario) return <PantallaLogin onLogin={login} />;

  const esDemo = usuario?.acceso?.estado === 'demo';
  const diasDemo = usuario?.acceso?.diasRestantes ?? null;
  const nombreCorto = (usuario?.nombre || "").split(" ")[0] || "Usuario";
  const iniciales   = (usuario?.nombre || "?").split(" ").map(w => w[0]).slice(0, 2).join("");

  const NAV_BOTTOM = [
    { id: "alumnos",    icon: "👤",  label: "Alumnos"   },
    { id: "directorio", icon: "🏫",  label: "Directorio"},
    { id: "mapa",       icon: "🗺",  label: "Mapa",      central: true },
    { id: "reportes",   icon: "📊",  label: "Reportes"  },
    { id: "alertas",    icon: "🔔",  label: "Alertas",   badge: urgentes },
  ];

  return (
    <AppProvider>
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: FO, fontFamily: "'Georgia',serif", display: "flex", flexDirection: "column" }}>

        {/* Banner demo */}
        {esDemo && (
          <div style={{ background: "#f59e0b", color: "#1c1917", padding: "8px 16px", fontSize: 13, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            ⏳ <strong>Período de prueba</strong>{diasDemo != null ? ` — ${diasDemo} día${diasDemo !== 1 ? "s" : ""} restante${diasDemo !== 1 ? "s" : ""}` : ""}. Contactá al administrador para activar tu cuenta.
          </div>
        )}

        {/* Avatar flotante */}
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 500 }}>
          <button onClick={() => setMenuUsuario(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2D6A4F,#40916c)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.2)", border: "2px solid #fff" }}>
              {usuario?.foto
                ? <img src={usuario.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                : <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{iniciales}</span>}
            </div>
          </button>
          {menuUsuario && (
            <div style={{ position: "absolute", top: 44, right: 0, background: "#fff", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.15)", border: "1px solid #e2e8f0", minWidth: 180, overflow: "hidden", zIndex: 501 }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: TX }}>{usuario?.nombre || "Usuario"}</div>
                <div style={{ fontSize: 11, color: GR, marginTop: 2 }}>{usuario?.email || ""}</div>
              </div>
              <button onClick={() => { setMenuUsuario(false); setPant("miplan"); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", color: TX, fontWeight: 700, fontSize: 13, textAlign: "left", borderBottom: "1px solid #f1f5f9" }}>
                <span>⭐</span> Mi plan
              </button>
              <button onClick={() => { setMenuUsuario(false); const tel = "542235767784"; const msg = encodeURIComponent(`Hola! Soy ${usuario?.nombre || ""} (${usuario?.email || ""}), necesito ayuda con la app.`); window.open(`https://wa.me/${tel}?text=${msg}`, "_blank"); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", color: TX, fontWeight: 700, fontSize: 13, textAlign: "left", borderBottom: "1px solid #f1f5f9" }}>
                <span>💬</span> Contactar soporte
              </button>
              <button onClick={() => { setMenuUsuario(false); logout(); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", color: "#dc2626", fontWeight: 700, fontSize: 13, textAlign: "left" }}>
                <span>🚪</span> Cerrar sesión
              </button>
            </div>
          )}
          {menuUsuario && <div onClick={() => setMenuUsuario(false)} style={{ position: "fixed", inset: 0, zIndex: 499 }} />}
        </div>

        {/* Contenido principal */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 66 }}>

          {/* ── MAPA ── */}
          {pant === "mapa" && <>
            {evSel
              ? <VistaClase
                  ev={evSel}
                  alumno={alumnos.find(a => a.id === evSel.alumnoId)}
                  docentes={docentes}
                  escuelas={escuelas}
                  registros={registros}
                  onBack={() => setEvSel(null)}
                  onAddReg={addReg}
                  onAddRec={addRec}
                  onFicha={() => { const a = alumnos.find(x => x.id === evSel.alumnoId); if (a) irAFicha(a); }}
                />
              : (DIA_REAL === 0 || DIA_REAL === 6) && !forceMapaDia
                ? <MapaFinde
                    alumnos={alumnos} docentes={docentes} escuelas={escuelas}
                    recs={recs} registros={registros} diaReal={DIA_REAL} fechaHoy={FECHA_HOY}
                    onVerMapa={() => { setForceMapaDia(true); setDiaVista(1); }}
                  />
                : DIA_REAL >= 1 && DIA_REAL <= 5 && MIN >= 18 * 60 && !forceMapaDia
                  ? <ResumenNocturno
                      alumnos={alumnos} docentes={docentes} escuelas={escuelas}
                      registros={registros} recs={recs}
                      diaReal={DIA_REAL} fechaHoy={FECHA_HOY}
                      onVerMapa={() => setForceMapaDia(true)}
                    />
                  : <MapaDia
                      alumnos={alumnos} docentes={docentes} escuelas={escuelas}
                      registros={registros} recs={recs}
                      dia={diaVista} diaReal={DIA_REAL} minActual={MIN}
                      fechaHoy={FECHA_HOY}
                      onCambioDia={setDiaVista}
                      onVolverAHoy={(DIA_REAL === 0 || DIA_REAL === 6 || (DIA_REAL >= 1 && DIA_REAL <= 5 && MIN >= 18 * 60)) ? () => setForceMapaDia(false) : undefined}
                      onVerClase={ev => setEvSel(ev)}
                      onVerAlumno={id => { const a = alumnos.find(x => x.id === id); if (a) irAFicha(a); }}
                      onMarcarAusente={marcarAusenteTotal}
                      onRehabilitarAlumno={rehabilitarAlumno}
                      ausentismo={ausentismo}
                    />
            }
            {/* CoPilot — solo plan pro/premium */}
            {appState.planDocente !== 'basico'
              ? <CoPilot alumnos={alumnos} docentes={docentes} pros={pros} escuelas={escuelas} registros={registros} recs={recs} />
              : <div style={{ position: "fixed", bottom: 80, right: 20, zIndex: 300 }}>
                  <button onClick={() => alert('🔒 El Co-Piloto IA está disponible desde el plan Profesional.\n\nActualizá tu suscripción para acceder.')}
                    style={{ width: 56, height: 56, borderRadius: "50%", background: "#94a3b8", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    🔒
                  </button>
                </div>
            }
          </>}

          {/* ── ALUMNOS ── */}
          {pant === "alumnos" && <>
            {editandoAlu
              ? <FormAlumno
                  inicial={editandoAlu}
                  escuelas={escuelas}
                  onSave={a => { saveAluConCurso(a); setEditandoAlu(null); }}
                  onCancel={() => setEditandoAlu(null)}
                />
              : aluSel
                ? <FichaAlumno
                    alumno={alumnos.find(a => a.id === aluSel.id) || aluSel}
                    alumnos={alumnos} docentes={docentes} pros={pros}
                    escuelas={escuelas} registros={registros} recs={recs}
                    onBack={() => setAluSel(null)}
                    onVerClase={ev => { setEvSel(ev); setPant("mapa"); }}
                    onAddRec={addRec}
                    onAddReg={addReg}
                    onDelReg={delReg}
                    onEditar={a => setEditandoAlu(a)}
                    onToggleActivo={toggleActivoAlu}
                    onDelete={id => { delAlu(id); setAluSel(null); }}
                    onSave={a => { saveAluConCurso(a); }}
                  />
                : <SecAlumnosPanel
                    alumnos={alumnos} escuelas={escuelas}
                    onVer={a => { setAluSel(a); cargarHistorialAlumno(a.id); }}
                    onEditar={a => setEditandoAlu(a)}
                    onNuevo={() => {
                      const activos = alumnos.filter(a => !a.eliminado && a.activo !== false).length;
                      const limite = LIMITE_ALUMNOS[appState.planDocente] ?? 15;
                      if (activos >= limite) { alert(`Tu plan permite hasta ${limite} alumnos activos. Actualizá tu suscripción para agregar más.`); return; }
                      setEditandoAlu({ nombre: "", escuelaId: "", activo: true, eliminado: false, horarios: [], tutores: [], terapias: [], profesionalIds: [] });
                    }}
                    onSave={saveAluConCurso}
                    onDelete={delAlu}
                    onToggleActivo={toggleActivoAlu}
                  />
            }
          </>}

          {/* ── DIRECTORIO ── */}
          {pant === "directorio" && (
            <Directorio
              alumnos={alumnos} escuelas={escuelas} docentes={docentes}
              onVer={id => { setAluSel(alumnos.find(a => a.id === id) || { id }); setPant("alumnos"); }}
              saveEsc={saveEsc} delEsc={delEsc}
              saveDoc={saveDoc} delDoc={delDoc}
              toggleActivoEsc={toggleActivoEsc}
              toggleActivoDoc={toggleActivoDoc}
              archivarAlumnosEsc={archivarAlumnosEsc}
            />
          )}

          {/* ── REPORTES ── */}
          {pant === "reportes" && (
            <Reportes
              alumnos={alumnos} docentes={docentes} pros={pros} escuelas={escuelas}
              registros={registros} recs={recs}
              onVerAlumno={id => { setAluSel(alumnos.find(a => a.id === id) || { id }); setPant("alumnos"); }}
            />
          )}

          {/* ── ALERTAS ── */}
          {pant === "alertas" && (
            <Avisos recs={recs} alumnos={alumnos} onAdd={addRec} onDel={delRec} />
          )}

          {/* ── MI PLAN ── */}
          {pant === "miplan" && (
            <div>
              <div style={{ background: "linear-gradient(135deg,#1a202c,#2d3748)", padding: "16px 20px", color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setPant("mapa")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 }}>‹</button>
                <div style={{ fontWeight: 800, fontSize: 18 }}>⭐ Mi Plan</div>
              </div>
              <div style={{ padding: "16px" }}>
                <MiPlan alumnos={alumnos} />
              </div>
            </div>
          )}

        </div>

        {/* Bottom Navigation */}
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: `1px solid ${BD}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom,0px)", boxShadow: "0 -2px 12px rgba(0,0,0,.08)", zIndex: 200 }}>
          {NAV_BOTTOM.map(item => item.central
            ? <button key={item.id} onClick={() => { setPant(item.id); setEvSel(null); setDiaVista(DIA_REAL || 1); setForceMapaDia(false); }}
                style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 2px 8px", fontFamily: "inherit", position: "relative" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: pant === item.id ? "linear-gradient(135deg,#2D6A4F,#40916c)" : "linear-gradient(135deg,#e2e8f0,#cbd5e0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: pant === item.id ? "0 4px 16px rgba(45,106,79,.4)" : "none", marginTop: -14, border: "3px solid #fff", transition: "all .2s" }}>{item.icon}</div>
                <span style={{ fontSize: 9, fontWeight: pant === item.id ? 800 : 600, color: pant === item.id ? "#2D6A4F" : "#94a3b8", textTransform: "uppercase", letterSpacing: .3, marginTop: 2 }}>{item.label}</span>
              </button>
            : <button key={item.id} onClick={() => { setPant(item.id); if (item.id !== "alumnos") setAluSel(null); if (item.id !== "mapa") setEvSel(null); }}
                style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 2px 10px", fontFamily: "inherit", borderTop: pant === item.id ? "3px solid #2D6A4F" : "3px solid transparent" }}>
                <div style={{ position: "relative" }}>
                  <span style={{ fontSize: 19, opacity: pant === item.id ? 1 : .4 }}>{item.icon}</span>
                  {item.badge > 0 && <div style={{ position: "absolute", top: -5, right: -7, background: "#dc2626", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.badge}</div>}
                </div>
                <span style={{ fontSize: 9, fontWeight: pant === item.id ? 800 : 600, color: pant === item.id ? "#2D6A4F" : "#94a3b8", textTransform: "uppercase", letterSpacing: .3 }}>{item.label}</span>
              </button>
          )}
        </div>

      </div>
    </AppProvider>
  );
}
