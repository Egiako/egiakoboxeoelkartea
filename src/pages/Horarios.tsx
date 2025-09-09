import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { monthlyClasses, loading: monthlyClassesLoading, refreshMonthlyClasses } = useMonthlyClasses();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Get booking counts for the selected date
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { getAvailableSpots, getBookedSpots, loading: countsLoading } = useBookingCounts([dateStr]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
    loadClasses();
  }, [user]);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // Fetch user bookings with class details
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          classes (
            title,
            start_time,
            end_time,
            day_of_week
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('booking_date', format(new Date(), 'yyyy-MM-dd'))
        .order('booking_date', { ascending: true });

      if (bookingsError) throw bookingsError;
      setUserBookings(bookings || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Get classes for selected date
  const getSelectedDateClasses = () => {
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return classes.filter(c => c.day_of_week === dayOfWeek);
  };

  // Create booking
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
        description: "Has agotado tus clases mensuales. El contador se reinicia el 1 de cada mes.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: user.id,
            class_id: classItem.id,
            booking_date: format(date, 'yyyy-MM-dd'),
            status: 'confirmed'
          }
        ]);

      if (error) throw error;

      toast({
        title: "¡Reserva confirmada!",
        description: "Tu plaza ha sido reservada exitosamente"
      });

      await loadUserData();
      refreshMonthlyClasses();
    } catch (error: any) {
      let errorMessage = "No se pudo crear la reserva";
      
      if (error.message.includes('está completa')) {
        errorMessage = "Esta clase ya tiene el máximo de personas";
      } else if (error.message.includes('No tienes clases restantes')) {
        errorMessage = "Has agotado tus clases mensuales";
      } else if (error.message.includes('antelación')) {
        errorMessage = "Solo puedes reservar con un día de antelación como máximo";
      }
      
      toast({
        title: "Error al reservar",
        description: errorMessage,
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Reserva cancelada",
        description: "Tu reserva ha sido cancelada y la plaza está ahora disponible"
      });

      await loadUserData();
      refreshMonthlyClasses();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  // Check if user already has a booking for this class
  const isAlreadyBooked = (classItem: any) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return userBookings.some(b => 
      b.class_id === classItem.id && b.booking_date === dateStr
    );
  };

  // Get booking ID for cancellation
  const getBookingId = (classItem: any) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const booking = userBookings.find(b => 
      b.class_id === classItem.id && b.booking_date === dateStr
    );
    return booking?.id || '';
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

  // Get day name for display
  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  };

  return (
    <div className="min-h-screen bg-background">
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
            <div className="absolute bottom-4 left-8 w-4 h-4 bg-white/10 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-6 right-4 w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>

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
              <p className="text-xl md:text-2xl text-white font-inter leading-relaxed animate-fade-in" style={{animationDelay: '0.3s'}}>
                {user 
                  ? (
                    <>
                      <span className="text-white font-semibold">Selecciona el día y la clase</span> que prefieras.
                      <br className="hidden md:block" />
                      <span className="text-white/80">Las reservas se pueden hacer para hoy y mañana únicamente.</span>
                    </>
                  )
                  : (
                    <>
                      Consulta nuestros <span className="text-white font-semibold">horarios</span>.
                      <br className="hidden md:block" />
                      Para reservar una plaza, <span className="text-white font-semibold">necesitas registrarte</span> e iniciar sesión.
                    </>
                  )
                }
              </p>

              {/* CTA hint for non-authenticated users */}
              {!user && (
                <div className="flex items-center justify-center gap-2 text-sm text-white/90 animate-fade-in" style={{animationDelay: '0.6s'}}>
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span>¿Listo para entrenar? Regístrate ahora</span>
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              )}
            </div>

            {/* Monthly classes counter for authenticated users */}
            {user && !monthlyClassesLoading && monthlyClasses && (
              <div className="flex justify-center animate-fade-in">
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
              </div>
            )}
          </div>
        </div>

        {/* Schedule display - authenticated users see calendar, non-authenticated see weekly schedule */}
        {user ? (
          <>
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

            {/* Classes for selected day */}
            <div className="mb-8">
              {!canBookDate(selectedDate) ? (
                <Card className="max-w-md mx-auto">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-oswald font-bold text-lg mb-2">
                      Solo se puede reservar para hoy y mañana
                    </h3>
                    <p className="text-muted-foreground font-inter">
                      Selecciona hoy {format(new Date(), 'EEEE d', { locale: es })} o mañana {format(addDays(new Date(), 1), 'EEEE d', { locale: es })} para hacer una reserva.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getSelectedDateClasses().length === 0 ? (
                    <div className="md:col-span-2">
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-oswald font-bold text-lg mb-2">No hay clases disponibles</h3>
                          <p className="text-muted-foreground font-inter">
                            No hay clases programadas para {format(selectedDate, 'EEEE d \'de\' MMMM', { locale: es })}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    getSelectedDateClasses().map((classItem) => {
                      const isBooked = isAlreadyBooked(classItem);
                      const timeStr = format(new Date(`2000-01-01T${classItem.start_time}`), 'HH:mm');
                      const endTimeStr = format(new Date(`2000-01-01T${classItem.end_time}`), 'HH:mm');
                      const availableSpots = getAvailableSpots(classItem.id, dateStr, classItem.max_students);
                      const bookedSpots = getBookedSpots(classItem.id, dateStr);
                      const isFull = availableSpots === 0;
                      
                      return (
                        <Card key={classItem.id} className="shadow-boxing hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="font-oswald text-lg">{classItem.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={availableSpots > 0 ? "default" : "destructive"}>
                                  <Users className="h-3 w-3 mr-1" />
                                  {availableSpots}/{classItem.max_students}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-boxing-red" />
                                <span className="font-medium">{timeStr} - {endTimeStr}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Plazas disponibles</div>
                                <div className={`font-bold ${availableSpots > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {availableSpots}
                                </div>
                              </div>
                            </div>

                            <Button 
                              onClick={() => isBooked ? handleCancelBooking(getBookingId(classItem)) : createBooking(classItem, selectedDate)}
                              disabled={loading || (!isBooked && (isFull || !monthlyClasses || monthlyClasses.remaining_classes <= 0))}
                              variant={isBooked ? "destructive" : "default"}
                              className="w-full"
                            >
                              {loading ? (
                                "Procesando..."
                              ) : isBooked ? (
                                "Cancelar reserva"
                              ) : isFull ? (
                                "Clase completa"
                              ) : !monthlyClasses || monthlyClasses.remaining_classes <= 0 ? (
                                "Sin clases disponibles"
                              ) : (
                                "Reservar plaza"
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Weekly schedule for non-authenticated users */
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map(day => {
                const dayClasses = classes.filter(c => c.day_of_week === day);
                const dayName = getDayName(day);
                
                return (
                  <Card key={day} className="shadow-boxing">
                    <CardHeader>
                      <CardTitle className="font-oswald font-bold text-xl text-center">
                        {dayName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dayClasses.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground font-inter">Sin clases programadas</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dayClasses.map((classItem) => {
                            const timeStr = format(new Date(`2000-01-01T${classItem.start_time}`), 'HH:mm');
                            const endTimeStr = format(new Date(`2000-01-01T${classItem.end_time}`), 'HH:mm');
                            
                            return (
                              <div
                                key={classItem.id}
                                className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-boxing-red" />
                                    <span className="font-oswald font-semibold">{timeStr} - {endTimeStr}</span>
                                  </div>
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">
                                    {classItem.title}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                                  <span className="font-medium">Aforo máximo: {classItem.max_students}</span>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span className="font-bold text-green-600">{classItem.max_students} plazas</span>
                                  </div>
                                </div>
                                
                                <div className="text-center">
                                  <Link to="/registrate">
                                    <Button className="w-full font-inter" variant="outline">
                                      Regístrate para reservar
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* User's upcoming bookings */}
        {user && userBookings.length > 0 && (
          <div className="mb-8">
            <Card className="shadow-boxing">
              <CardHeader>
                <CardTitle className="font-oswald flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-boxing-red" />
                  Mis Clases Reservadas
                </CardTitle>
                <CardDescription>
                  Estas son tus próximas clases reservadas. Puedes cancelar cualquier reserva.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {userBookings.map((booking) => {
                    const timeStr = format(new Date(`2000-01-01T${booking.classes.start_time}`), 'HH:mm');
                    const endTimeStr = format(new Date(`2000-01-01T${booking.classes.end_time}`), 'HH:mm');
                    const bookingDate = new Date(booking.booking_date);
                    const dayName = format(bookingDate, 'EEEE', { locale: es });
                    const dateStr = format(bookingDate, 'd \'de\' MMMM', { locale: es });
                    
                    return (
                      <div 
                        key={booking.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="font-oswald font-semibold text-lg">
                              {booking.classes.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {dayName} {dateStr} • {timeStr} - {endTimeStr}
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={loading}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact and Location Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-boxing">
            <CardHeader>
              <CardTitle className="font-oswald flex items-center gap-2">
                <Phone className="h-6 w-6 text-boxing-red" />
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-inter">
              <div>
                <h4 className="font-semibold mb-2">Teléfono</h4>
                <p className="text-muted-foreground">669 33 98 12</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Email</h4>
                <p className="text-muted-foreground">info@boxeoelkartea.com</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Horario de atención</h4>
                <p className="text-muted-foreground">Lunes a Jueves: 17:00 - 21:00</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-boxing">
            <CardHeader>
              <CardTitle className="font-oswald flex items-center gap-2">
                <MapPin className="h-6 w-6 text-boxing-red" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="font-inter">
              <div className="space-y-2 mb-4">
                <p className="font-semibold">Boxeo Elkartea</p>
                <p className="text-muted-foreground">Calle Principal, 123</p>
                <p className="text-muted-foreground">48001 Bilbao, Bizkaia</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Horarios;