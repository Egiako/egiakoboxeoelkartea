-- Check existing triggers and remove duplicates
-- First, let's see what triggers we have on the bookings table
SELECT 
    tgname as trigger_name,
    CASE tgtype 
        WHEN 5 THEN 'BEFORE INSERT'
        WHEN 9 THEN 'AFTER DELETE'
        WHEN 7 THEN 'BEFORE INSERT OR UPDATE'
        WHEN 19 THEN 'BEFORE UPDATE'
        WHEN 23 THEN 'BEFORE INSERT OR UPDATE'
    END as trigger_type,
    pg_get_functiondef(tgfoid) as function_definition
FROM pg_trigger 
WHERE tgrelid = (SELECT oid FROM pg_class WHERE relname = 'bookings')
    AND tgname NOT LIKE 'RI_ConstraintTrigger%'
    AND tgisinternal = false;

-- Drop duplicate triggers to fix the double deduction issue
DROP TRIGGER IF EXISTS restore_classes_after_cancel ON public.bookings;
DROP TRIGGER IF EXISTS check_classes_before_booking ON public.bookings;