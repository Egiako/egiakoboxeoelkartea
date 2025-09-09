import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ManualBookingWithDetails {
  id: string;
  booking_date: string;
  attended: boolean | null;
  created_at: string;
  user_id: string;
  manual_schedule_id: string;
  manual_schedule: {
    id: string;
    title: string;
    instructor_name: string;
    class_date: string;
    start_time: string;
    end_time: string;
    max_students: number;
    notes: string | null;
  };
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

export const useManualBookingManagement = () => {
  const [bookings, setBookings] = useState<ManualBookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          attended,
          created_at,
          user_id,
          manual_schedule_id,
          manual_schedule:manual_class_schedules(
            id,
            title,
            instructor_name,
            class_date,
            start_time,
            end_time,
            max_students,
            notes
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
        .not('manual_schedule_id', 'is', null)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Get remaining classes for each user
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking: any) => {
          const { data: monthlyData } = await supabase
            .rpc('get_or_create_monthly_classes', { user_uuid: booking.user_id });

          return {
            ...booking,
            user_monthly_classes: monthlyData || { remaining_classes: 0 }
          } as ManualBookingWithDetails;
        })
      );

      // Filter out any incomplete records
      const complete = bookingsWithDetails.filter(
        (b) => b.profile && b.manual_schedule
      ) as ManualBookingWithDetails[];

      setBookings(complete);
    } catch (error) {
      console.error('Error fetching manual bookings:', error);
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
      .channel('manual-bookings-management')
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
    updateTrainerAttendance,
    refetch: fetchBookings
  };
};