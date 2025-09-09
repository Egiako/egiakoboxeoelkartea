import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BookingCount {
  class_id: string;
  booking_date: string;
  count: number;
}

export const useBookingCounts = (dates: string[]) => {
  const [bookingCounts, setBookingCounts] = useState<BookingCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dates.length === 0) {
      setBookingCounts([]);
      setLoading(false);
      return;
    }

    const fetchBookingCounts = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('bookings')
          .select('class_id, booking_date')
          .eq('status', 'confirmed')
          .in('booking_date', dates);

        if (error) throw error;

        // Count bookings by class_id and booking_date
        const counts: BookingCount[] = [];
        const countMap = new Map<string, number>();

        (data || []).forEach((booking) => {
          const key = `${booking.class_id}-${booking.booking_date}`;
          countMap.set(key, (countMap.get(key) || 0) + 1);
        });

        countMap.forEach((count, key) => {
          const [class_id, booking_date] = key.split('-');
          counts.push({ class_id, booking_date, count });
        });

        setBookingCounts(counts);
      } catch (error) {
        console.error('Error fetching booking counts:', error);
        setBookingCounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingCounts();

    // Set up real-time subscription for booking changes
    const subscription = supabase
      .channel('booking-counts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        fetchBookingCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [dates]);

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
    getAvailableSpots,
    getBookedSpots
  };
};