import React from 'react';
import { G, GD, GR, GL, TX, DIAS_L } from '../../constants';
import { hoy, hMin } from '../../utils/helpers';
import { Card } from '../ui';

export default function ResumenNocturno({ alumnos, docentes, escuelas, registros, recs, diaReal, fechaHoy, onVerMapa }) {
  const hoyStr = hoy();
  const diasSig = diaReal === 5 ? null : diaReal + 1;

  const alertasHoy = recs
    .filter(r => !r.eliminado && r.fecha === hoyStr)
    .sort((a, b) => ({ alta: 0, media: 1, baja: 2 })[a.prioridad] - ({ alta: 0, media: 1, baja: 2 })[b.prioridad]);

  const regsHoy = Object.entries(registros || {}).flatMap(([aId, regs]) =>
    (regs || []).filter(r => !r.eliminado && r.fecha === hoyStr).map(r => ({ ...r, aluId: aId }))
  ).sort((a, b) => b.id > a.id ? 1 : -1);

  const bloquesSig = diasSig
    ? alumnos.filter(a => !a.eliminado && a.activo !== false).flatMap(a => {
        const esc = escuelas.find(e => e.id === a.escuelaId);
        return (a.horarios || []).filter(h => h.dia === diasSig && !h.esRecreo)
          .map(h => ({ ...h, alumno: a, esc, doc: docentes.find(d => d.id === h.docenteId) }));
      }).sort((a, b) => hMin(a.horaInicio) - hMin(b.horaInicio))
    : [];

  const saludos = ["¡Buen cierre del día, Aye! 🌙", "¡Excelente jornada, Aye! ✨", "¡Ya terminó el día, Aye! 🌿"];
  const saludo = saludos[new Date().getDay() % saludos.length];

  return (
    <div style={{ padding: "0 0 80px" }}>
      <div style={{ background: `linear-gradient(135deg,${GD},${GD}ee)`, padding: "24px 20px 20px", color: "#fff", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{saludo}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", marginBottom: 6 }}>Resumen del día · {fechaHoy}</div>
        <button onClick={onVerMapa}
          style={{ marginTop: 8, background: "rgba(255,255,255,.13)", border: "1.5px solid rgba(255,255,255,.3)", color: "#fff", borderRadius: 10, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          🗺 Ver mapa del día
        </button>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: TX, marginBottom: 10 }}>🔔 Alertas de hoy</div>
        {alertasHoy.length === 0
          ? <Card sx={{ textAlign: "center", padding: 20, color: GR, fontSize: 13 }}>Sin alertas para hoy.</Card>
          : alertasHoy.map(r => {
              const alu = alumnos.find(a => a.id === r.alumnoId);
              const esc = alu ? escuelas.find(e => e.id === alu.escuelaId) : null;
              const color = r.prioridad === "alta" ? "#dc2626" : r.prioridad === "media" ? "#f59e0b" : "#16a34a";
              const emoji = r.prioridad === "alta" ? "🔴" : r.prioridad === "media" ? "🟡" : "🟢";
              return <Card key={r.id} sx={{ borderLeft: `4px solid ${color}`, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16 }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: TX, lineHeight: 1.4 }}>{r.texto}</div>
                    {alu && <div style={{ fontSize: 11, color: esc?.color || G, fontWeight: 700, marginTop: 3 }}>{alu.nombre}</div>}
                  </div>
                </div>
              </Card>;
            })}

        <div style={{ fontWeight: 800, fontSize: 15, color: TX, margin: "20px 0 10px" }}>📝 Registros de hoy</div>
        {regsHoy.length === 0
          ? <Card sx={{ textAlign: "center", padding: 20, color: GR, fontSize: 13 }}>Sin registros cargados hoy.</Card>
          : regsHoy.map((r, i) => {
              const alu = alumnos.find(a => a.id === r.aluId);
              const esc = alu ? escuelas.find(e => e.id === alu.escuelaId) : null;
              return <Card key={i} sx={{ borderLeft: `4px solid ${esc?.color || G}`, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: esc?.color || G }}>{alu?.nombre || "—"}</div>
                  <div style={{ fontSize: 11, color: GL }}>{r.materia}</div>
                </div>
                {r.asistencia && <span style={{ background: r.asistencia === "presente" ? "#f0fdf4" : "#fef2f2", color: r.asistencia === "presente" ? "#166534" : "#dc2626", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700, display: "inline-block", marginBottom: 4 }}>{r.asistencia}</span>}
                {r.avance && <div style={{ fontSize: 12, color: TX, lineHeight: 1.5 }}>{r.avance}</div>}
                {r.acuerdo && <div style={{ fontSize: 11, color: GR, fontStyle: "italic", marginTop: 3 }}>Acuerdo: {r.acuerdo}</div>}
              </Card>;
            })}

        {diasSig
          ? <>
              <div style={{ fontWeight: 800, fontSize: 15, color: TX, margin: "20px 0 10px" }}>📋 Mañana — {DIAS_L[diasSig]}</div>
              {bloquesSig.length === 0
                ? <Card sx={{ textAlign: "center", padding: 20, color: GR, fontSize: 13 }}>Sin bloques cargados para el {DIAS_L[diasSig]}.</Card>
                : bloquesSig.map((h, i) => (
                    <Card key={i} sx={{ borderLeft: `4px solid ${h.esc?.color || G}`, marginBottom: 8, padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: GR, minWidth: 96, flexShrink: 0 }}>{h.horaInicio}–{h.horaFin}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: TX }}>{h.alumno.nombre}</div>
                          <div style={{ fontSize: 11, color: GR }}>{h.doc?.materia || "Sin materia"}{h.aula ? " · " + h.aula : ""}</div>
                        </div>
                        <div style={{ background: (h.esc?.color || G) + "18", color: h.esc?.color || G, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                          {(h.esc?.nombre || "").split(" ").slice(-1)[0]}
                        </div>
                      </div>
                    </Card>
                  ))}
            </>
          : <Card sx={{ textAlign: "center", padding: 20, marginTop: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 700, color: TX }}>¡Mañana es finde!</div>
              <div style={{ fontSize: 12, color: GR, marginTop: 4 }}>Descansá, Aye. Te lo merecés.</div>
            </Card>
        }
      </div>
    </div>
  );
}
