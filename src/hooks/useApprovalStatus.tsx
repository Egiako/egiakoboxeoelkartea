import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | null;

export const useApprovalStatus = () => {
  const { user } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (!user) {
        setApprovalStatus(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('approval_status')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching approval status:', error);
          setApprovalStatus(null);
        } else {
          setApprovalStatus(data?.approval_status || 'pending');
        }
      } catch (error) {
        console.error('Error fetching approval status:', error);
        setApprovalStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalStatus();

    // Set up real-time subscription for approval status changes
    if (user) {
      const profilesChannel = supabase
        .channel('approval-status-realtime')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setApprovalStatus(payload.new.approval_status);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(profilesChannel);
      };
    }
  }, [user]);

  return {
    approvalStatus,
    loading,
    isApproved: approvalStatus === 'approved',
    isPending: approvalStatus === 'pending',
    isRejected: approvalStatus === 'rejected'
  };
};