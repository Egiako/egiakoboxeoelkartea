-- Remove trainer access to user_monthly_classes table completely
-- Trainers should only access data through controlled RPC functions
DROP POLICY IF EXISTS "Trainers see only users with bookings" ON public.user_monthly_classes;

-- Drop existing function to allow modification of return type
DROP FUNCTION IF EXISTS public.trainer_get_all_bookings();

-- Create updated function that doesn't expose sensitive subscription data
-- Only indicates if user has classes available, not the exact count
CREATE FUNCTION public.trainer_get_all_bookings()
RETURNS TABLE(
  id uuid,
  booking_date date,
  attended boolean,
  created_at timestamp with time zone,
  user_id uuid,
  class_id uuid,
  manual_schedule_id uuid,
  status text,
  class_title text,
  class_start_time time without time zone,
  class_end_time time without time zone,
  class_day_of_week integer,
  class_instructor text,
  manual_title text,
  manual_class_date date,
  manual_start_time time without time zone,
  manual_end_time time without time zone,
  manual_instructor_name text,
  profile_first_name text,
  profile_last_name text,
  has_classes_available boolean  -- Changed from remaining_classes integer to boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  today date := CURRENT_DATE;
BEGIN
  -- Verify caller is authorized trainer
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.user_roles ur ON p.user_id = ur.user_id
      WHERE p.user_id = auth.uid()
        AND ur.role = 'trainer'
        AND p.is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: solo entrenadores autorizados pueden acceder a esta función';
  END IF;

  -- Return all confirmed bookings from today onwards
  -- Only expose if user has classes available, not the exact count
  RETURN QUERY
    SELECT 
      b.id,
      b.booking_date,
      b.attended,
      b.created_at,
      b.user_id,
      b.class_id,
      b.manual_schedule_id,
      b.status,
      c.title as class_title,
      c.start_time as class_start_time,
      c.end_time as class_end_time,
      c.day_of_week as class_day_of_week,
      c.instructor as class_instructor,
      mcs.title as manual_title,
      mcs.class_date as manual_class_date,
      mcs.start_time as manual_start_time,
      mcs.end_time as manual_end_time,
      mcs.instructor_name as manual_instructor_name,
      p.first_name as profile_first_name,
      p.last_name as profile_last_name,
      COALESCE(umc.remaining_classes > 0, false) as has_classes_available  -- Boolean instead of count
    FROM public.bookings b
    LEFT JOIN public.classes c ON b.class_id = c.id
    LEFT JOIN public.manual_class_schedules mcs ON b.manual_schedule_id = mcs.id
    LEFT JOIN public.profiles p ON b.user_id = p.user_id
    LEFT JOIN public.user_monthly_classes umc ON (
      b.user_id = umc.user_id 
      AND umc.month = EXTRACT(month FROM CURRENT_DATE)
      AND umc.year = EXTRACT(year FROM CURRENT_DATE)
    )
    WHERE b.status = 'confirmed'
      AND b.booking_date >= today
      AND p.is_active = true
      AND p.approval_status = 'approved'
    ORDER BY b.booking_date DESC, 
             COALESCE(c.start_time, mcs.start_time) ASC;
END;
$$;

-- Update table documentation
COMMENT ON TABLE public.user_monthly_classes IS 
'Tracks monthly class allowances per user. Contains sensitive subscription data.
Protected by baseline deny-all policy with explicit grants for:
- Users can view their own records (when approved and active)
- Admins can view/modify all records
- Trainers have NO direct access (use controlled RPC functions only)
- All other access explicitly denied';

COMMENT ON FUNCTION public.trainer_get_all_bookings() IS 
'Returns booking data for trainers without exposing sensitive subscription information. 
Only indicates if user has classes available (boolean), not the exact count or max limit.';