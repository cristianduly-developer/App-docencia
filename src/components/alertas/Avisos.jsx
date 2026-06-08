import React, { useState } from 'react';
import { G, GR, GL, BD, TX } from '../../constants';
import { uid, hoy, fmtF } from '../../utils/helpers';
import { Card, Btn, Fld, Sel, Tag, Confirm } from '../ui';

export default function Avisos({ alumnos, recs, onAdd, onDel }) {
  const [show, setShow] = useState(false);
  const [txt, setTxt] = useState("");
  const [aId, setAId] = useState("");
  const [fec, setFec] = useState("");
  const [pri, setPri] = useState("media");
  const [conf, setConf] = useState(null);

  const act = recs.filter(r => !r.eliminado).sort((a, b) => {
    const p = { alta: 0, media: 1, baja: 2 };
    return p[a.prioridad] !== p[b.prioridad] ? p[a.prioridad] - p[b.prioridad] : a.fecha.localeCompare(b.fecha);
  });
  const pc = { alta: "#dc2626", media: "#f59e0b", baja: G };
  const pb = { alta: "#fef2f2", media: "#fffbeb", baja: "#f0fdf4" };

  const save = () => {
    if (!txt || !fec) return;
    onAdd({ id: "rc" + uid(), alumnoId: aId, texto: txt, fecha: fec, prioridad: pri, eliminado: false });
    setTxt(""); setAId(""); setFec(""); setPri("media"); setShow(false);
  };

  return (
    <div style={{ padding: "0 16px 80px" }}>
      {conf && <Confirm msg="¿Eliminar este aviso?" onOk={() => { onDel(conf); setConf(null); }} onNo={() => setConf(null)} />}

      <div style={{ padding: "20px 0 16px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: TX, marginBottom: 4 }}>Avisos</div>
        <div style={{ fontSize: 14, color: GR, marginBottom: 20 }}>Recordatorios y seguimientos pendientes</div>

        {!show
          ? <Btn full onClick={() => setShow(true)}>+ Nuevo aviso</Btn>
          : <Card sx={{ border: `2px solid ${G}`, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Nuevo aviso</div>
              <Sel label="Alumno (opcional)" value={aId} onChange={setAId}
                opts={alumnos.filter(a => !a.eliminado && a.activo !== false).map(a => ({ v: a.id, l: a.nombre }))}
                ph="Sin alumno específico" />
              <Fld label="Descripción" value={txt} onChange={setTxt} multiline placeholder="¿Qué tenés que hacer o recordar?" />
              <Fld label="Fecha límite" value={fec} onChange={setFec} type="date" />
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: GR, textTransform: "uppercase", marginBottom: 8 }}>Prioridad</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["alta", "media", "baja"].map(p =>
                    <button key={p} onClick={() => setPri(p)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "2px solid", borderColor: pri === p ? pc[p] : BD, background: pri === p ? pc[p] : "#fff", color: pri === p ? "#fff" : "#475569", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{p}</button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn outline onClick={() => setShow(false)} color={GR}>Cancelar</Btn>
                <Btn onClick={save} full disabled={!txt || !fec}>Guardar</Btn>
              </div>
            </Card>
        }

        <div style={{ marginTop: 16 }}>
          {act.length === 0
            ? <Card sx={{ textAlign: "center", padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ color: GR }}>Sin avisos pendientes</div>
              </Card>
            : act.map(r => {
                const a = alumnos.find(x => x.id === r.alumnoId);
                return (
                  <Card key={r.id} sx={{ background: pb[r.prioridad], borderLeft: `4px solid ${pc[r.prioridad]}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: TX }}>{r.texto}</div>
                        {a && <div style={{ fontSize: 12, color: GR, marginTop: 4 }}>👤 {a.nombre}</div>}
                        <div style={{ fontSize: 12, color: GR, marginTop: 2 }}>📅 {fmtF(r.fecha)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Tag text={r.prioridad} bg={pc[r.prioridad]} />
                        <button onClick={() => setConf(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, padding: "0 4px" }}>🗑</button>
                      </div>
                    </div>
                  </Card>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}
