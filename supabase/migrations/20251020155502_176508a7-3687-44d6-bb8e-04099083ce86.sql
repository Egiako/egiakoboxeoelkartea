-- ============================================
-- CORRECCIÓN: Gestión de clases esporádicas (v2)
-- ============================================

-- 1) Eliminar función existente si existe
DROP FUNCTION IF EXISTS public.delete_manual_class_schedule(uuid);

-- 2) Crear función para eliminar clases esporádicas con validación de reservas
CREATE OR REPLACE FUNCTION public.delete_manual_class_schedule(schedule_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_bookings integer;
  v_schedule_record manual_class_schedules;
BEGIN
  -- Verificar permisos
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden eliminar clases esporádicas';
  END IF;

  -- Obtener el registro de la clase
  SELECT * INTO v_schedule_record
  FROM public.manual_class_schedules
  WHERE id = schedule_id;

  IF v_schedule_record IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Clase esporádica no encontrada'
    );
  END IF;

  -- Verificar si hay reservas activas (confirmadas) para esta clase
  SELECT COUNT(*) INTO v_active_bookings
  FROM public.bookings
  WHERE manual_schedule_id = schedule_id
    AND status = 'confirmed';

  -- Si hay reservas activas, no permitir la eliminación
  IF v_active_bookings > 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'No se puede eliminar una clase que tiene reservas activas',
      'active_bookings', v_active_bookings
    );
  END IF;

  -- Si no hay reservas activas, eliminar la clase
  -- Primero cancelar cualquier reserva cancelada (para limpieza)
  DELETE FROM public.bookings
  WHERE manual_schedule_id = schedule_id
    AND status = 'cancelled';

  -- Eliminar la clase esporádica
  DELETE FROM public.manual_class_schedules
  WHERE id = schedule_id;

  RETURN jsonb_build_object(
    'ok', true,
    'message', 'Clase esporádica eliminada correctamente'
  );
END;
$$;

-- 3) Función para limpiar clases esporádicas pasadas automáticamente
CREATE OR REPLACE FUNCTION public.cleanup_past_manual_schedules()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count integer;
  v_cutoff_time timestamptz;
BEGIN
  -- Calcular el timestamp de hace 1 hora
  v_cutoff_time := NOW() - interval '1 hour';

  -- Eliminar clases esporádicas que:
  -- 1. Ya pasaron (class_date + end_time < now - 1 hour)
  -- 2. No tienen reservas confirmadas pendientes
  WITH past_schedules AS (
    SELECT mcs.id
    FROM public.manual_class_schedules mcs
    WHERE (mcs.class_date + mcs.end_time::time) < v_cutoff_time
      AND NOT EXISTS (
        SELECT 1 
        FROM public.bookings b
        WHERE b.manual_schedule_id = mcs.id
          AND b.status = 'confirmed'
      )
  )
  DELETE FROM public.manual_class_schedules
  WHERE id IN (SELECT id FROM past_schedules);

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- También limpiar reservas canceladas de clases pasadas
  DELETE FROM public.bookings b
  WHERE b.manual_schedule_id IS NOT NULL
    AND b.status = 'cancelled'
    AND b.booking_date < CURRENT_DATE - interval '7 days';

  RETURN jsonb_build_object(
    'ok', true,
    'deleted_schedules', v_deleted_count,
    'message', format('Limpieza completada: %s clases esporádicas eliminadas', v_deleted_count)
  );
END;
$$;

-- 4) Ejecutar la limpieza una vez para limpiar datos existentes
SELECT public.cleanup_past_manual_schedules();