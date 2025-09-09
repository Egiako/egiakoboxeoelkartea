-- Remove the problematic unified function that's causing errors
DROP FUNCTION IF EXISTS public.get_unified_classes_for_range(date, date);