import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ManualClassSchedule {
  id: string;
  title: string;
  instructor_name: string;
  class_date: string;
  start_time: string;
  end_time: string;
  max_students: number;
  is_enabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useManualScheduleManagement = () => {
  const [schedules, setSchedules] = useState<ManualClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_class_schedules')
        .select('*')
        .order('class_date', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching manual schedules:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios",
        variant: "destructive",
      });
    }
  };

  const createSchedule = async (
    title: string,
    instructorName: string,
    classDate: Date,
    startTime: string,
    endTime: string,
    maxStudents: number = 10,
    isEnabled: boolean = true,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('create_manual_class_schedule', {
        p_title: title,
        p_instructor_name: instructorName,
        p_class_date: classDate.toISOString().split('T')[0],
        p_start_time: startTime,
        p_end_time: endTime,
        p_max_students: maxStudents,
        p_is_enabled: isEnabled,
        p_notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: isEnabled ? "Clase programada correctamente" : "Clase deshabilitada correctamente",
      });

      await fetchSchedules();
      return data;
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el horario",
        variant: "destructive",
      });
      throw error;
    }
  };

  const toggleSchedule = async (
    classDate: Date,
    startTime: string,
    endTime: string,
    isEnabled: boolean,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('toggle_manual_class_schedule', {
        p_class_date: classDate.toISOString().split('T')[0],
        p_start_time: startTime,
        p_end_time: endTime,
        p_is_enabled: isEnabled,
        p_notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: isEnabled ? "Clase habilitada" : "Clase deshabilitada",
      });

      await fetchSchedules();
      return data;
    } catch (error: any) {
      console.error('Error toggling schedule:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo modificar el horario",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const { data, error } = await supabase.rpc('delete_manual_class_schedule', {
        schedule_id: scheduleId
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Horario eliminado correctamente",
      });

      await fetchSchedules();
      return data;
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el horario",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getAvailableClassesForDateRange = async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase.rpc('get_available_classes_for_date_range', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available classes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las clases disponibles",
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    const loadSchedules = async () => {
      setLoading(true);
      await fetchSchedules();
      setLoading(false);
    };

    loadSchedules();

    // Set up real-time subscription
    const schedulesChannel = supabase
      .channel('manual-schedules-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'manual_class_schedules'
      }, () => {
        fetchSchedules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(schedulesChannel);
    };
  }, []);

  return {
    schedules,
    loading,
    createSchedule,
    toggleSchedule,
    deleteSchedule,
    getAvailableClassesForDateRange,
    refetch: fetchSchedules
  };
};