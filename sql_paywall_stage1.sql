-- ══════════════════════════════════════════════════════════════
-- Docentes — Espejo de acceso por tenant (item 8, paywall)
-- STAGE 1: solo crea tabla y función. NO enforca nada.
-- tenant_id = org_id central (igual que la columna org_id de todas las tablas).
-- Correr en el Supabase de Docentes.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tenant_access (
  tenant_id   UUID PRIMARY KEY,   -- = org_id central
  plan        TEXT,
  valid_until TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '3650 days'
);
ALTER TABLE tenant_access ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo accesible por service role (deny-all para clientes).

-- FAIL-OPEN: si el tenant no tiene fila todavía, permite (no rompe el rollout).
CREATE OR REPLACE FUNCTION tiene_acceso(tid UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT valid_until > now() FROM tenant_access WHERE tenant_id = tid), TRUE);
$$;

-- ══════════════════════════════════════════════════════════════
-- FIN STAGE 1. El server pobla tenant_access en cada login.
-- Verificá: SELECT * FROM tenant_access;
-- Cuando se llene, correr STAGE 2.
-- ══════════════════════════════════════════════════════════════
