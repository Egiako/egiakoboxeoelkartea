import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Shield, RefreshCw, MessageCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const ClasesSemana = () => {
  const [filtroActivo, setFiltroActivo] = useState('Todos');

  const filtros = ['Todos', 'Iniciación', 'Técnica', 'Sparring controlado', 'Fuerza & Acond.', 'Kids'];

  const horario = [
    {
      dia: 'Lunes',
      clases: [
        { hora: '10:00', tipo: 'Iniciación', entrenador: 'Carlos Mendoza', nivel: 'Principiante' },
        { hora: '18:00', tipo: 'Técnica', entrenador: 'Ana García', nivel: 'Intermedio' },
        { hora: '19:00', tipo: 'Fuerza & Acond.', entrenador: 'Miguel Ruiz', nivel: 'Todos' }
      ]
    },
    {
      dia: 'Martes',
      clases: [
        { hora: '10:00', tipo: 'Técnica', entrenador: 'Ana García', nivel: 'Intermedio' },
        { hora: '19:00', tipo: 'Iniciación', entrenador: 'Carlos Mendoza', nivel: 'Principiante' },
        { hora: '20:00', tipo: 'Sparring controlado', entrenador: 'Carlos Mendoza', nivel: 'Avanzado' }
      ]
    },
    {
      dia: 'Miércoles',
      clases: [
        { hora: '10:00', tipo: 'Fuerza & Acond.', entrenador: 'Miguel Ruiz', nivel: 'Todos' },
        { hora: '18:00', tipo: 'Técnica', entrenador: 'Ana García', nivel: 'Intermedio' },
        { hora: '19:00', tipo: 'Iniciación', entrenador: 'Carlos Mendoza', nivel: 'Principiante' }
      ]
    },
    {
      dia: 'Jueves',
      clases: [
        { hora: '10:00', tipo: 'Iniciación', entrenador: 'Carlos Mendoza', nivel: 'Principiante' },
        { hora: '19:00', tipo: 'Técnica', entrenador: 'Ana García', nivel: 'Intermedio' },
        { hora: '20:00', tipo: 'Sparring controlado', entrenador: 'Carlos Mendoza', nivel: 'Avanzado' }
      ]
    },
    {
      dia: 'Viernes',
      clases: [
        { hora: '17:00', tipo: 'Kids', entrenador: 'Miguel Ruiz', nivel: 'Infantil' },
        { hora: '18:00', tipo: 'Técnica', entrenador: 'Ana García', nivel: 'Intermedio' },
        { hora: '19:00', tipo: 'Fuerza & Acond.', entrenador: 'Miguel Ruiz', nivel: 'Todos' }
      ]
    },
    {
      dia: 'Sábado',
      clases: [
        { hora: '11:00', tipo: 'Open Gym guiado', entrenador: 'Carlos Mendoza', nivel: 'Todos' }
      ]
    },
    {
      dia: 'Domingo',
      clases: []
    }
  ];

  const clasesFiltradas = horario.map(dia => ({
    ...dia,
    clases: dia.clases.filter(clase => 
      filtroActivo === 'Todos' || clase.tipo === filtroActivo
    )
  }));

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Iniciación': return 'bg-green-100 text-green-800 border-green-200';
      case 'Técnica': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sparring controlado': return 'bg-red-100 text-red-800 border-red-200';
      case 'Fuerza & Acond.': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Kids': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Open Gym guiado': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <Navigation />
      
      <main className="min-h-screen bg-background">
        {/* Header */}
        <section className="py-16 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-oswald font-bold text-5xl text-boxing-white mb-4">
              Clases disponibles esta semana
            </h1>
            <p className="font-inter text-xl text-boxing-white/90">
              Elige la clase que mejor se adapte a tu nivel y horario
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Filtros */}
          <div className="mb-8">
            <h2 className="font-oswald font-bold text-2xl mb-4">Filtrar por tipo</h2>
            <div className="flex flex-wrap gap-3">
              {filtros.map((filtro) => (
                <Badge
                  key={filtro}
                  variant={filtroActivo === filtro ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 font-inter font-medium transition-all ${
                    filtroActivo === filtro 
                      ? 'bg-boxing-red text-white hover:bg-boxing-red/90' 
                      : 'hover:bg-boxing-red/10'
                  }`}
                  onClick={() => setFiltroActivo(filtro)}
                >
                  {filtro}
                </Badge>
              ))}
            </div>
          </div>

          {/* Horario semanal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
            {clasesFiltradas.map((dia) => (
              <Card key={dia.dia} className="shadow-boxing">
                <CardHeader className="pb-4">
                  <CardTitle className="font-oswald font-bold text-xl text-center">
                    {dia.dia}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dia.clases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-inter">
                        {dia.dia === 'Domingo' ? 'Día de descanso' : 'Sin clases con este filtro'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dia.clases.map((clase, index) => (
                        <div key={index} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-boxing-red" />
                              <span className="font-oswald font-bold text-lg">{clase.hora}</span>
                            </div>
                            <Badge className={`text-xs ${getTipoColor(clase.tipo)}`}>
                              {clase.tipo}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-inter">{clase.entrenador}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-inter">Nivel: {clase.nivel}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Nota importante */}
          <Card className="bg-boxing-grey/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-boxing-red flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-oswald font-bold text-lg mb-2">Nota importante</h3>
                  <p className="font-inter text-muted-foreground">
                    El sparring es completamente opcional y siempre supervisado por nuestros entrenadores. 
                    Priorizamos un ambiente seguro y de respeto mutuo en todas las clases.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="font-oswald font-semibold">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar semana
            </Button>
            
            <Button variant="hero" className="font-oswald font-semibold">
              <MessageCircle className="h-4 w-4 mr-2" />
              Reservar por WhatsApp
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ClasesSemana;