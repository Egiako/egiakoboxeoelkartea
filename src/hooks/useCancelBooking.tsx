import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CancelResult {
  ok: boolean;
  error?: string;
  message?: string;
  minutes_until_class?: number;
}

interface CanCancelResult {
  can_cancel: boolean;
  reason: string;
  minutes_until_class?: number;
}

export const useCancelBooking = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  /**
   * Valida si una reserva se puede cancelar (sin ejecutar la cancelación)
   * Útil para mostrar/ocultar botones y tooltips en la UI
   */
  const canCancelBooking = async (bookingId: string): Promise<CanCancelResult> => {
    if (!user) {
      return { can_cancel: false, reason: 'not_authenticated' };
    }

    try {
      const { data, error } = await supabase.rpc('can_cancel_booking', {
        _booking_id: bookingId,
        _user_id: user.id
      });

      if (error) throw error;
      return data as unknown as CanCancelResult;
    } catch (error) {
      console.error('Error checking cancellation:', error);
      return { can_cancel: false, reason: 'error' };
    }
  };

  /**
   * Cancela una reserva con validación de ventana de 1 hora usando la función segura
   */
  const cancelBooking = async (bookingId: string, onSuccess?: () => void): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para cancelar reservas",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_reservation_safe', {
        p_booking_id: bookingId,
        p_actor_user_id: user.id
      });

      if (error) throw error;

      const result = data as unknown as CancelResult;

      if (!result.ok) {
        // Manejar diferentes tipos de error
        if (result.error === 'within_time_limit') {
          toast({
            title: "No se puede cancelar la clase",
            description: result.message || "Estás dentro de la hora máxima (1 hora antes del inicio).",
            variant: "destructive"
          });
        } else if (result.error === 'No autorizado para cancelar esta reserva') {
          toast({
            title: "No autorizado",
            description: "No tienes permiso para cancelar esta reserva",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo cancelar la reserva",
            variant: "destructive"
          });
        }
        return false;
      }

      // Cancelación exitosa
      toast({
        title: "Cancelación realizada",
        description: result.message || "Tu reserva se ha cancelado correctamente",
      });

      // Callback de éxito
      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error: any) {
      console.error('Error canceling booking:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la reserva. Intenta de nuevo.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancelación forzada por administrador (sin validación de tiempo)
   */
  const adminForceCancelBooking = async (
    bookingId: string, 
    reason?: string,
    onSuccess?: () => void
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_force_cancel_booking', {
        _booking_id: bookingId,
        _admin_id: user.id,
        _reason: reason || 'Admin override'
      });

      if (error) throw error;

      const result = data as unknown as CancelResult;

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.error || "No se pudo cancelar la reserva",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Cancelación forzada",
        description: result.message || "Reserva cancelada por administrador",
      });

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error: any) {
      console.error('Error forcing cancellation:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la reserva",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    canCancelBooking,
    cancelBooking,
    adminForceCancelBooking
  };
};
