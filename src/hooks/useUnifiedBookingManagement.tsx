import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UnifiedBookingWithDetails {
  id: string;
  booking_date: string;
  attended: boolean | null;
  created_at: string;
  user_id: string;
  class_id: string | null;
  manual_schedule_id: string | null;
  // For base classes
  class?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    instructor: string | null;
  };
  // For manual schedules
  manual_schedule?: {
    id: string;
    title: string;
    instructor_name: string;
    start_time: string;
    end_time: string;
  };
  // Common fields
  title: string;
  instructor_name: string;
  start_time: string;
  end_time: string;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
    user_id: string;
  };
  user_monthly_classes: {
    remaining_classes: number;
  } | null;
}

export const useUnifiedBookingManagement = () => {
  const [bookings, setBookings] = useState<UnifiedBookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch all bookings with their associated data
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
          class:classes(
            id,
            title,
            start_time,
            end_time,
            instructor
          ),
          manual_schedule:manual_class_schedules(
            id,
            title,
            instructor_name,
            start_time,
            end_time
          ),
          profile:profiles(
            id,
            first_name,
            last_name,
            phone,
            email,
            user_id
          )
        `)
        .eq('status', 'confirmed')
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Transform and enrich the data
      const enrichedBookings = await Promise.all(
        (bookingsData || []).map(async (booking: any) => {
          // Get monthly classes data
          const { data: monthlyData } = await supabase
            .rpc('get_or_create_monthly_classes', { user_uuid: booking.user_id });

          // Normalize the data structure
          let normalizedBooking: UnifiedBookingWithDetails;
          
          if (booking.manual_schedule_id && booking.manual_schedule) {
            // Manual schedule booking
            normalizedBooking = {
              ...booking,
              title: booking.manual_schedule.title,
              instructor_name: booking.manual_schedule.instructor_name,
              start_time: booking.manual_schedule.start_time,
              end_time: booking.manual_schedule.end_time,
              user_monthly_classes: monthlyData || { remaining_classes: 0 }
            };
          } else if (booking.class_id && booking.class) {
            // Base class booking
            normalizedBooking = {
              ...booking,
              title: booking.class.title,
              instructor_name: booking.class.instructor || 'Sin asignar',
              start_time: booking.class.start_time,
              end_time: booking.class.end_time,
              user_monthly_classes: monthlyData || { remaining_classes: 0 }
            };
          } else {
            // Fallback for incomplete data
            return null;
          }

          return normalizedBooking;
        })
      );

      // Filter out any null results and incomplete bookings
      const completeBookings = enrichedBookings.filter(
        (booking): booking is UnifiedBookingWithDetails => 
          booking !== null && !!booking.profile
      );

      setBookings(completeBookings);
    } catch (error) {
      console.error('Error fetching unified bookings:', error);
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
      // Use admin function to update attendance
      const { data, error } = await supabase
        .rpc('admin_update_attendance', {
          booking_uuid: bookingId,
          attendance_status: attended
        });

      if (error) throw error;

      toast({
        title: "Asistencia actualizada",
        description: `Se ha marcado como ${attended ? 'asistido' : 'no asistido'}`,
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

  const updateTrainerAttendance = async (bookingId: string, attended: boolean) => {
    try {
      // Use trainer function to update attendance
      const { data, error } = await supabase
        .rpc('trainer_update_attendance', {
          booking_uuid: bookingId,
          attendance_status: attended
        });

      if (error) throw error;

      toast({
        title: "Asistencia actualizada",
        description: `Se ha marcado como ${attended ? 'asistido' : 'no asistido'}`,
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

    // Set up real-time subscription for booking changes
    const bookingsChannel = supabase
      .channel('unified-bookings-management')
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
        table: 'classes' 
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
    updateTrainerAttendance,
    refetch: fetchBookings
  };
};