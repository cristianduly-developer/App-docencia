export const hMin   = h => { const [hh,mm]=h.split(":").map(Number); return hh*60+mm; };
export const fmtF   = s => { if(!s)return"—"; const [y,m,d]=s.split("-"); return `${d}/${m}/${y}`; };
export const uid    = () => Math.random().toString(36).slice(2,9);
export const hoy    = () => new Date().toISOString().split("T")[0];
export const hoyFmt = () => new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"});

export function normAlu(a) {
  const arr = f => Array.isArray(f) ? f
    : (f && typeof f === "string"
      ? (() => { try { return JSON.parse(f); } catch { return []; } })()
      : []);
  return {
    ...a,
    horarios:       arr(a.horarios),
    tutores:        arr(a.tutores),
    terapias:       arr(a.terapias),
    trayectoria:    arr(a.trayectoria),
    profesionalIds: arr(a.profesionalIds),
  };
}

export const leer = (key, def) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : def; }
  catch { return def; }
};

export const grabar = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};
