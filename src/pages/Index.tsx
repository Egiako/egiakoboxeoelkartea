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
import boxingRing from '@/assets/ring.jpg';
import coachTraining from '@/assets/coach-training.jpg';
import fuerzaImage from '@/assets/fuerza.jpg';
import sacosImage from '@/assets/sacos.jpg';
const Index = () => {
  const beneficios = [{
    icon: <Target className="h-8 w-8" />,
    title: 'Técnica desde cero',
    description: 'Aprende base sólida sin miedo con nuestro programa de iniciación'
  }, {
    icon: <Users className="h-8 w-8" />,
    title: 'Entrenadores titulados',
    description: 'Seguimiento real y correcciones de profesionales certificados'
  }, {
    icon: <Shield className="h-8 w-8" />,
    title: 'Ambiente seguro',
    description: 'Sparring controlado, respeto y progreso en un entorno protegido'
  }, {
    icon: <TrendingUp className="h-8 w-8" />,
    title: 'Resultados medibles',
    description: 'Resistencia, potencia y confianza que puedes ver y sentir'
  }];
  const instalaciones = [{
    nombre: 'Ring profesional',
    imagen: boxingRing
  }, {
    nombre: 'Zona de sacos',
    imagen: sacosImage
  }, {
    nombre: 'Área de fuerza',
    imagen: fuerzaImage
  }];
  const entrenadores = [{
    nombre: 'Xabi Burgueño',
    especialidad: 'Entrenador',
    imagen: coachTraining
  }, {
    nombre: 'James William',
    especialidad: 'Entrenador',
    imagen: coachTraining
  }];
  const miniHorario = [{
    dia: 'Lunes',
    hora: '9:00-10:00',
    clase: 'Técnica mañana'
  }, {
    dia: 'Lunes',
    hora: '18:00-19:00',
    clase: 'Técnica tarde'
  }, {
    dia: 'Martes',
    hora: '9:00-10:00',
    clase: 'Técnica mañana'
  }, {
    dia: 'Martes',
    hora: '18:00-19:00',
    clase: 'Técnica tarde'
  }, {
    dia: 'Miércoles',
    hora: '9:00-10:00',
    clase: 'Técnica mañana'
  }, {
    dia: 'Miércoles',
    hora: '18:00-19:00',
    clase: 'Técnica tarde'
  }, {
    dia: 'Jueves',
    hora: '9:00-10:00',
    clase: 'Técnica mañana'
  }, {
    dia: 'Jueves',
    hora: '18:00-19:00',
    clase: 'Técnica tarde'
  }];
  const faq = [{
    pregunta: "¿Necesito experiencia previa?",
    respuesta: "No, estamos preparados para acoger a cualquier tipo de nivel."
  }, {
    pregunta: "¿Qué necesito llevar?",
    respuesta: "Solo vendas de boxeo, bucal y guantes."
  }, {
    pregunta: "¿Hay sparring obligatorio?",
    respuesta: "No, el sparring es completamente opcional y siempre supervisado. Priorizamos el aprendizaje técnico y la seguridad."
  }, {
    pregunta: "¿Cuál es la edad mínima?",
    respuesta: "Aceptamos desde los 16 años."
  }];
  return <>
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Beneficios */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">¿Por qué <span className="text-boxing-black">Egia</span><span className="text-boxing-red">K.O.</span><span className="text-boxing-black"> Boxeo Elkartea</span>?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {beneficios.map((beneficio, index) => <Card key={index} className="text-center shadow-boxing hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="text-boxing-red mb-4 flex justify-center">
                      {beneficio.icon}
                    </div>
                    <h3 className="font-oswald font-bold text-xl mb-4">{beneficio.title}</h3>
                    <p className="font-inter text-muted-foreground">{beneficio.description}</p>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {/* Instalaciones */}
        <section className="py-20 bg-boxing-grey/30">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">Nuestras Instalaciones</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {instalaciones.map((instalacion, index) => <Card key={index} className="overflow-hidden shadow-boxing hover:shadow-glow transition-all duration-300">
                  <div className="aspect-video bg-boxing-grey/20 overflow-hidden">
                    <img src={instalacion.imagen} alt={instalacion.nombre} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-oswald font-semibold text-center">{instalacion.nombre}</h3>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {/* Entrenadores */}
        

        {/* Mini-horario */}
        <section className="py-20 bg-boxing-grey/30">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">Horarios </h2>
            
            <Card className="max-w-5xl mx-auto shadow-boxing">
              <CardContent className="p-8">
                {/* Aviso aclaratorio */}
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="font-inter text-sm text-center text-yellow-900 dark:text-yellow-100">
                    ⚠️ El servicio de mañana es de una hora por día. El horario podrá variar entre 9:00–10:00 o 10:00–11:00, según el día.
                  </p>
                </div>

                {/* Horarios de Mañana */}
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <h3 className="font-oswald font-bold text-2xl text-boxing-red mb-2">Horarios de Mañana</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves'].map((dia, index) => (
                      <Card key={`morning1-${index}`} className="bg-gradient-to-br from-boxing-red/10 to-boxing-red/20 border-boxing-red/30 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 text-center">
                          <h4 className="font-oswald font-bold text-lg mb-2">{dia}</h4>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Clock className="h-4 w-4 text-boxing-red" />
                            <span className="font-inter font-semibold text-boxing-red">9:00 - 10:00</span>
                          </div>
                          <p className="font-inter text-sm text-muted-foreground">Técnica mañana</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves'].map((dia, index) => (
                      <Card key={`morning2-${index}`} className="bg-gradient-to-br from-boxing-red/10 to-boxing-red/20 border-boxing-red/30 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 text-center">
                          <h4 className="font-oswald font-bold text-lg mb-2">{dia}</h4>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Clock className="h-4 w-4 text-boxing-red" />
                            <span className="font-inter font-semibold text-boxing-red">10:00 - 11:00</span>
                          </div>
                          <p className="font-inter text-sm text-muted-foreground">Técnica mañana</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Horarios de Tarde */}
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <h3 className="font-oswald font-bold text-2xl text-boxing-red mb-2">Horarios de Tarde</h3>
                    <p className="font-inter text-muted-foreground">18:00 - 19:00</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {['Lunes', 'Miércoles'].map((dia, index) => (
                      <Card key={index} className="bg-gradient-to-br from-boxing-black/10 to-boxing-black/20 border-boxing-black/30 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 text-center">
                          <h4 className="font-oswald font-bold text-lg mb-2">{dia}</h4>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Clock className="h-4 w-4 text-boxing-black" />
                            <span className="font-inter font-semibold text-boxing-black">18:00 - 19:00</span>
                          </div>
                          <p className="font-inter text-sm text-muted-foreground">Técnica tarde</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="text-center border-t pt-6">
                  <p className="font-inter text-muted-foreground mb-6">
                    Ver horario completo y reservar clases requiere registro
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="hero" className="font-oswald font-semibold">
                      <Link to="/registrate">Registrarse ahora</Link>
                    </Button>
                    <Button asChild variant="outline" className="font-oswald font-semibold">
                      <Link to="/horarios">Ver todos los horarios</Link>
                    </Button>
                  </div>
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
                {faq.map((item, index) => <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="font-oswald font-semibold text-left">
                      {item.pregunta}
                    </AccordionTrigger>
                    <AccordionContent className="font-inter text-muted-foreground">
                      {item.respuesta}
                    </AccordionContent>
                  </AccordionItem>)}
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
    </>;
};
export default Index;