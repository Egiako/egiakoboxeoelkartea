import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UnifiedClass {
  is_manual: boolean;
  class_id: string | null;
  manual_schedule_id: string | null;
  title: string;
  instructor_name: string;
  class_date: string;
  start_time: string;
  end_time: string;
  max_students: number;
  is_enabled: boolean;
  notes: string | null;
  current_bookings: number;
}

export interface UserBooking {
  id: string;
  booking_date: string;
  attended: boolean | null;
  created_at: string;
  user_id: string;
  class_id: string | null;
  manual_schedule_id: string | null;
}

export const useUnifiedSchedules = (startDate?: Date, endDate?: Date) => {
  const [classes, setClasses] = useState<UnifiedClass[]>([]);
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUnifiedClasses = async () => {
    try {
      setLoading(true);
      
      const start = startDate || new Date();
      const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const { data, error } = await supabase.rpc('get_unified_classes_for_range', {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0]
      });

      if (error) throw error;

      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching unified classes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      if (error) throw error;

      return (data || []) as UserBooking[];
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas del usuario",
        variant: "destructive"
      });
      return [];
    }
  };

  const bookClass = async (classData: UnifiedClass, userId: string, bookingDate: Date) => {
    try {
      if (classData.is_manual) {
        // Book manual schedule
        const { data, error } = await supabase.rpc('book_manual_schedule', {
          p_user_id: userId,
          p_manual_schedule_id: classData.manual_schedule_id
        });

        if (error) throw error;
      } else {
        // Book base class
        const { error } = await supabase
          .from('bookings')
          .insert([
            {
              user_id: userId,
              class_id: classData.class_id,
              booking_date: bookingDate.toISOString().split('T')[0],
              status: 'confirmed'
            }
          ]);

        if (error) throw error;
      }

      toast({
        title: "¡Reserva confirmada!",
        description: "Tu plaza ha sido reservada exitosamente"
      });

      // Refresh data
      await fetchUnifiedClasses();
      
      return true;
    } catch (error: any) {
      console.error('Error booking class:', error);
      let errorMessage = "No se pudo crear la reserva";
      
      if (error.message.includes('está completa')) {
        errorMessage = "Esta clase ya tiene el máximo de personas";
      } else if (error.message.includes('No tienes clases restantes')) {
        errorMessage = "Has agotado tus clases mensuales";
      } else if (error.message.includes('antelación')) {
        errorMessage = "Solo puedes reservar con un día de antelación como máximo";
      }
      
      toast({
        title: "Error al reservar",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Reserva cancelada",
        description: "Tu reserva ha sido cancelada y la plaza está ahora disponible"
      });

      // Refresh data
      await fetchUnifiedClasses();
      
      return true;
    } catch (error) {
      console.error('Error canceling booking:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva",
        variant: "destructive"
      });
      return false;
    }
  };

  const setUserBookingsState = (bookings: UserBooking[]) => {
    setUserBookings(bookings);
  };

  useEffect(() => {
    fetchUnifiedClasses();

    // Set up real-time subscription for all relevant tables
    const channel = supabase
      .channel('unified-schedules-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'classes' 
      }, () => {
        fetchUnifiedClasses();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'manual_class_schedules' 
      }, () => {
        fetchUnifiedClasses();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'schedule_overrides' 
      }, () => {
        fetchUnifiedClasses();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'class_instructors' 
      }, () => {
        fetchUnifiedClasses();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
      }, () => {
        fetchUnifiedClasses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate]);

  return {
    classes,
    userBookings,
    loading,
    fetchUnifiedClasses,
    fetchUserBookings,
    setUserBookingsState,
    bookClass,
    cancelBooking
  };
};