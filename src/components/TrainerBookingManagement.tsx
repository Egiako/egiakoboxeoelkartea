import { useState, useEffect } from 'react';
import { useTrainerBookingManagement } from '@/hooks/useTrainerBookingManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const TrainerBookingManagement = () => {
  const { bookings, loading, updateAttendance, refetch } = useTrainerBookingManagement();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [updating, setUpdating] = useState<string | null>(null);

  // Group bookings by date and time
  const groupedBookings = bookings.reduce((acc, booking) => {
    const date = booking.booking_date;
    const timeKey = booking.class?.start_time || '00:00';
    const key = `${date}-${timeKey}`;
    
    if (!acc[key]) {
      acc[key] = {
        date,
        time: timeKey,
        bookings: []
      };
    }
    acc[key].bookings.push(booking);
    return acc;
  }, {} as Record<string, { date: string; time: string; bookings: typeof bookings }>);

  // Sort by date then by time
  const sortedKeys = Object.keys(groupedBookings).sort((a, b) => {
    const [dateA, timeA] = a.split('-');
    const [dateB, timeB] = b.split('-');
    const dateCompare = new Date(dateA).getTime() - new Date(dateB).getTime();
    if (dateCompare !== 0) return dateCompare;
    return timeA.localeCompare(timeB);
  });

  const handleAttendanceUpdate = async (bookingId: string, attended: boolean) => {
    setUpdating(bookingId);
    try {
      await updateAttendance(bookingId, attended);
    } finally {
      setUpdating(null);
    }
  };

  // Check if a booking is from today or future dates
  const isBookingEditable = (bookingDate: string) => {
    const today = startOfDay(new Date());
    const booking = startOfDay(new Date(bookingDate));
    return !isAfter(today, booking); // Today or future
  };

  if (loading) {
    return (
      <Card className="shadow-boxing">
        <CardHeader>
          <CardTitle className="font-oswald">Gestión de Asistencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedKeys.length === 0) {
    return (
      <Card className="shadow-boxing">
        <CardHeader>
          <CardTitle className="font-oswald">Gestión de Asistencia</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-oswald font-bold text-lg mb-2">No hay reservas</h3>
          <p className="text-muted-foreground font-inter">
            No hay reservas de clases para mostrar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-boxing">
      <CardHeader>
        <CardTitle className="font-oswald">Gestión de Asistencia - Entrenador</CardTitle>
        <p className="text-sm text-muted-foreground">
          Gestiona la asistencia de los alumnos a las clases
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedKeys.map((key, index) => {
          const { date, time, bookings: classBookings } = groupedBookings[key];
          const isEditable = isBookingEditable(date);
          
          return (
            <div key={key} className="space-y-4">
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-boxing-red" />
                <h3 className="font-oswald font-bold text-lg">
                  {format(new Date(date), "EEEE d 'de' MMMM", { locale: es })}
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-boxing-red" />
                  <span className="font-oswald font-semibold">
                    {format(new Date(`2000-01-01T${time}`), 'HH:mm')}
                  </span>
                </div>
                <Badge variant={isEditable ? "default" : "secondary"}>
                  {isEditable ? "Editable" : "Finalizada"}
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {classBookings
                  .sort((a, b) => (a.profile?.first_name || '').localeCompare(b.profile?.first_name || ''))
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-boxing-red" />
                            <span className="text-sm font-medium">{booking.class?.title}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            <strong>Alumno:</strong> {booking.profile?.first_name} {booking.profile?.last_name}
                          </span>
                          <span>
                            <strong>Clases restantes:</strong> {booking.user_monthly_classes?.remaining_classes || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {booking.attended === null ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAttendanceUpdate(booking.id, true)}
                              disabled={updating === booking.id || !isEditable}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {updating === booking.id ? (
                                <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Asistió
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAttendanceUpdate(booking.id, false)}
                              disabled={updating === booking.id || !isEditable}
                            >
                              {updating === booking.id ? (
                                <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              No asistió
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={booking.attended ? "default" : "destructive"}
                              className="flex items-center gap-1"
                            >
                              {booking.attended ? (
                                <>
                                  <CheckCircle className="h-3 w-3" />
                                  Asistió
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  No asistió
                                </>
                              )}
                            </Badge>
                            {isEditable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAttendanceUpdate(booking.id, !booking.attended)}
                                disabled={updating === booking.id}
                              >
                                {updating === booking.id ? (
                                  <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  "Cambiar"
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              
              {index !== sortedKeys.length - 1 && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TrainerBookingManagement;