import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TrainerBookingWithDetails {
  id: string;
  booking_date: string;
  attended: boolean | null;
  created_at: string;
  user_id: string;
  class_id: string;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    user_id: string;
  };
  class: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    day_of_week: number;
    instructor: string | null;
  };
  user_monthly_classes: {
    remaining_classes: number;
  } | null;
}

export const useTrainerBookingManagement = () => {
  const [bookings, setBookings] = useState<TrainerBookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Get current user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) throw new Error('No authenticated user');
      
      // No longer need trainer's profile - function is secured by RLS and auth

      // Only fetch bookings from today onwards (automatic cleanup of old lists)
      const today = new Date().toISOString().split('T')[0];
      
      // Get all bookings with class details to filter later
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id, 
          booking_date, 
          attended, 
          created_at, 
          user_id, 
          class_id,
          manual_schedule_id,
          classes (
            id,
            title,
            start_time,
            end_time,
            day_of_week,
            instructor
          ),
          manual_class_schedules (
            id,
            title,
            class_date,
            start_time,
            end_time,
            instructor_name
          )
        `)
        .eq('status', 'confirmed')
        .gte('booking_date', today)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      // For trainers, show ALL bookings (like admin panel)
      const relevantBookings = bookingsData || [];

      // Batch fetch related profiles
      const userIds = Array.from(new Set(relevantBookings.map((b: any) => b.user_id)));

      const { data: profilesRes, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, user_id')
        .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profilesRes || []).map((p: any) => [p.user_id, p]));

      // Get remaining classes for each user and assemble full objects
      const bookingsWithDetails = await Promise.all(
        relevantBookings.map(async (booking: any) => {
          const { data: monthlyData } = await supabase
            .rpc('get_or_create_monthly_classes', { user_uuid: booking.user_id });

          const profile = profileMap.get(booking.user_id);
          
          // Extract class info from the joined data
          const classInfo = booking.classes || booking.manual_class_schedules;
          
          return {
            id: booking.id,
            booking_date: booking.booking_date,
            attended: booking.attended,
            created_at: booking.created_at,
            user_id: booking.user_id,
            class_id: booking.class_id || booking.manual_schedule_id,
            profile,
            class: classInfo ? {
              id: classInfo.id,
              title: classInfo.title,
              start_time: classInfo.start_time,
              end_time: classInfo.end_time,
              day_of_week: classInfo.day_of_week || null,
              instructor: classInfo.instructor || classInfo.instructor_name
            } : null,
            user_monthly_classes: monthlyData || { remaining_classes: 0 }
          } as TrainerBookingWithDetails;
        })
      );

      // Filter out any incomplete records
      const complete = bookingsWithDetails.filter(
        (b) => b.profile && b.class
      ) as TrainerBookingWithDetails[];

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
      const { error } = await supabase.rpc('trainer_update_attendance', {
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

    // Set up real-time subscriptions for booking changes and schedule changes
    const bookingsChannel = supabase
      .channel('trainer-bookings-management')
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
        table: 'schedule_overrides' 
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