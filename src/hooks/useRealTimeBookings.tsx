import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface BookingCount {
  [key: string]: number; // key format: "class_id-booking_date"
}

interface UserBooking {
  id: string;
  class_id: string;
  booking_date: string;
  status: string;
}

export const useRealTimeBookings = (selectedDate: Date) => {
  const { user } = useAuth();
  const [bookingCounts, setBookingCounts] = useState<BookingCount>({});
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch booking counts for a specific date range
  const fetchBookingCounts = async (date: Date) => {
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const { data, error } = await supabase
      .from('bookings')
      .select('class_id, booking_date')
      .in('booking_date', dates)
      .eq('status', 'confirmed');

    if (!error && data) {
      const counts: BookingCount = {};
      data.forEach((booking) => {
        const key = `${booking.class_id}-${booking.booking_date}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      setBookingCounts(counts);
    }
  };

  // Fetch user's bookings
  const fetchUserBookings = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'confirmed');

    if (!error && data) {
      setUserBookings(data);
    }
  };

  // Initial fetch when date changes
  useEffect(() => {
    fetchBookingCounts(selectedDate);
  }, [selectedDate]);

  // Initial fetch when user changes
  useEffect(() => {
    if (user) {
      fetchUserBookings();
    } else {
      setUserBookings([]);
    }
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-bookings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
      }, (payload) => {
        console.log('Booking change detected:', payload);
        // Refresh both counts and user bookings
        fetchBookingCounts(selectedDate);
        fetchUserBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedDate]);

  const getBookingCount = (classId: string, date: Date): number => {
    const key = `${classId}-${date.toISOString().split('T')[0]}`;
    return bookingCounts[key] || 0;
  };

  const isUserBooked = (classId: string, date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return userBookings.some(b => 
      b.class_id === classId && 
      b.booking_date === dateStr && 
      b.status === 'confirmed'
    );
  };

  const getUserBooking = (classId: string, date: Date): UserBooking | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return userBookings.find(b => 
      b.class_id === classId && 
      b.booking_date === dateStr && 
      b.status === 'confirmed'
    );
  };

  return {
    bookingCounts,
    userBookings,
    loading,
    getBookingCount,
    isUserBooked,
    getUserBooking,
    refreshBookings: () => {
      fetchBookingCounts(selectedDate);
      fetchUserBookings();
    }
  };
};