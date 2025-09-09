import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useTrainerRole = () => {
  const { user } = useAuth();
  const [isTrainer, setIsTrainer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsTrainer(false);
      setLoading(false);
      return;
    }

    const checkTrainerRole = async () => {
      try {
        const { data, error } = await supabase.rpc('is_specific_trainer', {
          _user_id: user.id
        });

        if (error) {
          console.error('Error checking trainer role:', error);
          setIsTrainer(false);
        } else {
          setIsTrainer(data);
        }
      } catch (error) {
        console.error('Error in checkTrainerRole:', error);
        setIsTrainer(false);
      } finally {
        setLoading(false);
      }
    };

    checkTrainerRole();
  }, [user]);

  return {
    isTrainer,
    loading
  };
};