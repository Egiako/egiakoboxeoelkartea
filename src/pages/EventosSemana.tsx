import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Shield, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

const EventosSemana = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroInstructor, setFiltroInstructor] = useState('Todos');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Get unique instructors for filtering
  const instructores = ['Todos', ...new Set(classes.map(c => c.instructor).filter(Boolean))];

  // Group classes by day with filtering
  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  };

  const getClassesByDay = () => {
    const dayNumbers = [1, 2, 3, 4]; // Monday to Thursday
    
    return dayNumbers.map(dayNum => {
      const dayClasses = classes.filter(c => {
        const matchesDay = c.day_of_week === dayNum;
        const matchesInstructor = filtroInstructor === 'Todos' || c.instructor === filtroInstructor;
        return matchesDay && matchesInstructor;
      });

      return {
        dia: getDayName(dayNum),
        eventos: dayClasses.map(classItem => ({
          id: classItem.id,
          hora: `${format(new Date(`2000-01-01T${classItem.start_time}`), 'HH:mm')} - ${format(new Date(`2000-01-01T${classItem.end_time}`), 'HH:mm')}`,
          nivel: classItem.title,
          instructor: classItem.instructor || 'Sin asignar',
          plazas: classItem.max_students,
          ocupadas: 0, // We don't have real-time booking counts in this simple version
        }))
      };
    });
  };

  const eventosFiltrados = getClassesByDay();

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {loading ? (
                // Loading state
                Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="shadow-boxing">
                    <CardHeader>
                      <div className="animate-pulse space-y-2">
                        <div className="h-6 bg-muted rounded w-2/3 mx-auto" />
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
                          {dia.eventos.map((evento: any) => (
                            <div
                              key={evento.id}
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
                                  <span>{evento.plazas} plazas</span>
                                </div>
                              </div>
                              
                              <Button 
                                className="w-full font-inter"
                                variant="outline"
                                disabled
                              >
                                Regístrate para reservar
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
                  <li>• ⚠️ Las cancelaciones deben realizarse al menos 1 hora antes del inicio de la clase</li>
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