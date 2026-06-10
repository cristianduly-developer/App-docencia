import React, { useState } from 'react';
import { G, GR, GL, BD, TX } from '../../constants';
import { Card, Confirm } from '../ui';

export default function SecAlumnosPanel({ alumnos, escuelas, docentes, pros, onVer, onEditar, onNuevo, onSave, onDelete, onToggleActivo }) {
  const [busq, setBusq] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("");
  const [verArchivados, setVerArchivados] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const noEliminados = alumnos.filter(a => !a.eliminado);
  const base = verArchivados ? noEliminados.filter(a => a.activo === false) : noEliminados.filter(a => a.activo !== false);
  const escIdsFiltro = filtroNivel ? escuelas.filter(e => e.nivel === filtroNivel && !e.eliminado && e.activo !== false).map(e => e.id) : [];
  const porEsc = escIdsFiltro.length > 0 ? base.filter(a => escIdsFiltro.includes(a.escuelaId)) : base;
  const filtrados = busq.length > 1 ? porEsc.filter(a => a.nombre.toLowerCase().includes(busq.toLowerCase()) || (a.curso || "").toLowerCase().includes(busq.toLowerCase())) : porEsc;

  return (
    <div style={{ paddingBottom: 8 }}>
      {confirm && <Confirm msg={confirm.msg} onOk={confirm.ok} onNo={() => setConfirm(null)} />}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#2D6A4F,#40916c)", padding: "16px 20px 12px", color: "#fff" }}>
        <div style={{ marginBottom: 12, paddingRight: 72 }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>👤 Alumnos</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginTop: 2 }}>{base.length} {verArchivados ? "archivados" : "activos"}</div>
        </div>
        <input value={busq} onChange={e => setBusq(e.target.value)} placeholder="🔍 Buscar por nombre o curso..."
          style={{ width: "100%", background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 12, padding: "8px 14px", fontSize: 13, fontFamily: "inherit", color: "#fff", boxSizing: "border-box", outline: "none" }} />
      </div>

      {/* Filtros + Nuevo */}
      <div style={{ padding: "10px 16px 0", display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, alignItems: "center" }}>
        <button onClick={() => setFiltroNivel("")} style={{ padding: "5px 12px", borderRadius: 20, border: "2px solid", borderColor: !filtroNivel ? G : BD, background: !filtroNivel ? G : "#fff", color: !filtroNivel ? "#fff" : "#475569", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>Todos</button>
        {[...new Set(escuelas.filter(e => !e.eliminado && e.activo !== false).map(e => e.nivel))].sort().map(nivel => {
          const color = escuelas.find(e => e.nivel === nivel && !e.eliminado)?.color || G;
          const activo = filtroNivel === nivel;
          return (
            <button key={nivel} onClick={() => setFiltroNivel(activo ? "" : nivel)}
              style={{ padding: "5px 12px", borderRadius: 20, border: "2px solid", borderColor: activo ? color : BD, background: activo ? color : "#fff", color: activo ? "#fff" : "#475569", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>{nivel}</button>
          );
        })}
        <button onClick={onNuevo} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: G, color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 2px 6px rgba(45,106,79,.35)" }}>
          + Nuevo alumno
        </button>
        <button onClick={() => setVerArchivados(v => !v)} style={{ padding: "5px 12px", borderRadius: 20, border: "2px solid", borderColor: verArchivados ? "#94a3b8" : BD, background: verArchivados ? "#f1f5f9" : "#fff", color: "#94a3b8", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "auto" }}>
          {verArchivados ? "✅ Ver activos" : "📦 Archivados"}
        </button>
      </div>

      {/* Lista */}
      <div style={{ padding: "12px 16px 0" }}>
        {filtrados.length === 0
          ? <div onClick={verArchivados ? undefined : onNuevo}
              style={{ textAlign:"center", padding:40, borderRadius:16, border:`2px dashed ${G}`, background:"#f0fdf4", cursor: verArchivados ? "default" : "pointer", margin:"4px 0" }}>
              <div style={{ fontSize:40, marginBottom:10 }}>👤</div>
              <div style={{ color: verArchivados ? GR : G, fontWeight:700, fontSize:15 }}>
                {verArchivados ? "Sin alumnos archivados" : "Sin alumnos — tocá para agregar"}
              </div>
              {!verArchivados && <div style={{ color:GL, fontSize:12, marginTop:6 }}>+ Nuevo alumno</div>}
            </div>
          : filtrados.map(a => {
              const esc = escuelas.find(e => e.id === a.escuelaId);
              const col = esc?.color || G;
              const inact = a.activo === false;
              return (
                <Card key={a.id} onClick={() => onVer(a)} sx={{ borderLeft: `4px solid ${inact ? "#cbd5e0" : col}`, opacity: inact ? .75 : 1, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", background: col + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: col, flexShrink: 0 }}>
                      {a.nombre.split(" ").slice(0, 2).map(p => p[0]).join("")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: TX }}>{a.nombre}</div>
                      <div style={{ fontSize: 12, color: GR, marginTop: 2 }}>{a.curso} · {esc?.nombre}</div>
                      {a.diagnostico && <div style={{ fontSize: 11, color: GL, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.diagnostico}</div>}
                    </div>
                    <div style={{ color: "#cbd5e0", fontSize: 20, flexShrink: 0 }}>›</div>
                  </div>
                </Card>
              );
            })
        }
      </div>
    </div>
  );
}
