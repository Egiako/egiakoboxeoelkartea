import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScheduleOverride {
  id: string;
  class_id: string;
  override_date: string;
  is_enabled: boolean;
  instructor_override: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Class {
  id: string;
  title: string;
  instructor: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_students: number;
  is_active: boolean;
}

export const useScheduleManagement = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Obtener todas las clases disponibles
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });

      if (error) {
        console.error('Error fetching classes:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las clases",
          variant: "destructive",
        });
        return;
      }

      setClasses(data || []);
    } catch (error) {
      console.error('Error in fetchClasses:', error);
    }
  };

  // Obtener todas las modificaciones de horario
  const fetchScheduleOverrides = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_overrides')
        .select('*')
        .order('override_date', { ascending: true });

      if (error) {
        console.error('Error fetching schedule overrides:', error);
        return;
      }

      setScheduleOverrides(data || []);
    } catch (error) {
      console.error('Error in fetchScheduleOverrides:', error);
    }
  };

  // Agregar clase especial a una fecha
  const addSpecialClass = async (
    classId: string, 
    date: Date, 
    instructorName?: string, 
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('add_schedule_override', {
        target_class_id: classId,
        target_date: date.toISOString().split('T')[0],
        instructor_name: instructorName || null,
        notes: notes || null
      });

      if (error) {
        console.error('Error adding special class:', error);
        toast({
          title: "Error",
          description: "No se pudo agregar la clase especial",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Éxito",
        description: "Clase especial agregada correctamente",
      });

      fetchScheduleOverrides();
      return data;
    } catch (error) {
      console.error('Error in addSpecialClass:', error);
      toast({
        title: "Error",
        description: "Error al agregar la clase especial",
        variant: "destructive",
      });
    }
  };

  // Deshabilitar clase en una fecha
  const disableClass = async (classId: string, date: Date, notes?: string) => {
    try {
      const { data, error } = await supabase.rpc('disable_schedule_class', {
        target_class_id: classId,
        target_date: date.toISOString().split('T')[0],
        notes: notes || null
      });

      if (error) {
        console.error('Error disabling class:', error);
        toast({
          title: "Error",
          description: "No se pudo deshabilitar la clase",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Éxito",
        description: "Clase deshabilitada correctamente. Se han cancelado las reservas existentes.",
      });

      fetchScheduleOverrides();
      return data;
    } catch (error) {
      console.error('Error in disableClass:', error);
      toast({
        title: "Error",
        description: "Error al deshabilitar la clase",
        variant: "destructive",
      });
    }
  };

  // Obtener horario para una fecha específica
  const getScheduleForDate = async (date: Date) => {
    try {
      const { data, error } = await supabase.rpc('get_class_schedule_for_date', {
        target_date: date.toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error getting schedule for date:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getScheduleForDate:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchClasses(),
        fetchScheduleOverrides()
      ]);
      setLoading(false);
    };

    fetchData();
  }, []);

  return {
    classes,
    scheduleOverrides,
    loading,
    addSpecialClass,
    disableClass,
    getScheduleForDate,
    refetch: () => {
      fetchClasses();
      fetchScheduleOverrides();
    }
  };
};