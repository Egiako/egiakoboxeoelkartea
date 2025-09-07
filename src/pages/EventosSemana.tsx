import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Shield } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const EventosSemana = () => {
  const horario = [
    {
      dia: 'Lunes',
      fecha: '13 enero',
      eventos: [
        { hora: '18:30', nivel: 'Principiante', instructor: 'Miguel', plazas: 8, ocupadas: 3 },
        { hora: '20:00', nivel: 'Intermedio', instructor: 'Carlos', plazas: 10, ocupadas: 7 }
      ]
    },
    {
      dia: 'Martes',
      fecha: '14 enero',
      eventos: [
        { hora: '17:30', nivel: 'Avanzado', instructor: 'Miguel', plazas: 8, ocupadas: 6 },
        { hora: '19:00', nivel: 'Principiante', instructor: 'Ana', plazas: 10, ocupadas: 4 },
        { hora: '20:30', nivel: 'Intermedio', instructor: 'Carlos', plazas: 8, ocupadas: 5 }
      ]
    },
    {
      dia: 'Miércoles',
      fecha: '15 enero',
      eventos: [
        { hora: '18:30', nivel: 'Principiante', instructor: 'Ana', plazas: 10, ocupadas: 2 },
        { hora: '20:00', nivel: 'Avanzado', instructor: 'Miguel', plazas: 8, ocupadas: 8 }
      ]
    },
    {
      dia: 'Jueves',
      fecha: '16 enero',
      eventos: [
        { hora: '17:30', nivel: 'Intermedio', instructor: 'Carlos', plazas: 10, ocupadas: 6 },
        { hora: '19:00', nivel: 'Principiante', instructor: 'Ana', plazas: 8, ocupadas: 3 },
        { hora: '20:30', nivel: 'Avanzado', instructor: 'Miguel', plazas: 8, ocupadas: 7 }
      ]
    },
    {
      dia: 'Viernes',
      fecha: '17 enero',
      eventos: [
        { hora: '18:30', nivel: 'Principiante', instructor: 'Miguel', plazas: 10, ocupadas: 5 },
        { hora: '20:00', nivel: 'Intermedio', instructor: 'Carlos', plazas: 8, ocupadas: 4 }
      ]
    },
    {
      dia: 'Sábado',
      fecha: '18 enero',
      eventos: [
        { hora: '10:00', nivel: 'Todos los niveles', instructor: 'Miguel', plazas: 12, ocupadas: 8 },
        { hora: '11:30', nivel: 'Principiante', instructor: 'Ana', plazas: 10, ocupadas: 3 }
      ]
    },
    {
      dia: 'Domingo',
      fecha: '19 enero',
      eventos: []
    }
  ];

  const [filtroNivel, setFiltroNivel] = useState('Todos');

  const eventosFiltrados = horario.map(dia => ({
    ...dia,
    eventos: dia.eventos.filter(evento => 
      filtroNivel === 'Todos' || evento.nivel === filtroNivel
    )
  }));

  const niveles = ['Todos', 'Principiante', 'Intermedio', 'Avanzado', 'Todos los niveles'];

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'Principiante': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermedio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Avanzado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
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
                {niveles.map((nivel) => (
                  <Button
                    key={nivel}
                    variant={filtroNivel === nivel ? "default" : "outline"}
                    onClick={() => setFiltroNivel(nivel)}
                    className="font-inter"
                  >
                    {nivel}
                  </Button>
                ))}
              </div>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {eventosFiltrados.map((dia) => (
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
                        <p className="text-muted-foreground font-inter">
                          {dia.dia === 'Domingo' ? 'Día de descanso' : 'Sin eventos con este filtro'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dia.eventos.map((evento, index) => (
                          <div
                            key={index}
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
              ))}
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