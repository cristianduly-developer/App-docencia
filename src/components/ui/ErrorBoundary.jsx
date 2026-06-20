import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e) { console.error('[ErrorBoundary]', e); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>No se pudo cargar esta sección</div>
        <button onClick={() => this.setState({ error: null })}
          style={{ padding: "8px 20px", borderRadius: 12, border: "none", background: "#2D6A4F", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Reintentar
        </button>
      </div>
    );
    return this.props.children;
  }
}
