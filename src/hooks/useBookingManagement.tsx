import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BookingWithFullDetails {
  id: string;
  booking_date: string;
  attended: boolean | null;
  created_at: string;
  user_id: string;
  class_id: string | null;
  manual_schedule_id: string | null;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
    user_id: string;
  };
  class: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    day_of_week: number | null;
    instructor: string | null;
  };
  user_monthly_classes: {
    remaining_classes: number;
  } | null;
}

export const useBookingManagement = () => {
  const [bookings, setBookings] = useState<BookingWithFullDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Only fetch bookings from today onwards (automatic cleanup of old lists)
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch bookings with both regular and manual schedule IDs
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, booking_date, attended, created_at, user_id, class_id, manual_schedule_id')
        .eq('status', 'confirmed')
        .gte('booking_date', today)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Batch fetch related profiles, classes, and manual schedules to avoid N+1 queries
      const userIds = Array.from(new Set((bookingsData || []).map((b: any) => b.user_id)));
      const classIds = Array.from(new Set((bookingsData || []).map((b: any) => b.class_id).filter(Boolean)));
      const manualScheduleIds = Array.from(new Set((bookingsData || []).map((b: any) => b.manual_schedule_id).filter(Boolean)));

      const [profilesRes, classesRes, manualSchedulesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name, phone, email, user_id')
          .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
        supabase
          .from('classes')
          .select('id, title, start_time, end_time, day_of_week, instructor')
          .in('id', classIds.length ? classIds : ['00000000-0000-0000-0000-000000000000']),
        supabase
          .from('manual_class_schedules')
          .select('id, title, start_time, end_time, instructor_name, class_date')
          .in('id', manualScheduleIds.length ? manualScheduleIds : ['00000000-0000-0000-0000-000000000000'])
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const classMap = new Map((classesRes.data || []).map((c: any) => [c.id, c]));
      const manualScheduleMap = new Map((manualSchedulesRes.data || []).map((m: any) => [m.id, m]));

      // Get remaining classes for each user and assemble full objects
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking: any) => {
          const { data: monthlyData } = await supabase
            .rpc('get_or_create_monthly_classes', { user_uuid: booking.user_id });

          const profile = profileMap.get(booking.user_id);
          
          // Get class info from either regular class or manual schedule
          let classInfo;
          if (booking.class_id) {
            const regularClass = classMap.get(booking.class_id);
            classInfo = regularClass ? {
              id: regularClass.id,
              title: regularClass.title,
              start_time: regularClass.start_time,
              end_time: regularClass.end_time,
              day_of_week: regularClass.day_of_week,
              instructor: regularClass.instructor
            } : null;
          } else if (booking.manual_schedule_id) {
            const manualClass = manualScheduleMap.get(booking.manual_schedule_id);
            classInfo = manualClass ? {
              id: manualClass.id,
              title: manualClass.title,
              start_time: manualClass.start_time,
              end_time: manualClass.end_time,
              day_of_week: null,
              instructor: manualClass.instructor_name
            } : null;
          }

          return {
            ...booking,
            profile,
            class: classInfo,
            user_monthly_classes: monthlyData || { remaining_classes: 0 }
          } as BookingWithFullDetails;
        })
      );

      // Filter out any incomplete records to prevent runtime errors
      const complete = bookingsWithDetails.filter(
        (b) => b.profile && b.class
      ) as BookingWithFullDetails[];

      setBookings(complete);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (bookingId: string, attended: boolean) => {
    try {
      const { error } = await supabase.rpc('admin_update_attendance', {
        booking_uuid: bookingId,
        attendance_status: attended
      });

      if (error) throw error;

      toast({
        title: "Asistencia actualizada",
        description: `Se ha marcado como ${attended ? 'asistido' : 'no asistido'}${
          !attended ? ' y se ha descontado 1 clase' : ''
        }`,
      });

      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la asistencia",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchBookings();

    // Set up real-time subscriptions for booking and schedule changes
    const bookingsChannel = supabase
      .channel('bookings-management')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
      }, () => {
        fetchBookings();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'manual_class_schedules' 
      }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
    };
  }, []);

  return {
    bookings,
    loading,
    updateAttendance,
    refetch: fetchBookings
  };
};