import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Users, User, CalendarDays, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});

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

  // Obtener reservas del usuario
  const fetchUserBookings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'confirmed');

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar tus reservas",
        variant: "destructive"
      });
    } else {
      setBookings(data || []);
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

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserBookings();
    }
  }, [user]);

  useEffect(() => {
    fetchBookingCounts();
  }, [selectedDate]);

  // Crear reserva
  const createBooking = async (classId: string, date: Date) => {
    if (!user) {
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
        .insert({
          user_id: user.id,
          class_id: classId,
          booking_date: bookingDate,
          status: 'confirmed'
        });

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
    return bookings.some(b => b.class_id === classId && b.booking_date === dateStr);
  };

  // Obtener conteo actual para una clase y fecha
  const getCurrentBookingCount = (classId: string, date: Date) => {
    const key = `${classId}-${format(date, 'yyyy-MM-dd')}`;
    return bookingCounts[key] || 0;
  };

  // Generar fechas de la semana actual
  const getWeekDates = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  return (
    <>
      <Navigation />
      
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-oswald font-bold text-4xl mb-4">
              Horarios y Reservas
            </h1>
            <p className="font-inter text-muted-foreground max-w-2xl mx-auto">
              Reserva tu plaza en las clases de boxeo. Máximo 10 estudiantes por clase.
              Selecciona el día y horario que mejor se adapte a ti.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendario */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="font-oswald flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Selecciona una semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    locale={es}
                  />
                  
                  {/* Mis reservas */}
                  {bookings.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-oswald font-semibold mb-3">Mis reservas</h3>
                      <div className="space-y-2">
                        {bookings.map((booking) => {
                          const classInfo = classes.find(c => c.id === booking.class_id);
                          return (
                            <div key={booking.id} className="flex items-center justify-between p-2 bg-boxing-grey/20 rounded">
                              <div className="text-sm">
                                <div className="font-medium">{classInfo?.title}</div>
                                <div className="text-muted-foreground">
                                  {format(new Date(booking.booking_date), 'dd/MM/yyyy', { locale: es })}
                                </div>
                              </div>
                              <Button
                                variant="outline"
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

            {/* Horarios de la semana */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-oswald">
                    Semana del {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd', { locale: es })} - {format(addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6), 'dd MMMM yyyy', { locale: es })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {getWeekDates().map((date) => {
                      const dayOfWeek = date.getDay();
                      const dayClasses = classes.filter(c => c.day_of_week === dayOfWeek);
                      
                      if (dayClasses.length === 0) return null;

                      return (
                        <div key={date.toISOString()} className="border rounded-lg p-4">
                          <h3 className="font-oswald font-semibold text-lg mb-3 flex items-center gap-2">
                            {DAYS_OF_WEEK[dayOfWeek]} - {format(date, 'dd/MM', { locale: es })}
                            {isSameDay(date, new Date()) && (
                              <Badge variant="secondary">Hoy</Badge>
                            )}
                          </h3>
                          
                          <div className="grid md:grid-cols-2 gap-3">
                            {dayClasses.map((classItem) => {
                              const currentCount = getCurrentBookingCount(classItem.id, date);
                              const isBooked = isAlreadyBooked(classItem.id, date);
                              const isFull = currentCount >= classItem.max_students;
                              const isPastDate = date < new Date(new Date().setHours(0,0,0,0));
                              
                              return (
                                <Card key={classItem.id} className="relative">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-oswald font-semibold">{classItem.title}</h4>
                                      {isBooked && (
                                        <Badge className="bg-green-500">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Reservado
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground mb-3">
                                      {classItem.description}
                                    </p>
                                    
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {classItem.start_time} - {classItem.end_time}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Instructor: {classItem.instructor}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        {currentCount}/{classItem.max_students} estudiantes
                                        {isFull && (
                                          <Badge variant="destructive">Completa</Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                      {isBooked ? (
                                        <Button 
                                          variant="outline"
                                          className="w-full"
                                          onClick={() => {
                                            const booking = bookings.find(b => 
                                              b.class_id === classItem.id && 
                                              b.booking_date === format(date, 'yyyy-MM-dd')
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
                                          className="w-full"
                                          onClick={() => createBooking(classItem.id, date)}
                                          disabled={loading || isFull || isPastDate || !user}
                                        >
                                          {isPastDate ? 'Fecha pasada' : 
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Horarios;