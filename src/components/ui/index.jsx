import React from 'react';
import { G, GR, GL, BD, TX } from '../../constants';

export const Tag = ({ text, bg = "#333" }) =>
  <span style={{ display:"inline-flex", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700,
    color:"#fff", background:bg, textTransform:"uppercase", whiteSpace:"nowrap" }}>{text}</span>;

export const Avatar = ({ nombre = "", size = 40, bg = G }) =>
  <div style={{ width:size, height:size, borderRadius:"50%", background:bg, flexShrink:0,
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*.35, fontWeight:800, color:"#fff" }}>
    {nombre.split(" ").slice(0, 2).map(p => p[0]).join("")}
  </div>;

export const Card = ({ children, sx, onClick }) =>
  <div onClick={onClick}
    style={{ background:"#fff", borderRadius:16, boxShadow:"0 2px 12px rgba(0,0,0,.07)",
      padding:16, marginBottom:12, cursor:onClick?"pointer":"default", ...sx }}
    onMouseEnter={e => onClick && (e.currentTarget.style.transform = "translateY(-2px)")}
    onMouseLeave={e => onClick && (e.currentTarget.style.transform = "translateY(0)")}>
    {children}
  </div>;

export const Btn = ({ children, onClick, color = G, outline, small, full, disabled, danger }) => {
  const bg = disabled ? "#e2e8f0" : outline ? "transparent" : danger ? "#dc2626" : color;
  const fg = disabled ? GL : outline ? (danger ? "#dc2626" : color) : "#fff";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:bg, color:fg,
        border: outline ? `2px solid ${danger ? "#dc2626" : color}` : "none",
        borderRadius:10, padding:small?"6px 14px":"12px 20px",
        fontSize:small?13:15, fontWeight:700,
        cursor:disabled?"not-allowed":"pointer",
        width:full?"100%":"auto", fontFamily:"inherit" }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = ".85")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
      {children}
    </button>
  );
};

export const Fld = ({ label, value, onChange, type = "text", multiline, placeholder, req }) => {
  const s = {
    width:"100%", border:`1.5px solid ${BD}`, borderRadius:10,
    padding:"10px 14px", fontSize:14, fontFamily:"inherit", color:TX,
    background:"#f8fafc", boxSizing:"border-box", outline:"none",
    resize:multiline?"vertical":"none", minHeight:multiline?80:"auto",
  };
  return (
    <div style={{ marginBottom:14 }}>
      {label && (
        <div style={{ fontSize:12, fontWeight:700, color:GR, marginBottom:6,
          textTransform:"uppercase", letterSpacing:.5 }}>
          {label}{req && <span style={{ color:"#dc2626" }}> *</span>}
        </div>
      )}
      {multiline
        ? <textarea value={value || ""} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} style={s}/>
        : <input type={type} value={value || ""} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} style={s}/>
      }
    </div>
  );
};

export const Sel = ({ label, value, onChange, opts, ph }) =>
  <div style={{ marginBottom:14 }}>
    {label && <div style={{ fontSize:12, fontWeight:700, color:GR, marginBottom:6,
      textTransform:"uppercase", letterSpacing:.5 }}>{label}</div>}
    <select value={value || ""} onChange={e => onChange(e.target.value)}
      style={{ width:"100%", border:`1.5px solid ${BD}`, borderRadius:10,
        padding:"10px 14px", fontSize:14, fontFamily:"inherit",
        background:"#f8fafc", color:TX, boxSizing:"border-box" }}>
      {ph && <option value="">{ph}</option>}
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>;

export const SecT = ({ text }) =>
  <div style={{ fontSize:12, fontWeight:700, color:GR, textTransform:"uppercase",
    letterSpacing:.5, marginBottom:10, marginTop:4 }}>{text}</div>;

export const WA = ({ tel }) =>
  tel ? <a href={`https://wa.me/54${tel.replace(/[-\s]/g,"")}`} target="_blank" rel="noreferrer"
    style={{ background:"#25D366", color:"#fff", borderRadius:8, padding:"5px 10px",
      fontSize:12, fontWeight:700, textDecoration:"none", flexShrink:0 }}>WhatsApp</a> : null;

export const Mail = ({ mail }) =>
  mail ? <a href={`mailto:${mail}`}
    style={{ background:"#3b82f6", color:"#fff", borderRadius:8, padding:"5px 10px",
      fontSize:12, fontWeight:700, textDecoration:"none", flexShrink:0 }}>Mail</a> : null;

export const Confirm = ({ msg, onOk, onNo }) =>
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)",
    display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:24 }}>
    <div style={{ background:"#fff", borderRadius:20, padding:28, maxWidth:340, width:"100%" }}>
      <div style={{ fontSize:36, textAlign:"center", marginBottom:12 }}>⚠️</div>
      <div style={{ fontWeight:800, fontSize:17, textAlign:"center", marginBottom:8 }}>¿Estás segura?</div>
      <div style={{ fontSize:14, color:GR, textAlign:"center", lineHeight:1.5, marginBottom:24 }}>
        {msg}
        <div style={{ marginTop:8, fontSize:12, color:"#dc2626", fontWeight:600 }}>
          Esta acción no se puede deshacer.
        </div>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <Btn full outline onClick={onNo} color={GR}>Cancelar</Btn>
        <Btn full danger onClick={onOk}>Sí, eliminar</Btn>
      </div>
    </div>
  </div>;
