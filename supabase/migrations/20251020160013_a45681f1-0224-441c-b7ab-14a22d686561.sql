-- ============================================
-- Configurar cron job para limpieza automática (v2)
-- ============================================

-- Nota: Esta migración crea el cron job directamente sin bloque DO
-- Requiere que pg_cron esté habilitado en Supabase

-- Crear la extensión si no existe
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Eliminar el job si ya existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-past-manual-schedules') THEN
    PERFORM cron.unschedule('cleanup-past-manual-schedules');
  END IF;
END $$;

-- Crear el nuevo job para ejecutar a las 3:00 AM todos los días
SELECT cron.schedule(
  'cleanup-past-manual-schedules',
  '0 3 * * *',
  'SELECT public.cleanup_past_manual_schedules();'
);