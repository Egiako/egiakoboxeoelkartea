import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BookingCount {
  class_id: string;
  booking_date: string;
  count: number;
}

export const useBookingCounts = (dates: string[]) => {
  const [bookingCounts, setBookingCounts] = useState<BookingCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>(null);

  const fetchBookingCounts = useCallback(async (forceRefresh = false) => {
    if (dates.length === 0) {
      setBookingCounts([]);
      setLoading(false);
      return;
    }

    try {
      if (forceRefresh) {
        setIsUpdating(true);
      }
      setLoading(true);

      // Use RPC to bypass RLS safely with aggregated data
      const { data, error } = await supabase.rpc('get_booking_counts', {
        _dates: dates
      });

      if (error) throw error;

      const counts: BookingCount[] = (data || []).map((row: any) => ({
        class_id: row.class_key,
        booking_date: row.booking_date,
        count: row.count
      }));

      setBookingCounts(counts);
    } catch (error) {
      console.error('Error fetching booking counts:', error);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [dates]);

  useEffect(() => {
    // Clean up previous channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Fetch initial counts
    fetchBookingCounts(true);

    // Create a unique channel name with timestamp to force new subscription
    const channelName = `booking-counts-${Date.now()}`;
    
    // Subscribe to INSERT, UPDATE, and DELETE
    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings'
      }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsUpdating(true);
        debounceRef.current = setTimeout(() => {
          fetchBookingCounts(true);
        }, 100);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings'
      }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsUpdating(true);
        debounceRef.current = setTimeout(() => {
          fetchBookingCounts(true);
        }, 100);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'bookings'
      }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsUpdating(true);
        debounceRef.current = setTimeout(() => {
          fetchBookingCounts(true);
        }, 100);
      })
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [dates.join(',')]); // Use dates.join() to ensure effect runs when dates array changes

  const getAvailableSpots = (classId: string, date: string, maxStudents: number) => {
    const booking = bookingCounts.find(
      b => b.class_id === classId && b.booking_date === date
    );
    const bookedSpots = booking ? booking.count : 0;
    return Math.max(0, maxStudents - bookedSpots);
  };

  const getBookedSpots = (classId: string, date: string) => {
    const booking = bookingCounts.find(
      b => b.class_id === classId && b.booking_date === date
    );
    return booking ? booking.count : 0;
  };

  return {
    bookingCounts,
    loading,
    isUpdating,
    getAvailableSpots,
    getBookedSpots,
    refresh: fetchBookingCounts
  };
};