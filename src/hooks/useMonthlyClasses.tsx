import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyClasses {
  id: string;
  user_id: string;
  remaining_classes: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export const useMonthlyClasses = () => {
  const { user } = useAuth();
  const [monthlyClasses, setMonthlyClasses] = useState<MonthlyClasses | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonthlyClasses = async () => {
    if (!user) {
      setMonthlyClasses(null);
      setLoading(false);
      return;
    }

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // First try to get existing record
      let { data, error } = await supabase
        .from('user_monthly_classes')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      if (error) throw error;

      // If no record exists, call the function to create one
      if (!data) {
        const { data: functionResult, error: functionError } = await supabase.rpc(
          'get_or_create_monthly_classes',
          { user_uuid: user.id }
        );

        if (functionError) throw functionError;
        data = functionResult;
      }

      setMonthlyClasses(data);
    } catch (error) {
      console.error('Error fetching monthly classes:', error);
      setMonthlyClasses(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyClasses();

    if (!user) return;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Realtime subscription to keep monthly classes in sync instantly
    const channel = supabase
      .channel(`umc-${user.id}-${currentMonth}-${currentYear}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_monthly_classes',
        filter: `user_id=eq.${user.id},month=eq.${currentMonth},year=eq.${currentYear}`
      }, () => {
        fetchMonthlyClasses();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_monthly_classes',
        filter: `user_id=eq.${user.id},month=eq.${currentMonth},year=eq.${currentYear}`
      }, () => {
        fetchMonthlyClasses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refreshMonthlyClasses = () => {
    fetchMonthlyClasses();
  };

  return {
    monthlyClasses,
    loading,
    refreshMonthlyClasses
  };
};