import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BookingWithFullDetails {
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
    phone: string;
    email: string | null;
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

export const useBookingManagement = () => {
  const [bookings, setBookings] = useState<BookingWithFullDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          attended,
          created_at,
          user_id,
          class_id,
          profiles!inner(
            id,
            first_name,
            last_name,
            phone,
            email,
            user_id
          ),
          classes!inner(
            id,
            title,
            start_time,
            end_time,
            day_of_week,
            instructor
          )
        `)
        .eq('status', 'confirmed')
        .order('booking_date', { ascending: false })
        .order('classes.start_time', { ascending: true });

      if (error) throw error;

      // Get remaining classes for each user
      const bookingsWithClasses = await Promise.all(
        (data || []).map(async (booking: any) => {
          const { data: monthlyData } = await supabase
            .rpc('get_or_create_monthly_classes', { user_uuid: booking.user_id });
          
          return {
            ...booking,
            user_monthly_classes: monthlyData || { remaining_classes: 0 }
          };
        })
      );

      setBookings(bookingsWithClasses);
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
      const { error } = await supabase
        .from('bookings')
        .update({ attended })
        .eq('id', bookingId);

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
      .channel('bookings-management')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
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