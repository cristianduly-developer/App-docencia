import { authHeaders, manejar401 } from './session';

export const DB = {
  async save(tabla, obj) {
    try {
      const res = await fetch("/api/db/" + tabla, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(obj),
      });
      if (res.status === 401) { manejar401(); return; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(`[DB.save] ${tabla}:`, err?.error || res.status);
        window.dispatchEvent(new CustomEvent('aye:save-error', { detail: { tabla, msg: err?.error } }));
        return;
      }
      return; // guardado OK en servidor — no necesita localStorage
    } catch (e) {
      console.error(`[DB.save] ${tabla} fetch error:`, e.message);
      window.dispatchEvent(new CustomEvent('aye:save-error', { detail: { tabla, offline: true } }));
    }
    // localStorage fallback (no alumnos — datos sensibles)
    if (!["alumnos"].includes(tabla)) {
      try {
        const arr = JSON.parse(localStorage.getItem("aye_" + tabla) || "[]");
        const idx = arr.findIndex(x => x.id === obj.id);
        // Marcar como _offline solo si el fetch falló (sin conexión)
        const guardado = navigator.onLine ? obj : { ...obj, _offline: true };
        if (idx >= 0) arr[idx] = guardado; else arr.push(guardado);
        localStorage.setItem("aye_" + tabla, JSON.stringify(arr));
      } catch {}
    }
  },

  async loadRegistrosAlumno(alumnoId) {
    try {
      const res = await fetch(`/api/db/registros?alumno_id=${alumnoId}`, {
        headers: authHeaders(),
      });
      if (res.status === 401) { manejar401(); return []; }
      if (res.ok) {
        const remoto = await res.json();
        return (remoto || []).filter(r => !r.eliminado);
      }
    } catch (e) {
      console.error('[DB.loadRegistrosAlumno]', e.message);
    }
    return [];
  },

  async load(tabla, def = [], params = {}) {
    try {
      let url = "/api/db/" + tabla;
      if (tabla === "registros" && !params.completo) {
        const desde = new Date();
        desde.setDate(desde.getDate() - 60);
        url += "?desde=" + desde.toISOString().slice(0, 10);
      }
      const res = await fetch(url, { headers: authHeaders() });
      if (res.status === 401) { manejar401(); return def; }
      if (res.ok) {
        const remoto = await res.json();
        // Registros: Supabase devuelve array plano, app necesita diccionario por alumnoId
        if (tabla === "registros") {
          if (remoto && remoto.length > 0) {
            const dictRemoto = {};
            remoto.forEach(r => {
              const aId = r.aluId;
              if (aId) { if (!dictRemoto[aId]) dictRemoto[aId] = []; dictRemoto[aId].push(r); }
            });
            const local = (() => { try { return JSON.parse(localStorage.getItem("aye_registros") || "{}"); } catch { return {}; } })();
            const merged = { ...local };
            Object.entries(dictRemoto).forEach(([aId, regs]) => {
              const localRegs = merged[aId] || [];
              const remIds = new Set(regs.map(r => r.id));
              merged[aId] = [...regs, ...localRegs.filter(r => !remIds.has(r.id))];
            });
            localStorage.setItem("aye_registros", JSON.stringify(merged));
            return merged;
          }
          localStorage.setItem("aye_registros", JSON.stringify({}));
          return {};
        }
        // Resto: el servidor respondió OK — es la fuente de verdad
        const local = (() => { try { return JSON.parse(localStorage.getItem("aye_" + tabla) || "[]"); } catch { return []; } })();
        const supaIds = new Set((remoto || []).map(x => String(x.id)));
        // Solo re-subir items creados offline que el servidor no conoce
        const soloLocales = local.filter(x => x._offline && !supaIds.has(String(x.id)));
        const merged = remoto && remoto.length > 0
          ? [
              ...remoto.map(sup => {
                const loc = local.find(l => String(l.id) === String(sup.id));
                return loc ? { ...loc, ...sup } : sup;
              }),
              ...soloLocales,
            ]
          : soloLocales;
        localStorage.setItem("aye_" + tabla, JSON.stringify(merged));
        soloLocales.forEach(item => {
          fetch("/api/db/" + tabla, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(item),
          }).catch(() => {});
        });
        return merged.length > 0 ? merged : (remoto || def);
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem("aye_" + tabla) || "null") || def; }
    catch { return def; }
  },
};
