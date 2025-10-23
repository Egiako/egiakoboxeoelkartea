import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Calendar, Clock, Users, MapPin, Phone, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMonthlyClasses } from '@/hooks/useMonthlyClasses';
import { useBookingCounts } from '@/hooks/useBookingCounts';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
const Horarios = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    monthlyClasses,
    loading: monthlyClassesLoading,
    refreshMonthlyClasses
  } = useMonthlyClasses();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [datesWithClasses, setDatesWithClasses] = useState<Set<string>>(new Set());

  // Get booking counts for the selected date
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const bookingDates = useMemo(() => [dateStr], [dateStr]);
  const {
    getAvailableSpots,
    getBookedSpots,
    loading: countsLoading,
    refresh: refreshCounts
  } = useBookingCounts(bookingDates);
  useEffect(() => {
    if (user) {
      loadUserData();
    }
    loadClasses();
    loadScheduledClasses(selectedDate);
    loadDatesWithClasses(); // Load dates with classes for calendar coloring

      // Set up real-time subscriptions for schedule changes
      const scheduleChannel = supabase
        .channel('schedule-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'schedule_overrides' 
        }, () => {
          loadScheduledClasses(selectedDate);
          loadDatesWithClasses(); // Refresh dates when overrides change
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'manual_class_schedules' 
        }, () => {
          loadScheduledClasses(selectedDate);
          loadDatesWithClasses(); // Refresh dates when manual schedules change
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'classes' 
        }, () => {
          loadScheduledClasses(selectedDate);
          loadDatesWithClasses(); // Refresh dates when classes change
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'class_exceptions' 
        }, () => {
          loadScheduledClasses(selectedDate);
          loadDatesWithClasses(); // Refresh dates when exceptions change
        })
        .subscribe();

      // Set up real-time subscription for user bookings to prevent flickering
      const bookingsChannel = user ? supabase
        .channel('user-bookings-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`
        }, () => {
          // Refresh user bookings when there's a change
          loadUserData();
        })
        .subscribe() : null;

    return () => {
      supabase.removeChannel(scheduleChannel);
      if (bookingsChannel) {
        supabase.removeChannel(bookingsChannel);
      }
    };
  }, [user]);

  useEffect(() => {
    loadScheduledClasses(selectedDate);
  }, [selectedDate]);
  const loadClasses = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('classes').select('*').eq('is_active', true).order('day_of_week', {
        ascending: true
      }).order('start_time', {
        ascending: true
      });
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };
  const loadUserData = async () => {
    if (!user) return;
    try {
      // Fetch user profile
      const {
        data: profile,
        error: profileError
      } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (profileError) throw profileError;
      setUserProfile(profile);

      // Fetch user bookings with class details (both regular and manual schedules)
      const {
        data: bookings,
        error: bookingsError
      } = await supabase.from('bookings').select(`
          *,
          classes (
            title,
            start_time,
            end_time,
            day_of_week
          ),
          manual_class_schedules (
            title,
            start_time,
            end_time,
            class_date,
            instructor_name
          )
        `).eq('user_id', user.id).eq('status', 'confirmed').gte('booking_date', format(new Date(), 'yyyy-MM-dd')).order('booking_date', {
        ascending: true
      });
      if (bookingsError) throw bookingsError;
      setUserBookings(bookings || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Get classes for selected date using schedule overrides
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  
  const loadScheduledClasses = async (date: Date) => {
    try {
      const { data, error } = await supabase.rpc('get_class_schedule_for_date', {
        target_date: format(date, 'yyyy-MM-dd')
      });

      if (error) throw error;
      
      // Filter only active classes
      const activeClasses = (data || []).filter((c: any) => c.is_active);
      setScheduledClasses(activeClasses);
    } catch (error) {
      console.error('Error loading scheduled classes:', error);
      setScheduledClasses([]);
    }
  };

  // Load all dates in current month that have classes
  const loadDatesWithClasses = async () => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const startDate = format(firstDayOfMonth, 'yyyy-MM-dd');
      const endDate = format(lastDayOfMonth, 'yyyy-MM-dd');

      // Get all dates in the month
      const datesInMonth: string[] = [];
      for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
        datesInMonth.push(format(new Date(d), 'yyyy-MM-dd'));
      }

      // Check each date for classes
      const datesWithClassesSet = new Set<string>();
      
      await Promise.all(
        datesInMonth.map(async (dateStr) => {
          const { data, error } = await supabase.rpc('get_class_schedule_for_date', {
            target_date: dateStr
          });
          
          if (!error && data && data.length > 0) {
            const hasActiveClasses = data.some((c: any) => c.is_active);
            if (hasActiveClasses) {
              datesWithClassesSet.add(dateStr);
            }
          }
        })
      );

      setDatesWithClasses(datesWithClassesSet);
    } catch (error) {
      console.error('Error loading dates with classes:', error);
    }
  };

  // Get classes for selected date
  const getSelectedDateClasses = () => {
    return scheduledClasses;
  };

  // Create booking for regular or manual classes using safe RPC function
  const createBooking = async (classItem: any, date: Date) => {
    if (!user || !userProfile) {
      toast({
        title: "Error",
        description: "Debes estar logueado para reservar una clase",
        variant: "destructive"
      });
      return;
    }

    // Check if user has remaining classes
    if (!monthlyClasses || monthlyClasses.remaining_classes <= 0) {
      toast({
        title: "Sin clases disponibles",
        description: "Has agotado tus clases mensuales. Contacta con el administrador para renovar tu cuota.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const classIdToUse = classItem.class_id || classItem.id;
      
      // Check if it's a manual schedule (sporadic class) or regular class
      const isManualSchedule = classItem.day_of_week === null || classItem.day_of_week === undefined;
      
      // Use the safe RPC function to create booking
      const { data, error } = await supabase.rpc('create_reservation_safe', {
        p_user_id: user.id,
        p_booking_date: dateStr,
        p_class_id: isManualSchedule ? null : classIdToUse,
        p_manual_schedule_id: isManualSchedule ? classIdToUse : null
      });

      if (error) throw error;

      const result = data as { ok: boolean; error?: string; message?: string };

      if (!result.ok) {
        toast({
          title: "Error al reservar",
          description: result.error || "No se pudo crear la reserva",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      toast({
        title: "¡Reserva confirmada!",
        description: result.message || "Tu plaza ha sido reservada exitosamente"
      });
      
      // Only refresh counts, monthly classes will update via realtime subscription
      refreshCounts();
    } catch (error: any) {
      toast({
        title: "Error al reservar",
        description: error.message || "No se pudo crear la reserva. Intenta de nuevo.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  // Cancel booking using safe RPC function with time validation
  const handleCancelBooking = async (bookingId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para cancelar reservas",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First check if booking can be cancelled (time validation)
      const { data: canCancelData, error: canCancelError } = await supabase.rpc('can_cancel_booking', {
        _booking_id: bookingId,
        _user_id: user.id
      });

      if (canCancelError) throw canCancelError;

      const canCancelResult = canCancelData as { can_cancel: boolean; reason: string; minutes_until_class?: number };

      if (!canCancelResult.can_cancel) {
        if (canCancelResult.reason === 'within_time_limit') {
          const minutesText = canCancelResult.minutes_until_class 
            ? ` (faltan ${canCancelResult.minutes_until_class} minutos)` 
            : '';
          toast({
            title: "No se puede cancelar la clase",
            description: `Estás dentro de la hora máxima. Las cancelaciones deben realizarse al menos 1 hora antes del inicio de la clase${minutesText}.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "No se puede cancelar",
            description: "No tienes permiso para cancelar esta reserva",
            variant: "destructive"
          });
        }
        setLoading(false);
        return;
      }

      // Proceed with cancellation
      const { data, error } = await supabase.rpc('cancel_reservation_safe', {
        p_booking_id: bookingId,
        p_actor_user_id: user.id
      });

      if (error) throw error;

      const result = data as { ok: boolean; error?: string; message?: string };

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.error || "No se pudo cancelar la reserva",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Cancelación realizada",
        description: result.message || "Tu reserva se ha cancelado correctamente"
      });
      
      // Monthly classes will update via realtime subscription
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la reserva. Intenta de nuevo.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  // Check if user already has a booking for this class (both regular and manual schedules)
  const isAlreadyBooked = (classItem: any) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const classIdToCheck = classItem.class_id || classItem.id;
    
    // Check if it's a manual schedule (sporadic class) or regular class
    const isManualSchedule = classItem.day_of_week === null || classItem.day_of_week === undefined;
    
    return userBookings.some(b => {
      if (isManualSchedule) {
        // For manual schedules, check manual_schedule_id
        return b.manual_schedule_id === classIdToCheck && b.booking_date === dateStr;
      } else {
        // For regular classes, check class_id
        return b.class_id === classIdToCheck && b.booking_date === dateStr;
      }
    });
  };

  // Get booking ID for cancellation (both regular and manual schedules)
  const getBookingId = (classItem: any) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const classIdToCheck = classItem.class_id || classItem.id;
    
    // Check if it's a manual schedule (sporadic class) or regular class
    const isManualSchedule = classItem.day_of_week === null || classItem.day_of_week === undefined;
    
    const booking = userBookings.find(b => {
      if (isManualSchedule) {
        // For manual schedules, check manual_schedule_id
        return b.manual_schedule_id === classIdToCheck && b.booking_date === dateStr;
      } else {
        // For regular classes, check class_id
        return b.class_id === classIdToCheck && b.booking_date === dateStr;
      }
    });
    
    return booking?.id || '';
  };

  // Check if date can be booked (weekly booking with Sunday unlock)
  const canBookDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Can't book past dates
    if (targetDate < today) return false;
    
    // Get current day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const currentDayOfWeek = today.getDay();
    
    // Calculate Monday of current week
    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(today.getDate() - ((currentDayOfWeek + 6) % 7));
    currentWeekMonday.setHours(0, 0, 0, 0);
    
    // Calculate Sunday of current week
    const currentWeekSunday = new Date(currentWeekMonday);
    currentWeekSunday.setDate(currentWeekMonday.getDate() + 6);
    currentWeekSunday.setHours(0, 0, 0, 0);
    
    // Calculate next week's Monday and Sunday
    const nextWeekMonday = new Date(currentWeekMonday);
    nextWeekMonday.setDate(currentWeekMonday.getDate() + 7);
    nextWeekMonday.setHours(0, 0, 0, 0);
    
    const nextWeekSunday = new Date(currentWeekSunday);
    nextWeekSunday.setDate(currentWeekSunday.getDate() + 7);
    nextWeekSunday.setHours(0, 0, 0, 0);
    
    // If today is Sunday, allow bookings for current week AND next week
    if (currentDayOfWeek === 0) {
      return targetDate >= currentWeekMonday && targetDate <= nextWeekSunday;
    }
    
    // If not Sunday, only allow bookings for current week (from today to Sunday)
    return targetDate >= today && targetDate <= currentWeekSunday;
  };

  // Get day name for display
  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  };
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Horarios"
        description="Consulta los horarios de clases de boxeo en Egia K.O. Clases de mañana y tarde adaptadas a todos los niveles."
        keywords="horarios boxeo Donostia, clases boxeo, horario gimnasio, boxeo San Sebastián"
      />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative mb-16">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-16 right-1/4 w-16 h-16 bg-accent/20 rounded-full blur-2xl animate-fade-in"></div>
            <div className="absolute top-12 left-1/4 w-20 h-20 bg-primary/5 rounded-full blur-2xl animate-fade-in"></div>
          </div>

          <div className="text-center space-y-6 bg-gradient-to-br from-boxing-black via-boxing-black/90 to-boxing-red/80 rounded-xl p-8 text-white shadow-boxing relative overflow-hidden">
            
            {/* Animated decorative elements */}
            <div className="absolute top-4 left-4 w-3 h-3 bg-white/20 rounded-full animate-ping"></div>
            <div className="absolute top-6 right-6 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 left-8 w-4 h-4 bg-white/10 rounded-full animate-ping" style={{
            animationDelay: '1s'
          }}></div>
            <div className="absolute bottom-6 right-4 w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{
            animationDelay: '2s'
          }}></div>

            {/* Main title with enhanced styling */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-white to-white rounded-full animate-fade-in"></div>
                <Calendar className="h-10 w-10 text-white animate-scale-in" />
                <div className="w-12 h-0.5 bg-gradient-to-r from-white via-white to-transparent rounded-full animate-fade-in"></div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-oswald font-bold tracking-tight animate-fade-in">
                <span className="text-white inline-block hover:scale-105 transition-transform duration-300">
                  {user ? 'Reserva tu Clase' : 'Horarios de Clases'}
                </span>
              </h1>
              
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="h-1 w-8 bg-white/60 rounded-full animate-scale-in"></div>
                <div className="h-0.5 w-16 bg-gradient-to-r from-white/50 to-white/30 rounded-full animate-scale-in"></div>
                <div className="h-1 w-8 bg-white/60 rounded-full animate-scale-in"></div>
              </div>
            </div>

            {/* Enhanced subtitle with better typography */}
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-xl md:text-2xl text-white font-inter leading-relaxed animate-fade-in" style={{
              animationDelay: '0.3s'
            }}>
                {user ? <>
                       <span className="text-white font-semibold">Selecciona el día y la clase</span> que prefieras.
                      <br className="hidden md:block" />
                      <span className="text-white/80">Cada domingo se habilitan las reservas para la semana siguiente.</span>
                    </> : <>
                      Consulta nuestros <span className="text-white font-semibold">horarios</span>.
                      <br className="hidden md:block" />
                      Para reservar una plaza, <span className="text-white font-semibold">necesitas registrarte</span> e iniciar sesión.
                    </>}
              </p>

              {/* CTA hint for non-authenticated users */}
              {!user && <div className="flex items-center justify-center gap-2 text-sm text-white/90 animate-fade-in" style={{
              animationDelay: '0.6s'
            }}>
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span>¿Listo para entrenar? Regístrate ahora</span>
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>}
            </div>

            {/* Monthly classes counter for authenticated users */}
            {user && !monthlyClassesLoading && monthlyClasses && <div className="flex justify-center animate-fade-in">
                <div className="bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 backdrop-blur-sm border-2 border-primary/40 rounded-2xl p-6 shadow-boxing">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-xl">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white uppercase tracking-wide">
                        Clases restantes este mes
                      </div>
                      <div className="text-3xl font-oswald font-bold text-primary text-center">
                        {monthlyClasses.remaining_classes}<span className="text-white text-xl">/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>}
          </div>
        </div>

        {/* Schedule display - authenticated users see calendar, non-authenticated see weekly schedule */}
        {user ? <>
            {/* Large Calendar for authenticated users */}
            <div className="max-w-lg mx-auto mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-oswald text-center flex items-center justify-center gap-2">
                    <CalendarDays className="h-6 w-6" />
                    Selecciona un día
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <CalendarComponent mode="single" selected={selectedDate} onSelect={date => date && setSelectedDate(date)} className="rounded-md border scale-110 pointer-events-auto" locale={es} modifiers={{
                weekend: date => {
                  const day = date.getDay();
                  const isWeekendDay = day === 0 || day === 5 || day === 6; // Sunday, Friday, Saturday
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const hasClasses = datesWithClasses.has(dateStr);
                  
                  // Only mark as weekend (red) if it's a weekend day AND has no classes
                  return isWeekendDay && !hasClasses;
                }
              }} modifiersStyles={{
                weekend: {
                  color: 'hsl(var(--destructive))',
                  fontWeight: 'bold'
                }
              }} />
                </CardContent>
              </Card>
            </div>

            {/* Classes for selected day */}
            <div className="mb-8">
            {!canBookDate(selectedDate) ? <Card className="max-w-md mx-auto">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-oswald font-bold text-lg mb-2">
                      {new Date().getDay() === 0 
                        ? 'Reservas disponibles para esta semana y la próxima'
                        : 'Solo puedes reservar para esta semana'}
                    </h3>
                    <p className="text-muted-foreground font-inter">
                      {new Date().getDay() === 0 
                        ? 'Los domingos se habilitan las reservas para la semana siguiente. Selecciona una fecha de esta semana o la próxima.'
                        : 'Las reservas para la fecha seleccionada se habilitan el domingo.'}
                    </p>
                  </CardContent>
                </Card> : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getSelectedDateClasses().length === 0 ? <div className="md:col-span-2">
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-oswald font-bold text-lg mb-2">No hay clases disponibles</h3>
                          <p className="text-muted-foreground font-inter">
                            No hay clases programadas para {format(selectedDate, 'EEEE d \'de\' MMMM', {
                      locale: es
                    })}
                          </p>
                        </CardContent>
                      </Card>
                    </div> : getSelectedDateClasses().map(classItem => {
              const isBooked = isAlreadyBooked(classItem);
              const timeStr = format(new Date(`2000-01-01T${classItem.start_time}`), 'HH:mm');
              const endTimeStr = format(new Date(`2000-01-01T${classItem.end_time}`), 'HH:mm');
              const availableSpots = getAvailableSpots(classItem.class_id, dateStr, classItem.max_students);
              const bookedSpots = getBookedSpots(classItem.class_id, dateStr);
              const isFull = availableSpots === 0;
              return <Card key={classItem.class_id} className="shadow-boxing hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="font-oswald text-lg">
                                {classItem.title}
                                {classItem.is_special_day && (
                                  <Badge variant="secondary" className="ml-2">Especial</Badge>
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={availableSpots > 0 ? "default" : "destructive"}>
                                  <Users className="h-3 w-3 mr-1" />
                                  {availableSpots}/{classItem.max_students}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-boxing-red" />
                                <span className="font-medium">{timeStr} - {endTimeStr}</span>
                              </div>
                            </div>
                            
                            {/* Show instructor */}
                            <div className="text-sm text-muted-foreground">
                              Instructor: {classItem.instructor}
                            </div>

                            {/* Show notes if it's a special class */}
                            {classItem.is_special_day && classItem.override_notes && (
                              <div className="text-sm p-2 bg-muted rounded">
                                {classItem.override_notes}
                              </div>
                            )}

                            <Button 
                              onClick={() => isBooked ? handleCancelBooking(getBookingId(classItem)) : createBooking({...classItem, id: classItem.class_id}, selectedDate)} 
                              disabled={loading || !isBooked && (isFull || !monthlyClasses || monthlyClasses.remaining_classes <= 0)} 
                              variant={isBooked ? "destructive" : "default"} 
                              className="w-full"
                            >
                              {loading ? "Procesando..." : isBooked ? "Cancelar reserva" : isFull ? "Clase completa" : !monthlyClasses || monthlyClasses.remaining_classes <= 0 ? "Sin clases disponibles" : "Reservar plaza"}
                            </Button>
                          </CardContent>
                        </Card>;
            })}
                </div>}
            </div>
          </> : (/* Weekly schedule for non-authenticated users */
      <div className="mb-8">
            {/* Horarios estáticos para usuarios no autenticados */}
            <Card className="max-w-5xl mx-auto shadow-boxing">
              <CardContent className="p-8">
                {/* Aviso aclaratorio */}
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="font-inter text-sm text-center text-yellow-900 dark:text-yellow-100">
                    ⚠️ El servicio de mañana es de una hora por día. El horario podrá variar entre 9:00–10:00 o 10:00–11:00, según el día.
                  </p>
                </div>

                {/* Horarios de Mañana */}
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <h3 className="font-oswald font-bold text-2xl text-boxing-red mb-2">Horarios de Mañana</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves'].map((dia, index) => (
                      <Card key={index} className="bg-gradient-to-br from-boxing-red/10 to-boxing-red/20 border-boxing-red/30 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 text-center">
                          <h4 className="font-oswald font-bold text-lg mb-2">{dia}</h4>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Clock className="h-4 w-4 text-boxing-red" />
                            <span className="font-inter font-semibold text-boxing-red text-sm">9:00–10:00 o 10:00–11:00</span>
                          </div>
                          <p className="font-inter text-sm text-muted-foreground">Técnica mañana</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Horarios de Tarde */}
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <h3 className="font-oswald font-bold text-2xl text-boxing-red mb-2">Horarios de Tarde</h3>
                    <p className="font-inter text-muted-foreground">18:00 - 19:00</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {['Lunes', 'Miércoles'].map((dia, index) => (
                      <Card key={index} className="bg-gradient-to-br from-boxing-black/10 to-boxing-black/20 border-boxing-black/30 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 text-center">
                          <h4 className="font-oswald font-bold text-lg mb-2">{dia}</h4>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Clock className="h-4 w-4 text-boxing-black" />
                            <span className="font-inter font-semibold text-boxing-black">18:00 - 19:00</span>
                          </div>
                          <p className="font-inter text-sm text-muted-foreground">Técnica tarde</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="text-center border-t pt-6">
                  <p className="font-inter text-muted-foreground mb-6">
                    Ver horario completo y reservar clases requiere registro
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="hero" className="font-oswald font-semibold">
                      <Link to="/registrate">Registrarse ahora</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>)}

        {/* User's upcoming bookings */}
        {user && userBookings.length > 0 && <div className="mb-8">
            <Card className="shadow-boxing">
              <CardHeader>
                <CardTitle className="font-oswald flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-boxing-red" />
                  Mis Clases Reservadas
                </CardTitle>
                <CardDescription>
                  Estas son tus próximas clases reservadas. Las cancelaciones deben realizarse al menos 1 hora antes del inicio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {userBookings.map(booking => {
                // Handle both regular classes and manual schedules
                const classData = booking.classes || booking.manual_class_schedules;
                if (!classData) return null; // Skip if no class data
                
                const timeStr = format(new Date(`2000-01-01T${classData.start_time}`), 'HH:mm');
                const endTimeStr = format(new Date(`2000-01-01T${classData.end_time}`), 'HH:mm');
                const bookingDate = new Date(booking.booking_date);
                const dayName = format(bookingDate, 'EEEE', {
                  locale: es
                });
                const dateStr = format(bookingDate, 'd \'de\' MMMM', {
                  locale: es
                });
                return <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="font-oswald font-semibold text-lg">
                              {classData.title}
                              {booking.manual_class_schedules && (
                                <Badge variant="secondary" className="ml-2 text-xs">Especial</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {dayName} {dateStr} • {timeStr} - {endTimeStr}
                              {booking.manual_class_schedules?.instructor_name && (
                                <span> • {booking.manual_class_schedules.instructor_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => handleCancelBooking(booking.id)} disabled={loading} variant="destructive" size="sm" className="flex items-center gap-2">
                          <X className="h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>;
              }).filter(Boolean)}
                </div>
              </CardContent>
            </Card>
          </div>}

        {/* Normas importantes */}
        {user && (
          <Card className="bg-card/50 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-oswald font-bold text-lg">Política de Cancelaciones</h3>
              </div>
              <ul className="space-y-2 font-inter text-muted-foreground">
                <li>• ⚠️ Las cancelaciones deben realizarse al menos 1 hora antes del inicio de la clase</li>
                <li>• Si no cancelas a tiempo y no asistes, se descontará 1 clase adicional como penalización</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Contact and Location Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          

          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Horarios;