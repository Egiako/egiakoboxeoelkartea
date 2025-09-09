import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMonthlyClasses } from '@/hooks/useMonthlyClasses';
import { useUnifiedSchedules } from '@/hooks/useUnifiedSchedules';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { format, addDays } from 'date-fns';
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
  const [userProfile, setUserProfile] = useState<any>(null);

  // Calculate date range (today to 7 days ahead)
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 7);
  
  const { 
    classes, 
    userBookings, 
    loading: schedulesLoading, 
    fetchUserBookings, 
    setUserBookingsState,
    bookClass, 
    cancelBooking 
  } = useUnifiedSchedules(today, endDate);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

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

      // Fetch user bookings
      const bookings = await fetchUserBookings(user.id);
      setUserBookingsState(bookings);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Create booking
  const createBooking = async (classData: any, date: Date) => {
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
      const success = await bookClass(classData, user.id, date);
      if (success) {
        await loadUserData();
        refreshMonthlyClasses();
      }
    } catch (error) {
      // Error handling is done in bookClass
    }
    
    setLoading(false);
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    setLoading(true);
    
    try {
      const success = await cancelBooking(bookingId);
      if (success) {
        await loadUserData();
        refreshMonthlyClasses();
      }
    } catch (error) {
      // Error handling is done in cancelBooking
    }
    
    setLoading(false);
  };

  // Check if user already has a booking for this class
  const isAlreadyBooked = (classData: any) => {
    return userBookings.some(b => {
      if (classData.is_manual) {
        return b.manual_schedule_id === classData.manual_schedule_id;
      } else {
        return b.class_id === classData.class_id && b.booking_date === classData.class_date;
      }
    });
  };

  // Get booking ID for cancellation
  const getBookingId = (classData: any) => {
    const booking = userBookings.find(b => {
      if (classData.is_manual) {
        return b.manual_schedule_id === classData.manual_schedule_id;
      } else {
        return b.class_id === classData.class_id && b.booking_date === classData.class_date;
      }
    });
    return booking?.id || '';
  };

  // Get classes for selected date
  const getSelectedDateClasses = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return classes.filter(c => c.class_date === dateStr);
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

        {/* Schedule display - authenticated users see calendar, non-authenticated see featured schedules */}
        {user ? (
          <>
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

            {/* Classes for selected day */}
            <div className="mb-8">
              {schedulesLoading ? (
                <Card className="max-w-md mx-auto">
                  <CardContent className="p-6 text-center">
                    <div className="animate-pulse">
                      <div className="h-12 w-12 bg-muted rounded mx-auto mb-4" />
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ) : !canBookDate(selectedDate) ? (
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
                    getSelectedDateClasses().map((classData) => {
                      const isBooked = isAlreadyBooked(classData);
                      const isFull = classData.current_bookings >= classData.max_students;
                      const timeStr = format(new Date(`2000-01-01T${classData.start_time}`), 'HH:mm');
                      const endTimeStr = format(new Date(`2000-01-01T${classData.end_time}`), 'HH:mm');
                      const uniqueKey = classData.is_manual ? classData.manual_schedule_id : `${classData.class_id}-${classData.class_date}`;
                      
                      return (
                        <Card key={uniqueKey} className="shadow-boxing hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="font-oswald text-lg">{classData.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={isFull ? "destructive" : "default"}>
                                  {classData.current_bookings}/{classData.max_students}
                                </Badge>
                                {classData.is_manual && (
                                  <Badge variant="secondary" className="text-xs">
                                    Especial
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-boxing-red" />
                                <span>{timeStr} - {endTimeStr}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-boxing-red" />
                                <span>{classData.instructor_name}</span>
                              </div>
                            </div>
                            
                            {classData.notes && (
                              <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                <p>{classData.notes}</p>
                              </div>
                            )}

                            <Button 
                              onClick={() => isBooked ? handleCancelBooking(getBookingId(classData)) : createBooking(classData, selectedDate)}
                              disabled={loading || (!isBooked && isFull) || (!isBooked && (!monthlyClasses || monthlyClasses.remaining_classes <= 0))}
                              variant={isBooked ? "destructive" : isFull ? "secondary" : "default"}
                              className="w-full"
                            >
                              {loading ? (
                                "Procesando..."
                              ) : isBooked ? (
                                "Cancelar reserva"
                              ) : isFull ? (
                                "Completo"
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
          /* Featured schedules for non-authenticated users */
          <div className="max-w-5xl mx-auto mb-8">
            <Card className="shadow-boxing">
              <CardContent className="p-8">
                {schedulesLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3 mx-auto" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 bg-muted rounded" />
                      ))}
                    </div>
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-oswald font-bold text-xl mb-2">No hay clases programadas</h3>
                    <p className="text-muted-foreground">Actualmente no hay clases disponibles. Vuelve pronto.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center mb-6">
                      <h3 className="font-oswald font-bold text-2xl text-boxing-red mb-2">Próximas Clases Disponibles</h3>
                      <p className="font-inter text-muted-foreground">Regístrate para reservar tu plaza</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {classes.slice(0, 6).map((classData) => {
                        const timeStr = format(new Date(`2000-01-01T${classData.start_time}`), 'HH:mm');
                        const endTimeStr = format(new Date(`2000-01-01T${classData.end_time}`), 'HH:mm');
                        const dateStr = format(new Date(classData.class_date), 'EEEE d \'de\' MMMM', { locale: es });
                        const isFull = classData.current_bookings >= classData.max_students;
                        const uniqueKey = classData.is_manual ? classData.manual_schedule_id : `${classData.class_id}-${classData.class_date}`;
                        
                        return (
                          <Card key={uniqueKey} className="bg-gradient-to-br from-boxing-red/10 to-boxing-red/20 border-boxing-red/30 hover:shadow-lg transition-all duration-300">
                            <CardContent className="p-4">
                              <h4 className="font-oswald font-bold text-lg mb-2 text-center">{classData.title}</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-center gap-1">
                                  <Calendar className="h-4 w-4 text-boxing-red" />
                                  <span className="font-inter text-center">{dateStr}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <Clock className="h-4 w-4 text-boxing-red" />
                                  <span className="font-inter font-semibold text-boxing-red">{timeStr} - {endTimeStr}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <Users className="h-4 w-4 text-boxing-red" />
                                  <span className="font-inter">{classData.instructor_name}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <Badge variant={isFull ? "destructive" : "default"} className="text-xs">
                                    {classData.current_bookings}/{classData.max_students} plazas
                                  </Badge>
                                  {classData.is_manual && (
                                    <Badge variant="secondary" className="text-xs ml-1">
                                      Especial
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    <div className="text-center">
                      <Link to="/registrate">
                        <Button size="lg" className="font-inter">
                          Regístrate para reservar
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact Information */}
        <Card className="bg-boxing-grey/30 max-w-4xl mx-auto">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-oswald font-bold text-xl mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-boxing-red" />
                  Nuestra Ubicación
                </h3>
                <div className="space-y-2 font-inter text-muted-foreground">
                  <p>Ginmásio Egia Kobe</p>
                  <p>Calle Egia, 15, Bajo</p>
                  <p>20012 Donostia-San Sebastián</p>
                  <p>Gipuzkoa, País Vasco</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-oswald font-bold text-xl mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-boxing-red" />
                  Contacto
                </h3>
                <div className="space-y-2 font-inter text-muted-foreground">
                  <p>Teléfono: +34 943 000 000</p>
                  <p>Email: info@egiakobe.com</p>
                  <p>Síguenos en redes sociales para más información</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Horarios;