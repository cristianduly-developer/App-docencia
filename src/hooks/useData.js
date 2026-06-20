import { useState, useEffect } from 'react';
import { DB } from '../utils/db';
import { leer, grabar, normAlu, hoy } from '../utils/helpers';
import { ESC_DEF, DOC_DEF, PRO_DEF, ALU_DEF, REG_DEF, REC_DEF } from '../constants';

export function useData(usuario) {
  const [escuelas,  setEscuelas]  = useState([]);
  const [docentes,  setDocentes]  = useState([]);
  const [pros,      setPros]      = useState([]);
  const [alumnos,   setAlumnos]   = useState([]);
  const [registros, setRegistros] = useState({});
  const [recs,      setRecs]      = useState([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [errorSync,     setErrorSync]     = useState(null);

  // Sync con Supabase al iniciar — DB es la fuente de verdad
  useEffect(() => {
    if (!usuario) return;
    setSincronizando(true);
    setErrorSync(null);
    (async () => {
      try {
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
      } catch(e) {
        console.error('[sync]', e.message);
        setEscuelas(leer("aye_escuelas",   ESC_DEF));
        setDocentes(leer("aye_docentes",   DOC_DEF));
        setPros(leer("aye_profesionales",  PRO_DEF));
        setAlumnos(leer("aye_alumnos",     ALU_DEF).map(normAlu));
        setRegistros(leer("aye_registros", REG_DEF));
        setRecs(leer("aye_avisos",         REC_DEF));
        setErrorSync('Sin conexión — mostrando datos guardados localmente.');
      } finally {
        setSincronizando(false);
      }
    })();
  }, [usuario?.email]);

  // Persistir cambios localmente como caché
  useEffect(() => { grabar("aye_registros", registros); }, [registros]);
  useEffect(() => { grabar("aye_avisos",    recs);      }, [recs]);

  // ── Mutators ─────────────────────────────────────────────────
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
  const cargarHistorialAlumno = async (id) => {
    const regs = await DB.loadRegistrosAlumno(id);
    if (regs.length > 0) setRegistros(p => ({ ...p, [id]: regs }));
  };

  return {
    escuelas, docentes, pros, alumnos, registros, recs,
    sincronizando, errorSync, setErrorSync,
    saveEsc, saveDoc, saveAlu, delAlu, delEsc, delDoc,
    toggleActivoAlu, toggleActivoEsc, toggleActivoDoc,
    archivarAlumnosEsc, addReg, delReg, addRec, delRec,
    marcarAusenteTotal, rehabilitarAlumno, cargarHistorialAlumno,
    setRegistros,
  };
}
