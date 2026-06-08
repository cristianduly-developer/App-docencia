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
      }
    } catch (e) {
      console.error(`[DB.save] ${tabla} fetch error:`, e.message);
    }
    // localStorage fallback (no alumnos — datos sensibles)
    if (!["alumnos"].includes(tabla)) {
      try {
        const arr = JSON.parse(localStorage.getItem("aye_" + tabla) || "[]");
        const idx = arr.findIndex(x => x.id === obj.id);
        if (idx >= 0) arr[idx] = obj; else arr.push(obj);
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
        if (remoto && remoto.length > 0) {
          // Registros: Supabase devuelve array plano, app necesita diccionario por alumnoId
          if (tabla === "registros") {
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
          // Resto: merge por id
          const local = (() => { try { return JSON.parse(localStorage.getItem("aye_" + tabla) || "[]"); } catch { return []; } })();
          const supaIds = new Set(remoto.map(x => String(x.id)));
          const soloLocales = local.filter(x => !supaIds.has(String(x.id)));
          const merged = [
            ...remoto.map(sup => {
              const loc = local.find(l => String(l.id) === String(sup.id));
              return loc ? { ...loc, ...sup } : sup;
            }),
            ...soloLocales,
          ];
          localStorage.setItem("aye_" + tabla, JSON.stringify(merged));
          soloLocales.forEach(item => {
            fetch("/api/db/" + tabla, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify(item),
            }).catch(() => {});
          });
          return merged;
        }
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem("aye_" + tabla) || "null") || def; }
    catch { return def; }
  },
};
