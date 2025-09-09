-- Step 2: Create trainer-related functions and policies

-- Function to check if user is trainer for the specific email
CREATE OR REPLACE FUNCTION public.is_specific_trainer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE p.user_id = _user_id
      AND p.email = 'etius93.xb@gmail.com'
      AND ur.role = 'trainer'
      AND p.is_active = true
  )
$$;

-- Assign trainer role to specific email if profile exists
DO $$
DECLARE
  trainer_user_id uuid;
BEGIN
  -- Find user by email
  SELECT user_id INTO trainer_user_id
  FROM public.profiles
  WHERE email = 'etius93.xb@gmail.com'
  LIMIT 1;
  
  -- If user exists, assign trainer role
  IF trainer_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (trainer_user_id, 'trainer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Allow trainers to view all profiles (read-only)
CREATE POLICY "Trainers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'trainer'::app_role));

-- Allow trainers to view all bookings
CREATE POLICY "Trainers can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'trainer'::app_role));

-- Allow trainers to update booking attendance
CREATE POLICY "Trainers can update booking attendance"
ON public.bookings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'trainer'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'trainer'::app_role));

-- Allow trainers to view all monthly classes
CREATE POLICY "Trainers can view all monthly classes"
ON public.user_monthly_classes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'trainer'::app_role));

-- Function for trainer to update attendance
CREATE OR REPLACE FUNCTION public.trainer_update_attendance(booking_uuid uuid, attendance_status boolean)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$ 
DECLARE
  booking_record public.bookings;
BEGIN
  -- Check if current user is trainer
  IF NOT public.has_role(auth.uid(), 'trainer'::app_role) THEN
    RAISE EXCEPTION 'Solo los entrenadores pueden actualizar la asistencia';
  END IF;
  
  -- Update attendance status
  UPDATE public.bookings
  SET attended = attendance_status,
      updated_at = now()
  WHERE id = booking_uuid
  RETURNING * INTO booking_record;
  
  IF booking_record IS NULL THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;
  
  -- If marked as not attended, penalize by removing 1 class
  IF attendance_status = false THEN
    UPDATE public.user_monthly_classes
    SET remaining_classes = GREATEST(0, remaining_classes - 1),
        updated_at = now()
    WHERE user_id = booking_record.user_id
      AND month = EXTRACT(month FROM CURRENT_DATE)
      AND year = EXTRACT(year FROM CURRENT_DATE);
  END IF;
  
  RETURN booking_record;
END;
$function$;