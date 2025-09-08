import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Precios = () => {
  const planes = [
    {
      nombre: 'Plan Mensual',
      precio: '50',
      descripcion: '12 eventos al mes - Día y hora a elegir',
      caracteristicas: [
        '12 eventos mensuales',
        'Eliges día y hora',
        'Acceso a eventos de una hora',
        'Flexibilidad total de horarios',
        'Asesoramiento personalizado'
      ],
      popular: true
    }
  ];

  return (
    <>
      <Navigation />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6 bg-gradient-to-br from-boxing-black to-boxing-red/80 rounded-xl p-8 text-white shadow-boxing">
              <h1 className="font-oswald font-bold text-5xl md:text-6xl text-white mb-6">
                Elige tu plan
              </h1>
              <p className="font-inter text-xl text-white/90 max-w-2xl mx-auto">
                Sin matrícula oculta. Sin compromisos largos. Solo boxeo real.
              </p>
            </div>
          </div>
        </section>

        {/* Planes de precio */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-center">
              <Card 
                className="relative shadow-boxing hover:shadow-glow transition-all duration-300 border-boxing-red border-2 scale-105 max-w-md"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-boxing-red text-boxing-white px-4 py-2 rounded-full flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-oswald font-semibold text-sm">PLAN ÚNICO</span>
                  </div>
                </div>
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="font-oswald font-bold text-2xl mb-2">{planes[0].nombre}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-oswald font-bold text-4xl text-boxing-red">{planes[0].precio}</span>
                    <span className="font-inter text-muted-foreground">€/mes</span>
                  </div>
                  <p className="font-inter text-sm text-muted-foreground mt-2">{planes[0].descripcion}</p>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <ul className="space-y-3 mb-8">
                    {planes[0].caracteristicas.map((caracteristica, charIndex) => (
                      <li key={charIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-boxing-red flex-shrink-0 mt-0.5" />
                        <span className="font-inter text-sm">{caracteristica}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    asChild 
                    variant="hero"
                    className="w-full font-oswald font-semibold"
                  >
                    <Link to="/registrate">Regístrate ahora</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Nota informativa */}
            <div className="mt-16 max-w-4xl mx-auto">
              <Card className="bg-boxing-grey/30">
                <CardContent className="p-8 text-center">
                  <h3 className="font-oswald font-bold text-xl mb-4">Información importante</h3>
                  <p className="font-inter text-muted-foreground">
                    Los precios se muestran solo a título informativo. La inscripción y gestión de pagos 
                    se realizan en recepción tras completar el registro web.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* CTA Final */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-oswald font-bold text-4xl text-boxing-white mb-6">
              ¿Listo para empezar?
            </h2>
            <p className="font-inter text-xl text-boxing-white/90 mb-8 max-w-2xl mx-auto">
              Regístrate hoy y comienza tu transformación.
            </p>
            <Button asChild variant="hero" size="lg" className="font-oswald font-semibold text-lg px-8 py-4">
              <Link to="/registrate">Regístrate ahora</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Precios;