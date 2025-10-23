import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ManualSchedule {
  id: string;
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

export interface ManualScheduleBooking {
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
  };
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
  };
}

export const useManualSchedules = (startDate?: Date, endDate?: Date) => {
  const [schedules, setSchedules] = useState<ManualSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      
      const start = startDate || new Date();
      const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const { data, error } = await supabase.rpc('get_manual_schedules_for_booking', {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0]
      });

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching manual schedules:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const bookSchedule = async (scheduleId: string, userId: string, bookingDate: Date) => {
    try {
      const { data, error } = await supabase.rpc('create_reservation_safe', {
        p_user_id: userId,
        p_booking_date: bookingDate.toISOString().split('T')[0],
        p_class_id: null,
        p_manual_schedule_id: scheduleId
      });

      if (error) throw error;

      const result = data as unknown as { ok: boolean; error?: string; message?: string };
      if (!result?.ok) {
        throw new Error(result?.error || 'No se pudo crear la reserva');
      }

      toast({
        title: "¡Reserva confirmada!",
        description: result.message || "Tu plaza ha sido reservada exitosamente"
      });

      // Schedules and monthly classes will update via realtime subscriptions
      
      return data;
    } catch (error: any) {
      console.error('Error booking schedule:', error);
      let errorMessage = "No se pudo crear la reserva";
      
      if (error.message?.includes('está completa')) {
        errorMessage = "Esta clase ya tiene el máximo de personas";
      } else if (error.message?.includes('No tienes clases restantes')) {
        errorMessage = "Has agotado tus clases mensuales";
      } else if (error.message?.includes('no autorizado')) {
        errorMessage = "No tienes permisos para hacer reservas";
      } else if (error.message?.includes('antelación')) {
        errorMessage = "Solo puedes reservar con un día de antelación como máximo";
      }
      
      toast({
        title: "Error al reservar",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  };

  const getUserBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
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
            max_students
          ),
          profile:profiles(
            id,
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .not('manual_schedule_id', 'is', null)
        .order('booking_date', { ascending: false });

      if (error) throw error;

      return (data || []) as ManualScheduleBooking[];
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

  const cancelBooking = async (bookingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "Usuario no autenticado",
          variant: "destructive"
        });
        return false;
      }

      // First check if booking can be cancelled (time validation)
      const { data: canCancelData, error: canCancelError } = await supabase.rpc('can_cancel_booking', {
        _booking_id: bookingId,
        _user_id: user.id
      });

      if (canCancelError) throw canCancelError;

      const canCancelResult = canCancelData as { can_cancel: boolean; reason: string; minutes_until_class?: number };

      if (!canCancelResult.can_cancel) {
        if (canCancelResult.reason === 'within_time_limit') {
          toast({
            title: "No se puede cancelar",
            description: "Estás dentro de la hora para el inicio.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "No se puede cancelar",
            description: "No tienes permiso para cancelar esta reserva",
            variant: "destructive"
          });
        }
        return false;
      }

      // Proceed with cancellation
      const { data, error } = await supabase.rpc('cancel_booking_if_allowed', {
        _booking_id: bookingId,
        _requesting_user: user.id
      });

      if (error) throw error;

      const result = data as unknown as { ok: boolean; error?: string; message?: string };

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.error || "No se pudo cancelar la reserva",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Cancelación realizada",
        description: result.message || "Tu reserva se ha cancelado correctamente"
      });

      // Schedules and monthly classes will update via realtime subscriptions
      
      return true;
    } catch (error: any) {
      console.error('Error canceling booking:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la reserva. Intenta de nuevo.",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSchedules();

    // Set up real-time subscription for schedule changes
    const schedulesChannel = supabase
      .channel('manual-schedules-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'manual_class_schedules' 
      }, () => {
        fetchSchedules();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
      }, () => {
        fetchSchedules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(schedulesChannel);
    };
  }, [startDate, endDate]);

  return {
    schedules,
    loading,
    fetchSchedules,
    bookSchedule,
    getUserBookings,
    cancelBooking
  };
};