import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Shield, TrendingUp, Award } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const SobreNosotros = () => {

  const valores = [
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Disciplina',
      description: 'Constancia y dedicación en cada entrenamiento'
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Humildad',
      description: 'Respeto por el deporte y compañeros de entrenamiento'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Seguridad',
      description: 'Ambiente controlado y supervisión profesional'
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Progreso real',
      description: 'Resultados medibles y crecimiento personal'
    }
  ];

  const equipo = [
    {
      nombre: 'Xabi Burgueño',
      especialidad: 'Entrenador'
    },
    {
      nombre: 'James William',
      especialidad: 'Entrenador'
    }
  ];

  return (
    <>
      <Navigation />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-24">
          {/* Background decorative elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-16 right-1/4 w-16 h-16 bg-accent/20 rounded-full blur-2xl animate-fade-in"></div>
            <div className="absolute top-12 left-1/4 w-20 h-20 bg-primary/5 rounded-full blur-2xl animate-fade-in"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="text-center space-y-6 bg-gradient-to-br from-boxing-black via-boxing-black/90 to-boxing-red/80 rounded-xl p-8 text-white shadow-boxing relative overflow-hidden">
              
              {/* Animated decorative elements */}
              <div className="absolute top-4 left-4 w-3 h-3 bg-white/20 rounded-full animate-ping"></div>
              <div className="absolute top-6 right-6 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-4 h-4 bg-white/10 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-6 right-4 w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>

              {/* Title with enhanced animations */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-white to-white rounded-full animate-fade-in"></div>
                  <Users className="h-10 w-10 text-white animate-scale-in" />
                  <div className="w-12 h-0.5 bg-gradient-to-r from-white via-white to-transparent rounded-full animate-fade-in"></div>
                </div>
                
                <h1 className="font-oswald font-bold text-5xl md:text-6xl text-white mb-6 animate-fade-in">
                  <span className="inline-block hover:scale-105 transition-transform duration-300">Somos</span>{" "}
                  <span className="inline-block hover:scale-105 transition-transform duration-300 text-transparent bg-gradient-to-r from-white to-white/80 bg-clip-text">boxeo.</span>
                  <span className="block text-white animate-slide-in-right" style={{animationDelay: '0.3s'}}>
                    <span className="inline-block hover:scale-105 transition-transform duration-300">Somos</span>{" "}
                    <span className="inline-block hover:scale-105 transition-transform duration-300">comunidad.</span>
                  </span>
                </h1>
                
                <p className="font-inter text-xl text-white/90 max-w-2xl mx-auto animate-fade-in" style={{animationDelay: '0.6s'}}>
                  Más que un gimnasio, somos una <span className="font-semibold text-white">familia unida</span> por la pasión del boxeo
                </p>

                {/* Pulsing call-to-action indicator */}
                <div className="flex items-center justify-center gap-2 mt-6 animate-fade-in" style={{animationDelay: '0.9s'}}>
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span className="text-sm text-white/80">Descubre nuestra historia</span>
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Asociación sin ánimo de lucro */}
        <section className="py-20 bg-boxing-grey/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-oswald font-bold text-4xl mb-8">Asociación sin ánimo de lucro</h2>
              <p className="font-inter text-lg text-muted-foreground leading-relaxed">
                Nuestra entidad está constituida como una asociación deportiva sin ánimo de lucro. 
                Esto significa que todos los recursos y aportaciones que recibimos se destinan 
                íntegramente a la promoción del boxeo, al desarrollo de actividades deportivas y 
                formativas, y al fomento de valores como el respeto, la disciplina y la superación personal.
              </p>
            </div>
          </div>
        </section>

        {/* Misión y Valores */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-oswald font-bold text-4xl mb-6">Nuestra Misión</h2>
              <p className="font-inter text-xl text-muted-foreground max-w-3xl mx-auto">
                "Hacemos del boxeo una escuela de confianza y respeto, donde cada persona puede descubrir su fuerza interior y alcanzar sus objetivos."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {valores.map((valor, index) => (
                <Card key={index} className="text-center shadow-boxing hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="text-boxing-red mb-4 flex justify-center">
                      {valor.icon}
                    </div>
                    <h3 className="font-oswald font-bold text-xl mb-4">{valor.title}</h3>
                    <p className="font-inter text-muted-foreground">{valor.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Equipo */}
        <section className="py-20 bg-boxing-grey/30 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 -z-10 opacity-10">
            <div className="absolute top-20 left-10 w-40 h-40 border-2 border-boxing-red rotate-45"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 border-2 border-boxing-red rotate-45"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 border border-boxing-red/30 rotate-12"></div>
          </div>

          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">Nuestro Equipo</h2>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {equipo.map((miembro, index) => (
                  <Card key={index} className="shadow-boxing hover:shadow-glow transition-all duration-300 group relative overflow-hidden">
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-boxing-red/10 to-transparent"></div>
                    
                    <CardContent className="p-10 text-center relative">
                      {/* Icon container with animated background */}
                      <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-boxing-red/20 to-boxing-red/5 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                        <div className="absolute inset-2 bg-background rounded-full"></div>
                        <Award className="h-12 w-12 text-boxing-red relative z-10 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      
                      <h3 className="font-oswald font-bold text-2xl mb-2">{miembro.nombre}</h3>
                      <p className="font-inter text-boxing-red font-semibold text-lg">{miembro.especialidad}</p>
                      
                      {/* Bottom accent line */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-boxing-red to-transparent group-hover:w-full transition-all duration-500"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Central divider with boxing gloves icon */}
              <div className="flex items-center justify-center gap-4 mt-12">
                <div className="h-px bg-gradient-to-r from-transparent via-boxing-red to-boxing-red flex-1"></div>
                <div className="w-12 h-12 rounded-full bg-boxing-red/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-boxing-red" />
                </div>
                <div className="h-px bg-gradient-to-r from-boxing-red to-transparent flex-1"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Acceso y aparcamiento */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-oswald font-bold text-4xl mb-8">Acceso y aparcamiento</h2>
              <div className="font-inter text-lg text-muted-foreground leading-relaxed space-y-4">
                <p>
                  Nuestro local está situado en una calle sin salida, por lo que no hay aparcamiento para coches.
                </p>
                <p>
                  Sin embargo, disponemos de dos parkings para motos justo al lado del local.
                </p>
                <p>
                  Recomendamos venir a pie o en transporte público siempre que sea posible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-oswald font-bold text-4xl text-boxing-white mb-6">
              ¿Listo para unirte a la familia?
            </h2>
            <p className="font-inter text-xl text-boxing-white/90 mb-8 max-w-2xl mx-auto">
              Empieza tu viaje en el boxeo con los mejores entrenadores de Donostia
            </p>
            <Button asChild variant="hero" size="lg" className="font-oswald font-semibold text-lg px-8 py-4">
              <Link to="/registrate">Únete hoy</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SobreNosotros;