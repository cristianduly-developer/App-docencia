import React, { createContext, useContext, useState } from 'react';

// Global mutable values (matching production app pattern)
// These are updated on login and used by Reportes + PDF generation
export const appState = {
  nombreDocente: 'Docente de Inclusión',
  planDocente:   'basico',
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [nombreDocente, setNombreDocente] = useState('Docente de Inclusión');
  const [planDocente,   setPlanDocente]   = useState('basico');

  const setDocente = (nombre, plan) => {
    setNombreDocente(nombre || 'Docente de Inclusión');
    setPlanDocente(plan   || 'basico');
    appState.nombreDocente = nombre || 'Docente de Inclusión';
    appState.planDocente   = plan   || 'basico';
  };

  return (
    <AppContext.Provider value={{ nombreDocente, planDocente, setDocente }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
