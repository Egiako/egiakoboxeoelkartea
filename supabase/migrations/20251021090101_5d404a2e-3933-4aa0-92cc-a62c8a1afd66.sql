-- Replace cancel_reservation_safe to use a typed bookings variable and avoid record casts
CREATE OR REPLACE FUNCTION public.cancel_reservation_safe(
  p_booking_id uuid,
  p_actor_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking public.bookings;
  v_start_time timestamptz;
  diff_minutes numeric;
  v_is_admin boolean;
BEGIN
  -- Cargar la reserva completa en una variable tipada
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND OR v_booking.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Reserva no encontrada');
  END IF;

  -- Verificar estado
  IF v_booking.status <> 'confirmed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'La reserva no está confirmada');
  END IF;

  -- Verificar autorización
  v_is_admin := has_role(p_actor_user_id, 'admin'::app_role);
  IF v_booking.user_id <> p_actor_user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autorizado para cancelar esta reserva');
  END IF;

  -- Obtener hora de inicio real con excepciones/clases manuales
  v_start_time := public.get_booking_start_time(v_booking);

  -- Calcular diferencia en minutos (UTC seguro)
  diff_minutes := EXTRACT(EPOCH FROM (v_start_time AT TIME ZONE 'UTC' - NOW() AT TIME ZONE 'UTC')) / 60;

  -- Bloqueo de 60 minutos para usuarios (admin puede forzar)
  IF NOT v_is_admin AND diff_minutes <= 60 THEN
    RAISE NOTICE 'Bloqueo de cancelación: booking_id=%, user_id=%, diff_minutes=%', v_booking.id, v_booking.user_id, diff_minutes;
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'within_time_limit',
      'message', 'No se puede cancelar la clase. Estás dentro de la hora máxima (1 hora antes del inicio).',
      'minutes_until_class', FLOOR(diff_minutes)
    );
  END IF;

  -- Ejecutar cancelación
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_actor_user_id,
    cancelled_reason = CASE 
      WHEN v_is_admin AND diff_minutes <= 60 THEN 'admin_override'
      ELSE 'user_cancellation'
    END,
    updated_at = NOW()
  WHERE id = v_booking.id;

  -- Devolver clase al usuario del mes actual
  UPDATE public.user_monthly_classes
  SET remaining_classes = remaining_classes + 1,
      updated_at = NOW()
  WHERE user_id = v_booking.user_id
    AND month = EXTRACT(MONTH FROM CURRENT_DATE)
    AND year = EXTRACT(YEAR FROM CURRENT_DATE);

  -- Recalcular capacidad sólo para clases periódicas
  IF v_booking.class_id IS NOT NULL THEN
    PERFORM public.recompute_class_capacity(v_booking.class_id);
  END IF;

  RAISE NOTICE 'Cancelación OK: booking_id=%, admin=%', v_booking.id, v_is_admin;

  RETURN jsonb_build_object(
    'ok', true,
    'message', CASE 
      WHEN v_is_admin AND diff_minutes <= 60 THEN 'Cancelación realizada por administrador'
      ELSE 'Tu reserva se ha cancelado correctamente'
    END
  );
END;
$$;