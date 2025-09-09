import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Shield, Calendar } from 'lucide-react';
import { useManualSchedules } from '@/hooks/useManualSchedules';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

const EventosSemana = () => {
  // Calculate this week's date range
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

  const { schedules, loading } = useManualSchedules(weekStart, weekEnd);
  const [filtroInstructor, setFiltroInstructor] = useState('Todos');

  // Group schedules by day
  const schedulesByDay = schedules.reduce((acc, schedule) => {
    const date = new Date(schedule.class_date);
    const dayName = format(date, 'EEEE', { locale: es });
    const dayKey = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    if (!acc[dayKey]) {
      acc[dayKey] = {
        dia: dayKey,
        fecha: format(date, 'd \'de\' MMMM', { locale: es }),
        eventos: []
      };
    }
    
    const timeStr = format(new Date(`2000-01-01T${schedule.start_time}`), 'HH:mm');
    const endTimeStr = format(new Date(`2000-01-01T${schedule.end_time}`), 'HH:mm');
    
    acc[dayKey].eventos.push({
      id: schedule.id,
      hora: `${timeStr} - ${endTimeStr}`,
      nivel: schedule.title,
      instructor: schedule.instructor_name,
      plazas: schedule.max_students,
      ocupadas: schedule.current_bookings,
      notes: schedule.notes
    });
    
    return acc;
  }, {} as Record<string, any>);

  // Convert to array and ensure all days are represented
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const horario = diasSemana.map(dia => {
    if (schedulesByDay[dia]) {
      return schedulesByDay[dia];
    }
    return {
      dia,
      fecha: '',
      eventos: []
    };
  });

  // Get unique instructors for filtering
  const instructores = ['Todos', ...new Set(schedules.map(s => s.instructor_name))];

  const eventosFiltrados = horario.map(dia => ({
    ...dia,
    eventos: dia.eventos.filter((evento: any) => 
      filtroInstructor === 'Todos' || evento.instructor === filtroInstructor
    )
  }));

  const getNivelColor = (nivel: string) => {
    // Color based on class title/type
    if (nivel.toLowerCase().includes('principiante') || nivel.toLowerCase().includes('básico')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (nivel.toLowerCase().includes('intermedio')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (nivel.toLowerCase().includes('avanzado')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <>
      <Navigation />
      
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="font-oswald font-bold text-4xl mb-4">
                Eventos disponibles esta semana
              </h1>
              <p className="font-inter text-lg text-muted-foreground">
                Elige el horario que mejor se adapte a ti. Todos los eventos tienen una duración de 60 minutos.
              </p>
            </div>

            {/* Filtros */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-3 justify-center">
                {instructores.map((instructor) => (
                  <Button
                    key={instructor}
                    variant={filtroInstructor === instructor ? "default" : "outline"}
                    onClick={() => setFiltroInstructor(instructor)}
                    className="font-inter"
                  >
                    {instructor}
                  </Button>
                ))}
              </div>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {loading ? (
                // Loading state
                Array.from({ length: 7 }).map((_, index) => (
                  <Card key={index} className="shadow-boxing">
                    <CardHeader>
                      <div className="animate-pulse space-y-2">
                        <div className="h-6 bg-muted rounded w-2/3 mx-auto" />
                        <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="animate-pulse space-y-4">
                        <div className="h-16 bg-muted rounded" />
                        <div className="h-16 bg-muted rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                eventosFiltrados.map((dia) => (
                  <Card key={dia.dia} className="shadow-boxing">
                    <CardHeader>
                      <CardTitle className="font-oswald font-bold text-xl text-center">
                        {dia.dia}
                      </CardTitle>
                      <p className="text-center text-muted-foreground font-inter">{dia.fecha}</p>
                    </CardHeader>
                    <CardContent>
                      {dia.eventos.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground font-inter">
                            {dia.dia === 'Domingo' ? 'Día de descanso' : 'Sin eventos con este filtro'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dia.eventos.map((evento: any, index: number) => (
                            <div
                              key={evento.id || index}
                              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-boxing-red" />
                                  <span className="font-oswald font-semibold">{evento.hora}</span>
                                </div>
                                <Badge className={`${getNivelColor(evento.nivel)} border`}>
                                  {evento.nivel}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                                <span>Instructor: {evento.instructor}</span>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{evento.ocupadas}/{evento.plazas}</span>
                                </div>
                              </div>
                              
                              {evento.notes && (
                                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mb-3">
                                  {evento.notes}
                                </div>
                              )}
                              
                              <Button 
                                className="w-full font-inter"
                                variant={evento.ocupadas >= evento.plazas ? "secondary" : "default"}
                                disabled={evento.ocupadas >= evento.plazas}
                              >
                                {evento.ocupadas >= evento.plazas ? 'Completo' : 'Reservar plaza'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Información adicional */}
            <Card className="bg-boxing-grey/30 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-5 w-5 text-boxing-red" />
                  <h3 className="font-oswald font-bold text-lg">Normas importantes</h3>
                </div>
                <ul className="space-y-2 font-inter text-muted-foreground">
                  <li>• Llega 10 minutos antes del inicio del evento</li>
                  <li>• Trae ropa cómoda y botella de agua</li>
                  <li>• Priorizamos un ambiente seguro y de respeto mutuo en todos los eventos</li>
                  <li>• Puedes cancelar tu reserva hasta 2 horas antes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default EventosSemana;