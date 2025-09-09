-- Create function to check if trainer can view specific user profile
CREATE OR REPLACE FUNCTION public.trainer_can_view_user_profile(trainer_id uuid, target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if trainer_id is actually a trainer
  IF NOT public.has_role(trainer_id, 'trainer'::app_role) THEN
    RETURN false;
  END IF;
  
  -- Allow trainer to view profiles of users who have bookings for classes/schedules they instruct
  RETURN EXISTS (
    -- Check bookings for regular classes where trainer is assigned as instructor
    SELECT 1 
    FROM public.bookings b
    JOIN public.classes c ON b.class_id = c.id
    WHERE b.user_id = target_user_id 
      AND b.status = 'confirmed'
      AND c.instructor IS NOT NULL
      AND EXISTS (
        -- Check if trainer matches class instructor or is assigned via class_instructors
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = trainer_id 
          AND (c.instructor ILIKE '%' || p.first_name || '%' OR c.instructor ILIKE '%' || p.last_name || '%')
        UNION
        SELECT 1 FROM public.class_instructors ci
        JOIN public.profiles p ON p.user_id = trainer_id
        WHERE ci.class_id = c.id 
          AND (ci.instructor_name ILIKE '%' || p.first_name || '%' OR ci.instructor_name ILIKE '%' || p.last_name || '%')
      )
    
    UNION
    
    -- Check bookings for manual schedules where trainer is the instructor
    SELECT 1 
    FROM public.bookings b
    JOIN public.manual_class_schedules mcs ON b.manual_schedule_id = mcs.id
    JOIN public.profiles p ON p.user_id = trainer_id
    WHERE b.user_id = target_user_id 
      AND b.status = 'confirmed'
      AND (
        mcs.instructor_name ILIKE '%' || p.first_name || '%' 
        OR mcs.instructor_name ILIKE '%' || p.last_name || '%'
        OR mcs.created_by = trainer_id
      )
  );
END;
$function$

-- Update the trainer RLS policy to be more restrictive
DROP POLICY IF EXISTS "Trainers can view all profiles" ON public.profiles;

CREATE POLICY "Trainers can view relevant user profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'trainer'::app_role) 
  AND public.trainer_can_view_user_profile(auth.uid(), user_id)
);

-- Also add policy to allow trainers to view their own profile
CREATE POLICY "Trainers can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'trainer'::app_role) 
  AND auth.uid() = user_id
);