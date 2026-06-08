import React from 'react';
import { G, GR, GL, BD, TX, DIAS_L } from '../../constants';
import { hoy, hMin } from '../../utils/helpers';
import { Card } from '../ui';

export default function MapaFinde({ alumnos, docentes, escuelas, recs, registros, diaReal, fechaHoy, onVerMapa }) {
  const esSab = diaReal === 6;
  const saludo = esSab ? "¡Buen sábado, Aye! 🌿" : "¡Buen domingo, Aye! ☀️";
  const subtitulo = esSab ? "Acá va un resumen para que arranques el finde tranquila." : "Mañana arranca otra semana. Repasá lo que viene.";
  const hoyStr = hoy();
  const activos = alumnos.filter(a => !a.eliminado && a.activo !== false);

  const alertasAlta = recs
    .filter(r => !r.eliminado && r.prioridad === "alta" && r.fecha >= hoyStr)
    .sort((a, b) => a.fecha > b.fecha ? 1 : -1)
    .slice(0, 5);

  const hace14 = new Date(); hace14.setDate(hace14.getDate() - 14);
  const hace14Str = hace14.toISOString().split("T")[0];
  const acuerdos = Object.entries(registros || {}).flatMap(([aId, regs]) =>
    (regs || []).filter(r => !r.eliminado && r.acuerdo && r.acuerdo.trim() && r.fecha >= hace14Str)
      .map(r => ({ ...r, aluId: aId }))
  ).sort((a, b) => b.fecha > a.fecha ? 1 : -1).slice(0, 5);

  const bloquesDia1 = activos.flatMap(a => {
    const esc = escuelas.find(e => e.id === a.escuelaId);
    return (a.horarios || []).filter(h => h.dia === 1 && !h.esRecreo)
      .map(h => ({ ...h, alumno: a, esc, doc: docentes.find(d => d.id === h.docenteId) }));
  }).sort((a, b) => hMin(a.horaInicio) - hMin(b.horaInicio));

  return (
    <div style={{ padding: "0 0 80px" }}>
      <div style={{ background: "linear-gradient(135deg,#1a202c,#2d3748)", padding: "24px 20px 20px", color: "#fff", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{saludo}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", marginBottom: 12 }}>{subtitulo}</div>
        <button onClick={onVerMapa}
          style={{ background: "rgba(255,255,255,.13)", border: "1.5px solid rgba(255,255,255,.3)", color: "#fff", borderRadius: 10, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          🗺 Ver mapa del día
        </button>
      </div>

      <div style={{ padding: "0 16px" }}>
        {alertasAlta.length > 0 && <>
          <div style={{ fontWeight: 800, fontSize: 15, color: TX, marginBottom: 10 }}>🔴 Alertas urgentes pendientes</div>
          {alertasAlta.map(r => {
            const alu = alumnos.find(a => a.id === r.alumnoId);
            return <Card key={r.id} sx={{ borderLeft: "4px solid #dc2626", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#dc2626" }}>{r.texto}</div>
              {alu && <div style={{ fontSize: 11, color: GR, marginTop: 4 }}>👤 {alu.nombre} · {r.fecha}</div>}
            </Card>;
          })}
        </>}

        {acuerdos.length > 0 && <>
          <div style={{ fontWeight: 800, fontSize: 15, color: TX, margin: "20px 0 10px" }}>🤝 Acuerdos recientes</div>
          {acuerdos.map((r, i) => {
            const alu = alumnos.find(a => a.id === r.aluId);
            const esc = alu ? escuelas.find(e => e.id === alu.escuelaId) : null;
            return <Card key={i} sx={{ borderLeft: `4px solid ${esc?.color || G}`, marginBottom: 8, padding: "10px 14px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: esc?.color || G }}>{alu?.nombre || "—"}</div>
              <div style={{ fontSize: 12, color: TX, marginTop: 4 }}>{r.acuerdo}</div>
              <div style={{ fontSize: 11, color: GR, marginTop: 5 }}>Registrado el {r.fecha}</div>
            </Card>;
          })}
        </>}

        <div style={{ fontWeight: 800, fontSize: 15, color: TX, margin: "20px 0 10px" }}>📋 Lunes — horarios</div>
        {bloquesDia1.length === 0
          ? <Card sx={{ textAlign: "center", padding: 24, color: GR }}>Sin bloques cargados para el lunes.</Card>
          : bloquesDia1.map((h, i) => (
            <Card key={i} sx={{ borderLeft: `4px solid ${h.esc?.color || G}`, marginBottom: 8, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: GR, minWidth: 96, flexShrink: 0 }}>{h.horaInicio}–{h.horaFin}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: TX }}>{h.alumno.nombre}</div>
                  <div style={{ fontSize: 11, color: GR }}>{h.doc?.materia || "Sin materia"}{h.aula ? " · " + h.aula : ""}</div>
                </div>
                <div style={{ background: (h.esc?.color || G) + "18", color: h.esc?.color || G, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {(h.esc?.nombre || "").split(" ").slice(-1)[0]}
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
