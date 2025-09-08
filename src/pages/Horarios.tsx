import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CalendarDays, CheckCircle } from 'lucide-react';

interface Class {
  id: string;
  title: string;
  description: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_students: number;
  instructor: string;
}

interface Booking {
  id: string;
  class_id: string;
  booking_date: string;
  status: string;
}

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const Horarios = () => {
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      fetchClasses();
      fetchUserBookings();
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    fetchBookingCounts();
  }, [selectedDate]);

  // Obtener clases disponibles
  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios",
        variant: "destructive"
      });
    } else {
      setClasses(data || []);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserBookings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserBookings(data || []);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
  };

  // Obtener conteo de reservas por clase y fecha
  const fetchBookingCounts = async () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return format(date, 'yyyy-MM-dd');
    });

    const { data, error } = await supabase
      .from('bookings')
      .select('class_id, booking_date')
      .in('booking_date', dates)
      .eq('status', 'confirmed');

    if (!error && data) {
      const counts: Record<string, number> = {};
      data.forEach((booking) => {
        const key = `${booking.class_id}-${booking.booking_date}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      setBookingCounts(counts);
    }
  };

  // Crear reserva
  const createBooking = async (classId: string, date: Date) => {
    if (!user || !userProfile) {
      toast({
        title: "Error",
        description: "Debes estar logueado para reservar una clase",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    const bookingDate = format(date, 'yyyy-MM-dd');
    
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: user.id,
            profile_id: userProfile?.id,
            class_id: classId,
            booking_date: bookingDate,
            status: 'confirmed'
          }
        ]);

      if (error) {
        if (error.message.includes('La clase está completa')) {
          toast({
            title: "Clase completa",
            description: "Esta clase ya tiene el máximo de estudiantes (10 personas)",
            variant: "destructive"
          });
        } else if (error.message.includes('duplicate')) {
          toast({
            title: "Ya reservado",
            description: "Ya tienes una reserva para esta clase en esta fecha",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo crear la reserva",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "¡Reserva confirmada!",
          description: "Tu plaza ha sido reservada exitosamente"
        });
        fetchUserBookings();
        fetchBookingCounts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  // Cancelar reserva
  const cancelBooking = async (bookingId: string) => {
    setLoading(true);
    
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Reserva cancelada",
        description: "Tu reserva ha sido cancelada exitosamente"
      });
      fetchUserBookings();
      fetchBookingCounts();
    }
    
    setLoading(false);
  };

  // Verificar si el usuario ya tiene una reserva para esta clase y fecha
  const isAlreadyBooked = (classId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return userBookings.some(b => b.class_id === classId && b.booking_date === dateStr);
  };

  // Obtener conteo actual para una clase y fecha
  const getCurrentBookingCount = (classId: string, date: Date) => {
    const key = `${classId}-${format(date, 'yyyy-MM-dd')}`;
    return bookingCounts[key] || 0;
  };

  // Get classes for selected day
  const getSelectedDayClasses = () => {
    const dayOfWeek = selectedDate.getDay();
    // Only show classes Monday-Thursday (1-4)
    if (dayOfWeek < 1 || dayOfWeek > 4) return [];
    
    return classes.filter(c => 
      c.day_of_week === dayOfWeek && 
      (c.start_time === '09:00:00' || c.start_time === '18:00:00')
    );
  };

  // Check if selected date is weekend
  const isWeekend = () => {
    const dayOfWeek = selectedDate.getDay();
    return dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6; // Sunday, Friday, Saturday
  };

  // Check if date can be booked (today or tomorrow only)
  const canBookDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return targetDate >= today && targetDate <= tomorrow;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Reserva tu Clase
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Selecciona el día y la clase que prefieras. Las reservas se pueden hacer para hoy y mañana únicamente.
            </p>
          </div>

          {/* Large Calendar */}
          <div className="max-w-lg mx-auto mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-oswald text-center flex items-center justify-center gap-2">
                  <CalendarDays className="h-6 w-6" />
                  Selecciona un día
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border scale-110 pointer-events-auto"
                  locale={es}
                  modifiers={{
                    weekend: (date) => {
                      const day = date.getDay();
                      return day === 0 || day === 5 || day === 6; // Sunday, Friday, Saturday
                    }
                  }}
                  modifiersStyles={{
                    weekend: { 
                      color: 'hsl(var(--destructive))',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Selected Day Classes */}
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="font-oswald text-center">
                  {DAYS_OF_WEEK[selectedDate.getDay()]} - {format(selectedDate, 'dd MMMM yyyy', { locale: es })}
                  {isSameDay(selectedDate, new Date()) && (
                    <Badge variant="secondary" className="ml-2">Hoy</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isWeekend() ? (
                  <div className="text-center py-12">
                    <div className="text-destructive text-6xl mb-4">😴</div>
                    <h3 className="font-oswald font-semibold text-xl text-destructive mb-2">
                      No hay clases disponibles
                    </h3>
                    <p className="text-muted-foreground">
                      Los fines de semana y viernes no tenemos clases programadas.
                      Selecciona un día de lunes a jueves.
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {getSelectedDayClasses().map((classItem) => {
                      const currentCount = getCurrentBookingCount(classItem.id, selectedDate);
                      const isBooked = isAlreadyBooked(classItem.id, selectedDate);
                      const isFull = currentCount >= classItem.max_students;
                      const canBook = canBookDate(selectedDate);
                      
                      return (
                        <Card key={classItem.id} className="relative">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-oswald font-semibold text-xl">{classItem.title}</h4>
                              {isBooked && (
                                <Badge className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Reservado
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-muted-foreground mb-4">
                              {classItem.description}
                            </p>
                            
                            <div className="space-y-3 text-sm mb-6">
                              <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                <span className="font-medium">{classItem.start_time} - {classItem.end_time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <span className="font-medium">
                                  Aforo: {currentCount}/{classItem.max_students} estudiantes
                                </span>
                                {isFull && (
                                  <Badge variant="destructive">Completa</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              {isBooked ? (
                                <Button 
                                  variant="outline"
                                  size="lg"
                                  className="w-full"
                                  onClick={() => {
                                    const booking = userBookings.find(b => 
                                      b.class_id === classItem.id && 
                                      b.booking_date === format(selectedDate, 'yyyy-MM-dd')
                                    );
                                    if (booking) cancelBooking(booking.id);
                                  }}
                                  disabled={loading}
                                >
                                  Cancelar reserva
                                </Button>
                              ) : (
                                <Button
                                  variant="hero"
                                  size="lg"
                                  className="w-full"
                                  onClick={() => createBooking(classItem.id, selectedDate)}
                                  disabled={loading || isFull || !canBook || !user}
                                >
                                  {!canBook ? 'Solo se puede reservar hoy y mañana' : 
                                   isFull ? 'Clase completa' : 
                                   !user ? 'Inicia sesión para reservar' :
                                   'Reservar plaza'}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    {getSelectedDayClasses().length === 0 && !isWeekend() && (
                      <div className="col-span-2 text-center py-8">
                        <p className="text-muted-foreground">No hay clases programadas para este día.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* My Bookings Section */}
                {userBookings.length > 0 && (
                  <div className="mt-8 pt-8 border-t">
                    <h3 className="font-oswald font-semibold text-lg mb-4 text-center">Mis reservas activas</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userBookings.map((booking) => {
                        const classInfo = classes.find(c => c.id === booking.class_id);
                        return (
                          <div key={booking.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                              <div className="font-medium">{classInfo?.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(booking.booking_date), 'dd/MM/yyyy', { locale: es })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {classInfo?.start_time} - {classInfo?.end_time}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelBooking(booking.id)}
                              disabled={loading}
                            >
                              Cancelar
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Horarios;