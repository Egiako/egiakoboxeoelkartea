import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClassException {
  id: string;
  class_id: string;
  exception_date: string;
  override_start_time: string | null;
  override_end_time: string | null;
  override_instructor: string | null;
  override_max_students: number | null;
  is_cancelled: boolean;
  migrate_bookings: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

export interface CreateExceptionParams {
  classId: string;
  exceptionDate: string;
  overrideStartTime?: string;
  overrideEndTime?: string;
  overrideInstructor?: string;
  overrideMaxStudents?: number;
  isCancelled?: boolean;
  migrateBookings?: boolean;
  notes?: string;
}

export const useClassExceptions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createException = async (params: CreateExceptionParams) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('create_class_exception', {
        p_class_id: params.classId,
        p_exception_date: params.exceptionDate,
        p_override_start_time: params.overrideStartTime || null,
        p_override_end_time: params.overrideEndTime || null,
        p_override_instructor: params.overrideInstructor || null,
        p_override_max_students: params.overrideMaxStudents || null,
        p_is_cancelled: params.isCancelled || false,
        p_migrate_bookings: params.migrateBookings ?? true,
        p_notes: params.notes || null
      });

      if (error) throw error;

      const result = data as any;

      toast({
        title: "Excepción creada",
        description: result.message || "Excepción creada exitosamente",
      });

      return result;
    } catch (error: any) {
      console.error('Error creating exception:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la excepción",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteException = async (exceptionId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('delete_class_exception', {
        p_exception_id: exceptionId
      });

      if (error) throw error;

      toast({
        title: "Excepción eliminada",
        description: "La excepción ha sido eliminada y la clase vuelve a su horario normal",
      });

      return data;
    } catch (error: any) {
      console.error('Error deleting exception:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la excepción",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchExceptions = async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('class_exceptions')
        .select('*')
        .gte('exception_date', startDate)
        .lte('exception_date', endDate)
        .order('exception_date', { ascending: true });

      if (error) throw error;

      return data as ClassException[];
    } catch (error: any) {
      console.error('Error fetching exceptions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las excepciones",
        variant: "destructive"
      });
      return [];
    }
  };

  const getScheduleWithExceptions = async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase.rpc('get_schedule_with_exceptions', {
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error fetching schedule with exceptions:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el horario",
        variant: "destructive"
      });
      return [];
    }
  };

  return {
    loading,
    createException,
    deleteException,
    fetchExceptions,
    getScheduleWithExceptions
  };
};
