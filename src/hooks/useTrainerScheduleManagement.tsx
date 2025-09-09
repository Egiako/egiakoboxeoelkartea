import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClassInstructor {
  id: string;
  class_id: string;
  instructor_name: string;
  specific_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleOverride {
  id: string;
  class_id: string;
  override_date: string;
  is_enabled: boolean;
  instructor_override: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassScheduleForDate {
  class_id: string;
  title: string;
  instructor: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_students: number;
  is_active: boolean;
  is_special_day: boolean;
  override_notes: string | null;
}

export const useTrainerScheduleManagement = () => {
  const [instructors, setInstructors] = useState<ClassInstructor[]>([]);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [scheduleForDate, setScheduleForDate] = useState<ClassScheduleForDate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('class_instructors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los instructores",
        variant: "destructive",
      });
    }
  };

  const fetchOverrides = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_overrides')
        .select('*')
        .order('override_date', { ascending: true });

      if (error) throw error;
      setOverrides(data || []);
    } catch (error) {
      console.error('Error fetching overrides:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las modificaciones de horario",
        variant: "destructive",
      });
    }
  };

  const fetchScheduleForDate = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('get_class_schedule_for_date', {
        target_date: dateStr
      });

      if (error) throw error;
      setScheduleForDate(data || []);
    } catch (error) {
      console.error('Error fetching schedule for date:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios para esta fecha",
        variant: "destructive",
      });
    }
  };

  const setClassInstructor = async (
    classId: string, 
    instructorName: string, 
    specificDate?: Date
  ) => {
    try {
      const { data, error } = await supabase.rpc('set_class_instructor', {
        target_class_id: classId,
        instructor_name: instructorName,
        specific_date: specificDate ? specificDate.toISOString().split('T')[0] : null
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Instructor asignado correctamente",
      });

      await fetchInstructors();
      return data;
    } catch (error) {
      console.error('Error setting instructor:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el instructor",
        variant: "destructive",
      });
      throw error;
    }
  };

  const setScheduleOverride = async (
    classId: string,
    date: Date,
    isEnabled: boolean,
    instructorOverride?: string,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('set_schedule_override', {
        target_class_id: classId,
        target_date: date.toISOString().split('T')[0],
        is_enabled: isEnabled,
        instructor_override: instructorOverride || null,
        notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: isEnabled ? "Día especial habilitado" : "Día/clase deshabilitado",
      });

      await fetchOverrides();
      return data;
    } catch (error) {
      console.error('Error setting schedule override:', error);
      toast({
        title: "Error",
        description: "No se pudo modificar el horario",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchInstructors(), fetchOverrides()]);
      setLoading(false);
    };

    fetchData();

    // Set up real-time subscriptions
    const instructorsChannel = supabase
      .channel('instructor-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'class_instructors'
      }, () => {
        fetchInstructors();
      })
      .subscribe();

    const overridesChannel = supabase
      .channel('override-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'schedule_overrides'
      }, () => {
        fetchOverrides();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(instructorsChannel);
      supabase.removeChannel(overridesChannel);
    };
  }, []);

  return {
    instructors,
    overrides,
    scheduleForDate,
    loading,
    setClassInstructor,
    setScheduleOverride,
    fetchScheduleForDate,
    refetch: async () => {
      await Promise.all([fetchInstructors(), fetchOverrides()]);
    }
  };
};