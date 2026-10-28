CREATE OR REPLACE FUNCTION public.enforce_booking_two_hour_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'confirmed' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer') THEN RETURN NEW; END IF;
  IF public.get_booking_start_time(NEW) - now() < interval '2 hours' THEN
    RAISE EXCEPTION 'No se puede reservar. Quedan menos de 2 horas para el inicio de la clase.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS booking_two_hour_limit ON public.bookings;
CREATE TRIGGER booking_two_hour_limit BEFORE INSERT OR UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_two_hour_limit();