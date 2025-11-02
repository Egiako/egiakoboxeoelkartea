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

  const fetchBookingCounts = useCallback(async () => {
    if (dates.length === 0) {
      setBookingCounts([]);
      setLoading(false);
      return;
    }

    try {
      setIsUpdating(true);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bookings')
        .select('class_id, booking_date, manual_schedule_id')
        .eq('status', 'confirmed')
        .in('booking_date', dates);

      if (error) throw error;

      // Count bookings by class_id/manual_schedule_id and booking_date
      const counts: BookingCount[] = [];
      const countMap = new Map<string, number>();

      (data || []).forEach((booking) => {
        const id = booking.class_id || booking.manual_schedule_id;
        if (!id) return;
        const key = `${id}|${booking.booking_date}`;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      });

      countMap.forEach((count, key) => {
        const [class_id, booking_date] = key.split('|');
        counts.push({ class_id, booking_date, count });
      });

      setBookingCounts(counts);
    } catch (error) {
      console.error('Error fetching booking counts:', error);
      // Keep previous counts to avoid UI flicker on transient errors
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [dates]);

  useEffect(() => {
    fetchBookingCounts();

    // Subscribe to INSERT, UPDATE, and DELETE so reactivations/cancellations via UPDATE are reflected
    const subscription = supabase
      .channel('booking-counts-stable')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings'
      }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsUpdating(true);
        debounceRef.current = setTimeout(() => {
          fetchBookingCounts();
        }, 200);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings'
      }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsUpdating(true);
        debounceRef.current = setTimeout(() => {
          fetchBookingCounts();
        }, 200);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'bookings'
      }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsUpdating(true);
        debounceRef.current = setTimeout(() => {
          fetchBookingCounts();
        }, 200);
      })
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(subscription);
    };
  }, [fetchBookingCounts]);

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