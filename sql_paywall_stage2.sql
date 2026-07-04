-- ══════════════════════════════════════════════════════════════
-- Docentes — ENFORCEMENT (item 8, paywall). Correr DESPUÉS de stage1.
-- Defensa en profundidad a nivel DB: gatea escritura por acceso vigente
-- cuando las escrituras pasan por el cliente JWT (RLS Fase 2). El bloqueo
-- primario ya lo hace el server (server.cjs). LECTURA intacta. Reversible.
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE t TEXT;
DECLARE tablas TEXT[] := ARRAY[
  'escuelas','docentes','profesionales','alumnos',
  'registros','avisos','documentos','perfiles'
];
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = t AND column_name = 'org_id') THEN
      EXECUTE format('DROP POLICY IF EXISTS acc_ins_%1$s ON %1$s', t);
      EXECUTE format('DROP POLICY IF EXISTS acc_upd_%1$s ON %1$s', t);
      EXECUTE format('CREATE POLICY acc_ins_%1$s ON %1$s AS RESTRICTIVE FOR INSERT WITH CHECK (tiene_acceso(org_id::uuid))', t);
      EXECUTE format('CREATE POLICY acc_upd_%1$s ON %1$s AS RESTRICTIVE FOR UPDATE WITH CHECK (tiene_acceso(org_id::uuid))', t);
    END IF;
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════
-- ROLLBACK:
-- DO $$ DECLARE t TEXT; DECLARE tablas TEXT[] := ARRAY['escuelas','docentes','profesionales','alumnos','registros','avisos','documentos','perfiles'];
-- BEGIN FOREACH t IN ARRAY tablas LOOP
--   EXECUTE format('DROP POLICY IF EXISTS acc_ins_%1$s ON %1$s', t);
--   EXECUTE format('DROP POLICY IF EXISTS acc_upd_%1$s ON %1$s', t);
-- END LOOP; END $$;
-- ══════════════════════════════════════════════════════════════
