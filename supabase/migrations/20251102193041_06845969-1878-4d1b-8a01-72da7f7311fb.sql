-- Drop existing function
drop function if exists public.get_booking_counts(date[]);

-- Recreate with correct return type
create or replace function public.get_booking_counts(_dates date[])
returns table(class_key text, booking_date date, count integer)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(b.class_id::text, b.manual_schedule_id::text) as class_key,
         b.booking_date::date as booking_date,
         count(*)::int as count
  from public.bookings b
  where b.status = 'confirmed'
    and b.booking_date = any(_dates)
  group by 1,2
$$;

revoke all on function public.get_booking_counts(date[]) from public;
grant execute on function public.get_booking_counts(date[]) to authenticated;