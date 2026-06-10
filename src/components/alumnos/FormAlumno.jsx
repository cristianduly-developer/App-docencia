import React, { useState } from 'react';
import { G, GR, GL, BD, TX, DIAS_L } from '../../constants';
import { uid, hMin } from '../../utils/helpers';
import { Card, Btn, Fld, Sel, SecT, WA } from '../ui';

export default function FormAlumno({ inicial, escuelas, docentes, pros, onSave, onCancel }) {
  const ed = !!(inicial && inicial.id);
  const parseCurso = (c) => {
    if (!c) return { anio: "", division: "" };
    const parts = c.trim().split(" ");
    return { anio: parts[0] || "", division: parts.slice(1).join(" ") || "" };
  };

  const [f, sf] = useState(() => {
    const base = inicial || {
      nombre: "", escuelaId: "", curso: "", dni: "", cuil: "", fechaNacimiento: "",
      direccion: "", telefonoCasa: "", cud: false, cudNumero: "", cudVencimiento: "",
      diagnostico: "", obraSocial: "", nroAfiliado: "", medicacion: "",
      tutores: [{ nombre: "", relacion: "", telefono: "", principal: true }],
      terapias: [{ nombre: "", profesional: "", telefono: "", frecuencia: "", dias: "" }],
      trayectoria: [{ ciclo: String(new Date().getFullYear()), institucion: "", nivel: "", notas: "" }],
      profesionalIds: [], horarios: [], eliminado: false,
    };
    const parsed = parseCurso(base.curso || "");
    return {
      ...base,
      anio: base.anio || parsed.anio,
      division: base.division || parsed.division,
      tutores: base.tutores?.length ? base.tutores : [{ nombre: "", relacion: "", telefono: "", principal: true }],
      terapias: base.terapias?.length ? base.terapias : [{ nombre: "", profesional: "", telefono: "", frecuencia: "", dias: "" }],
      trayectoria: base.trayectoria?.length ? base.trayectoria : [{ ciclo: String(new Date().getFullYear()), institucion: "", nivel: "", notas: "" }],
      profesionalIds: base.profesionalIds || [],
      horarios: base.horarios || [],
    };
  });

  const set = (k, v) => sf(p => ({ ...p, [k]: v }));
  const setT = (i, k, v) => sf(p => ({ ...p, tutores: p.tutores.map((t, ti) => ti === i ? { ...t, [k]: v } : t) }));
  const addT = () => sf(p => ({ ...p, tutores: [...p.tutores, { nombre: "", relacion: "", telefono: "", principal: false }] }));
  const delT = i => sf(p => ({ ...p, tutores: p.tutores.filter((_, ti) => ti !== i) }));
  const setTer = (i, k, v) => sf(p => ({ ...p, terapias: p.terapias.map((t, ti) => ti === i ? { ...t, [k]: v } : t) }));
  const addTer = () => sf(p => ({ ...p, terapias: [...p.terapias, { nombre: "", profesional: "", telefono: "", frecuencia: "", dias: "" }] }));
  const delTer = i => sf(p => ({ ...p, terapias: p.terapias.filter((_, ti) => ti !== i) }));
  const setTr = (i, k, v) => sf(p => ({ ...p, trayectoria: p.trayectoria.map((t, ti) => ti === i ? { ...t, [k]: v } : t) }));
  const addTr = () => sf(p => ({ ...p, trayectoria: [{ ciclo: "", institucion: "", nivel: "", notas: "" }, ...p.trayectoria] }));
  const delTr = i => sf(p => ({ ...p, trayectoria: p.trayectoria.filter((_, ti) => ti !== i) }));
  const togglePro = id => sf(p => ({ ...p, profesionalIds: p.profesionalIds.includes(id) ? p.profesionalIds.filter(x => x !== id) : [...p.profesionalIds, id] }));

  const prosActivos = pros.filter(p => !p.eliminado);
  const ok = !!(f.nombre && f.escuelaId);

  return (
    <div style={{ padding: "0 0 80px" }}>
      <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: G, fontWeight: 700, fontSize: 14, padding: 0, marginBottom: 16, fontFamily: "inherit" }}>← Cancelar</button>
      <div style={{ fontSize: 20, fontWeight: 800, color: TX, marginBottom: 20 }}>{ed ? "Editar alumno" : "Nuevo alumno"}</div>

      <Card>
        <SecT text="Datos básicos" />
        <Fld label="Nombre completo" value={f.nombre} onChange={v => set("nombre", v)} req placeholder="Apellido, Nombre" />
        <Sel label="Institución" value={f.escuelaId} onChange={v => set("escuelaId", v)}
          opts={escuelas.filter(e => !e.eliminado).map(e => ({ v: e.id, l: e.nombre }))} ph="Seleccionar..." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 6 }}>Año / Grado</div>
            <select value={f.anio || ""} onChange={e => set("anio", e.target.value)}
              style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", background: "#f8fafc", color: f.anio ? TX : GL, boxSizing: "border-box" }}>
              <option value="">-</option>
              {["1°", "2°", "3°", "4°", "5°", "6°", "7°"].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 6 }}>División</div>
            <select value={f.division || ""} onChange={e => set("division", e.target.value)}
              style={{ width: "100%", border: `1.5px solid ${BD}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", background: "#f8fafc", color: f.division ? TX : GL, boxSizing: "border-box" }}>
              <option value="">-</option>
              {["A", "B", "C", "D", "E", "F", "1ra", "2da", "3ra"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <Fld label="Diagnóstico" value={f.diagnostico} onChange={v => set("diagnostico", v)} placeholder="Ej: TEA Nivel 1" />
      </Card>

      <Card>
        <SecT text="Datos personales" />
        <Fld label="DNI" value={f.dni} onChange={v => set("dni", v)} placeholder="00.000.000" />
        <Fld label="CUIL" value={f.cuil} onChange={v => set("cuil", v)} placeholder="20-00000000-0" />
        <Fld label="Fecha de nacimiento" value={f.fechaNacimiento} onChange={v => set("fechaNacimiento", v)} type="date" />
        <Fld label="Dirección" value={f.direccion} onChange={v => set("direccion", v)} placeholder="Calle, número, piso" />
        <Fld label="Teléfono de casa" value={f.telefonoCasa} onChange={v => set("telefonoCasa", v)} placeholder="011-xxxx-xxxx" />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 8 }}>CUD</div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={f.cud} onChange={e => set("cud", e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Tiene Certificado Único de Discapacidad</span>
          </label>
        </div>
        {f.cud && <>
          <Fld label="Número de CUD" value={f.cudNumero} onChange={v => set("cudNumero", v)} placeholder="CUD-XXXX-XXXXX" />
          <Fld label="Fecha de vencimiento" value={f.cudVencimiento} onChange={v => set("cudVencimiento", v)} type="date" />
        </>}
      </Card>

      <Card>
        <SecT text="Salud" />
        <Fld label="Obra Social" value={f.obraSocial} onChange={v => set("obraSocial", v)} placeholder="OSDE, IOMA..." />
        <Fld label="N° de Afiliado" value={f.nroAfiliado} onChange={v => set("nroAfiliado", v)} />
        <Fld label="Medicación" value={f.medicacion} onChange={v => set("medicacion", v)} multiline placeholder="Medicación, dosis y horario de toma" />
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SecT text="Familia y contactos" />
          <Btn small outline onClick={addT} color={G}>+ Agregar</Btn>
        </div>
        {f.tutores.map((t, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${BD}`, paddingBottom: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: TX }}>Tutor {i + 1}</div>
              {f.tutores.length > 1 && <button onClick={() => delT(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, padding: 0 }}>🗑</button>}
            </div>
            <Fld label="Nombre completo" value={t.nombre} onChange={v => setT(i, "nombre", v)} placeholder="Apellido, Nombre" />
            <Fld label="Relación" value={t.relacion} onChange={v => setT(i, "relacion", v)} placeholder="Mamá, Papá, Tutor..." />
            <Fld label="Teléfono" value={t.telefono} onChange={v => setT(i, "telefono", v)} placeholder="11-xxxx-xxxx" />
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={t.principal} onChange={e => setT(i, "principal", e.target.checked)} style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Contacto principal</span>
            </label>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SecT text="Terapias actuales" />
          <Btn small outline onClick={addTer} color={G}>+ Agregar</Btn>
        </div>
        {f.terapias.map((t, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${BD}`, paddingBottom: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: TX }}>Terapia {i + 1}</div>
              {f.terapias.length > 1 && <button onClick={() => delTer(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, padding: 0 }}>🗑</button>}
            </div>
            <Fld label="Tipo de terapia" value={t.nombre} onChange={v => setTer(i, "nombre", v)} placeholder="Psicopedagogía, Fonoaudiología..." />
            <Fld label="Profesional" value={t.profesional} onChange={v => setTer(i, "profesional", v)} placeholder="Lic. ..." />
            <Fld label="Teléfono profesional" value={t.telefono||""} onChange={v => setTer(i, "telefono", v)} placeholder="11-xxxx-xxxx" />
            <Fld label="Frecuencia / Días" value={t.frecuencia} onChange={v => setTer(i, "frecuencia", v)} placeholder="Lunes y Miércoles, 2 veces por semana..." />
          </div>
        ))}
      </Card>


      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SecT text="Trayectoria escolar" />
          <Btn small outline onClick={addTr} color={G}>+ Agregar</Btn>
        </div>
        {f.trayectoria.map((t, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${BD}`, paddingBottom: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: TX }}>Ciclo {i + 1}</div>
              {f.trayectoria.length > 1 && <button onClick={() => delTr(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, padding: 0 }}>🗑</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <Fld label="Ciclo" value={t.ciclo} onChange={v => setTr(i, "ciclo", v)} placeholder="2024" />
              <Fld label="Nivel" value={t.nivel} onChange={v => setTr(i, "nivel", v)} placeholder="Primaria" />
            </div>
            <Fld label="Institución" value={t.institucion} onChange={v => setTr(i, "institucion", v)} placeholder="Escuela N°..." />
            <Fld label="Notas" value={t.notas} onChange={v => setTr(i, "notas", v)} multiline placeholder="Observaciones..." />
          </div>
        ))}
      </Card>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <Btn outline onClick={onCancel} color={GR}>Cancelar</Btn>
        <Btn onClick={() => ok && onSave({ ...f, id: f.id || uid() })} disabled={!ok} color={G} full>
          {ed ? "Guardar cambios" : "Crear alumno"}
        </Btn>
      </div>
    </div>
  );
}
