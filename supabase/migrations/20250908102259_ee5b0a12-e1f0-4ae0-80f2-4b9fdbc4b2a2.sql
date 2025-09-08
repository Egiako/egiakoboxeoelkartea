-- Add attendance field to bookings table
ALTER TABLE public.bookings 
ADD COLUMN attended BOOLEAN DEFAULT NULL;

-- Add index for better performance on booking queries
CREATE INDEX idx_bookings_class_date ON public.bookings(class_id, booking_date);
CREATE INDEX idx_bookings_attended ON public.bookings(attended);

-- Add RLS policy for admins to update attendance
CREATE POLICY "Admins can update booking attendance" 
ON public.bookings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Create function to update attendance
CREATE OR REPLACE FUNCTION public.admin_update_attendance(
  booking_uuid uuid, 
  attendance_status boolean
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ 
DECLARE
  booking_record public.bookings;
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden actualizar la asistencia';
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
  
  RETURN booking_record;
END;
$$;