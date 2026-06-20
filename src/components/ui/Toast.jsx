import { useState, useEffect, useCallback } from 'react';
import { G } from '../../constants';

let _addToast = null;

export function toast(msg, tipo = 'ok') {
  if (_addToast) _addToast(msg, tipo);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((msg, tipo) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, tipo }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  useEffect(() => { _addToast = add; return () => { _addToast = null; }; }, [add]);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: 72, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.tipo === 'error' ? "#ef4444" : t.tipo === 'warn' ? "#f59e0b" : G,
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 24,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,.18)",
          animation: "toastIn .2s ease",
          whiteSpace: "nowrap",
        }}>
          {t.tipo === 'ok' ? '✓ ' : t.tipo === 'warn' ? '⚠ ' : '✕ '}{t.msg}
        </div>
      ))}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}

export function OfflineBar() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!offline) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9998, background: "#f59e0b", color: "#fff", textAlign: "center", fontSize: 12, fontWeight: 700, padding: "6px 12px", letterSpacing: ".3px" }}>
      Sin conexión — los cambios se guardan localmente
    </div>
  );
}
