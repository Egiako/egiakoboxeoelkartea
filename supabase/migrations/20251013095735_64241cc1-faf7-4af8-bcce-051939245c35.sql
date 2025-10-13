-- Actualizar la función de validación de reservas para sistema semanal
-- Las reservas se habilitan cada domingo para la siguiente semana (lunes a domingo)

-- Primero eliminar el trigger
DROP TRIGGER IF EXISTS trg_check_booking_advance ON public.bookings;

-- Eliminar la función anterior
DROP FUNCTION IF EXISTS public.check_booking_advance();

-- Crear la nueva función con lógica semanal
CREATE OR REPLACE FUNCTION public.check_booking_advance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  current_day_of_week integer;
  next_monday date;
  next_sunday date;
BEGIN
  -- No permitir fechas pasadas
  IF NEW.booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se pueden reservar fechas pasadas';
  END IF;

  -- Obtener el día de la semana actual (0 = domingo, 1 = lunes, ..., 6 = sábado)
  current_day_of_week := EXTRACT(DOW FROM CURRENT_DATE);

  -- Calcular el próximo lunes y domingo
  -- Si hoy es domingo (0), la semana disponible es la que viene (lunes a domingo)
  IF current_day_of_week = 0 THEN
    next_monday := CURRENT_DATE + INTERVAL '1 day';
    next_sunday := next_monday + INTERVAL '6 days';
  ELSE
    -- No es domingo, calcular el próximo lunes
    next_monday := CURRENT_DATE + INTERVAL '1 day' * (8 - current_day_of_week);
    next_sunday := next_monday + INTERVAL '6 days';
  END IF;

  -- Validar que la fecha de reserva esté dentro del rango permitido
  IF NEW.booking_date < next_monday OR NEW.booking_date > next_sunday THEN
    RAISE EXCEPTION 'Solo puedes reservar clases de la próxima semana (del % al %)', 
      next_monday, next_sunday;
  END IF;

  RETURN NEW;
END;
$function$;

-- Recrear el trigger
CREATE TRIGGER trg_check_booking_advance
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_advance();