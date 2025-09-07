import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Star, Target, Users, Shield, TrendingUp, Clock, MapPin, Phone, Mail } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import heroImage from '@/assets/hero-boxing.jpg';
import gymInterior from '@/assets/gym-interior.jpg';
import boxingRing from '@/assets/boxing-ring.jpg';
import coachTraining from '@/assets/coach-training.jpg';

const Index = () => {
  const beneficios = [
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Técnica desde cero',
      description: 'Aprende base sólida sin miedo con nuestro programa de iniciación'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Entrenadores titulados',
      description: 'Seguimiento real y correcciones de profesionales certificados'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Ambiente seguro',
      description: 'Sparring controlado, respeto y progreso en un entorno protegido'
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Resultados medibles',
      description: 'Resistencia, potencia y confianza que puedes ver y sentir'
    }
  ];

  const instalaciones = [
    { nombre: 'Ring profesional', imagen: boxingRing },
    { nombre: 'Zona de sacos', imagen: gymInterior },
    { nombre: 'Área de fuerza', imagen: coachTraining }
  ];

  const entrenadores = [
    {
      nombre: 'Xabi Burgueño',
      especialidad: 'Entrenador',
      imagen: coachTraining
    },
    {
      nombre: 'James William',
      especialidad: 'Entrenador',
      imagen: coachTraining
    }
  ];

  const miniHorario = [
    { dia: 'Lunes', hora: '9:00-10:00', clase: 'Técnica mañana' },
    { dia: 'Lunes', hora: '18:00-19:00', clase: 'Técnica tarde' },
    { dia: 'Martes', hora: '9:30-10:30', clase: 'Técnica mañana' },
    { dia: 'Martes', hora: '18:00-19:00', clase: 'Técnica tarde' },
    { dia: 'Miércoles', hora: '9:00-10:00', clase: 'Técnica mañana' },
    { dia: 'Miércoles', hora: '18:00-19:00', clase: 'Técnica tarde' },
    { dia: 'Jueves', hora: '9:30-10:30', clase: 'Técnica mañana' },
    { dia: 'Jueves', hora: '18:00-19:00', clase: 'Técnica tarde' }
  ];


  const faq = [
    {
      pregunta: "¿Necesito experiencia previa?",
      respuesta: "No, estamos preparados para acoger a cualquier tipo de nivel."
    },
    {
      pregunta: "¿Qué necesito llevar?",
      respuesta: "Solo vendas de boxeo, bucal y guantes."
    },
    {
      pregunta: "¿Hay sparring obligatorio?",
      respuesta: "No, el sparring es completamente opcional y siempre supervisado. Priorizamos el aprendizaje técnico y la seguridad."
    },
    {
      pregunta: "¿Cuál es la edad mínima?",
      respuesta: "Aceptamos desde los 16 años."
    }
  ];

  return (
    <>
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Beneficios */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">¿Por qué <span className="text-boxing-black">Egia</span><span className="text-boxing-red">K.O.</span><span className="text-boxing-black"> Boxeo Elkartea</span>?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {beneficios.map((beneficio, index) => (
                <Card key={index} className="text-center shadow-boxing hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="text-boxing-red mb-4 flex justify-center">
                      {beneficio.icon}
                    </div>
                    <h3 className="font-oswald font-bold text-xl mb-4">{beneficio.title}</h3>
                    <p className="font-inter text-muted-foreground">{beneficio.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Instalaciones */}
        <section className="py-20 bg-boxing-grey/30">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">Nuestras Instalaciones</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {instalaciones.map((instalacion, index) => (
                <Card key={index} className="overflow-hidden shadow-boxing hover:shadow-glow transition-all duration-300">
                  <div className="aspect-video bg-boxing-grey/20 overflow-hidden">
                    <img 
                      src={instalacion.imagen} 
                      alt={instalacion.nombre}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-oswald font-semibold text-center">{instalacion.nombre}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Entrenadores */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">Nuestro Equipo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {entrenadores.map((entrenador, index) => (
                <Card key={index} className="shadow-boxing hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-32 h-32 mx-auto mb-6 bg-boxing-grey rounded-full overflow-hidden">
                      <img 
                        src={entrenador.imagen} 
                        alt={entrenador.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <h3 className="font-oswald font-bold text-xl mb-2">{entrenador.nombre}</h3>
                    <p className="font-inter text-boxing-red font-semibold">{entrenador.especialidad}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mini-horario */}
        <section className="py-20 bg-boxing-grey/30">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">Horario Destacado</h2>
            
            <Card className="max-w-4xl mx-auto shadow-boxing">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {miniHorario.map((clase, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-oswald font-bold text-lg">{clase.dia}</span>
                        <Badge variant="outline" className="text-xs">
                          {clase.hora}
                        </Badge>
                      </div>
                      <h4 className="font-inter font-semibold text-boxing-red">{clase.clase}</h4>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <p className="font-inter text-muted-foreground mb-6">
                    Ver horario completo requiere registro
                  </p>
                  <Button asChild variant="hero" className="font-oswald font-semibold">
                    <Link to="/registrate">Ver todas las clases</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>


        {/* FAQ */}
        <section className="py-20 bg-boxing-grey/30">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">Preguntas Frecuentes</h2>
            
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {faq.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="font-oswald font-semibold text-left">
                      {item.pregunta}
                    </AccordionTrigger>
                    <AccordionContent className="font-inter text-muted-foreground">
                      {item.respuesta}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-oswald font-bold text-5xl text-boxing-white mb-6">
              Tu momento es ahora
            </h2>
            <p className="font-inter text-xl text-boxing-white/90 mb-8 max-w-2xl mx-auto">
              Únete a la comunidad de boxeo más fuerte de Donostia. Primera clase incluida.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button asChild variant="hero" size="lg" className="font-oswald font-semibold text-lg px-8 py-4">
                <Link to="/registrate">Prueba una clase</Link>
              </Button>
              <Button asChild variant="outline-hero" size="lg" className="font-oswald font-semibold text-lg px-8 py-4">
                <Link to="/precios">Ver precios</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Index;
