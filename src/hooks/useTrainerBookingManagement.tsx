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
      
      // Use secure function to get all bookings for trainers
      const { data: bookingsData, error: bookingsError } = await supabase
        .rpc('trainer_get_all_bookings');

      if (bookingsError) throw bookingsError;

      // Transform the flat data structure to match the expected interface
      const bookingsWithDetails = (bookingsData || []).map((booking: any) => ({
        id: booking.id,
        booking_date: booking.booking_date,
        attended: booking.attended,
        created_at: booking.created_at,
        user_id: booking.user_id,
        class_id: booking.class_id || booking.manual_schedule_id,
        profile: {
          id: booking.user_id,
          first_name: booking.profile_first_name,
          last_name: booking.profile_last_name,
          user_id: booking.user_id,
        },
        class: {
          id: booking.class_id || booking.manual_schedule_id,
          title: booking.class_title || booking.manual_title,
          start_time: booking.class_start_time || booking.manual_start_time,
          end_time: booking.class_end_time || booking.manual_end_time,
          day_of_week: booking.class_day_of_week || null,
          instructor: booking.class_instructor || booking.manual_instructor_name
        },
        user_monthly_classes: {
          remaining_classes: booking.remaining_classes
        }
      })) as TrainerBookingWithDetails[];

      setBookings(bookingsWithDetails);
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