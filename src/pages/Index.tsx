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
    { nombre: 'Área de fuerza', imagen: coachTraining },
    { nombre: 'Vestuarios', imagen: gymInterior },
    { nombre: 'Taquillas', imagen: gymInterior },
    { nombre: 'Recepción', imagen: gymInterior }
  ];

  const entrenadores = [
    {
      nombre: 'James Willian Dering',
      especialidad: 'Entrenador',
      credenciales: [
        '15 años de experiencia',
        'Campeón regional amateur',
        'Especialista en técnica'
      ],
      imagen: coachTraining
    },
    {
      nombre: 'Ana García',
      especialidad: 'Técnica y Acondicionamiento',
      credenciales: [
        'Especialista boxeo femenino',
        '8 años formando boxeadores',
        'Licenciada en Deporte'
      ],
      imagen: coachTraining
    },
    {
      nombre: 'Miguel Ruiz',
      especialidad: 'Iniciación y Kids',
      credenciales: [
        'Especialista en juventud',
        'Monitor certificado',
        '5 años con menores'
      ],
      imagen: coachTraining
    }
  ];

  const miniHorario = [
    { dia: 'Lunes', hora: '18:00', clase: 'Técnica', entrenador: 'Ana García' },
    { dia: 'Martes', hora: '19:00', clase: 'Iniciación', entrenador: 'Carlos Mendoza' },
    { dia: 'Miércoles', hora: '18:00', clase: 'Técnica', entrenador: 'Ana García' },
    { dia: 'Jueves', hora: '20:00', clase: 'Sparring controlado', entrenador: 'Carlos Mendoza' },
    { dia: 'Viernes', hora: '17:00', clase: 'Kids', entrenador: 'Miguel Ruiz' },
    { dia: 'Sábado', hora: '11:00', clase: 'Open Gym guiado', entrenador: 'Carlos Mendoza' }
  ];

  const testimonios = [
    {
      texto: "Empecé sin experiencia y ahora hago 3 rounds de sparring controlado. El ambiente es increíble.",
      autor: "Laura M.",
      estrellas: 5
    },
    {
      texto: "Los entrenadores son excepcionales. Me ayudaron a superar mis miedos y ganar confianza.",
      autor: "David R.",
      estrellas: 5
    },
    {
      texto: "Mejor gimnasio de boxeo de Donostia. Técnica, respeto y resultados reales.",
      autor: "Carmen L.",
      estrellas: 5
    }
  ];

  const faq = [
    {
      pregunta: "¿Necesito experiencia previa?",
      respuesta: "No, tenemos grupos específicos por niveles. Nuestras clases de iniciación están diseñadas para personas que nunca han practicado boxeo."
    },
    {
      pregunta: "¿Qué necesito llevar?",
      respuesta: "Solo camiseta deportiva, pantalón cómodo, agua y toalla. Los guantes y vendas están disponibles para principiantes."
    },
    {
      pregunta: "¿Hay sparring obligatorio?",
      respuesta: "No, el sparring es completamente opcional y siempre supervisado. Priorizamos el aprendizaje técnico y la seguridad."
    },
    {
      pregunta: "¿Cuál es la edad mínima?",
      respuesta: "Aceptamos desde los 12 años. Tenemos un grupo Kids especial con metodología adaptada y autorización parental."
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
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">¿Por qué EgiaK.O.?</h2>
            
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
                    <p className="font-inter text-boxing-red font-semibold mb-4">{entrenador.especialidad}</p>
                    
                    <ul className="space-y-2">
                      {entrenador.credenciales.map((credencial, credIndex) => (
                        <li key={credIndex} className="font-inter text-sm text-muted-foreground">
                          • {credencial}
                        </li>
                      ))}
                    </ul>
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
                      <h4 className="font-inter font-semibold text-boxing-red mb-1">{clase.clase}</h4>
                      <p className="font-inter text-sm text-muted-foreground">{clase.entrenador}</p>
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

        {/* Testimonios */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">Lo que dicen nuestros miembros</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonios.map((testimonio, index) => (
                <Card key={index} className="shadow-boxing hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(testimonio.estrellas)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-boxing-gold fill-current" />
                      ))}
                    </div>
                    <blockquote className="font-inter text-muted-foreground mb-4 italic">
                      "{testimonio.texto}"
                    </blockquote>
                    <cite className="font-oswald font-semibold text-boxing-red">
                      — {testimonio.autor}
                    </cite>
                  </CardContent>
                </Card>
              ))}
            </div>
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
