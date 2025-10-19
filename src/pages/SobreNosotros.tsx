import { Link } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Shield, TrendingUp, Award } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const SobreNosotros = () => {
  usePageTitle('Sobre Nosotros');

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
      <SEO 
        title="Sobre Nosotros"
        description="Conoce la historia de Egia K.O. Boxeo Elkartea. Un club comprometido con el desarrollo del boxeo en Donostia desde hace años."
        keywords="club boxeo Donostia, historia boxeo, equipo entrenadores, boxeo San Sebastián"
      />
      <Navigation />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-6 bg-gradient-to-br from-boxing-black via-boxing-black/90 to-boxing-red/80 rounded-xl p-8 text-white shadow-boxing relative overflow-hidden">
                
                {/* Animated decorative elements */}
                <div className="absolute top-4 left-4 w-3 h-3 bg-white/20 rounded-full animate-ping"></div>
                <div className="absolute top-6 right-6 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                <div className="absolute bottom-4 left-8 w-4 h-4 bg-white/10 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-6 right-4 w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>

                {/* Main title with enhanced styling */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-white to-white rounded-full animate-fade-in"></div>
                    <Users className="h-10 w-10 text-white animate-scale-in" />
                    <div className="w-12 h-0.5 bg-gradient-to-r from-white via-white to-transparent rounded-full animate-fade-in"></div>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-oswald font-bold tracking-tight animate-fade-in">
                    <span className="text-white inline-block hover:scale-105 transition-transform duration-300">
                      Somos boxeo.
                    </span>
                    <span className="block text-primary mt-2">Somos comunidad.</span>
                  </h1>
                  
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="h-1 w-8 bg-white/60 rounded-full animate-scale-in"></div>
                    <div className="h-0.5 w-16 bg-gradient-to-r from-white/50 to-white/30 rounded-full animate-scale-in"></div>
                    <div className="h-1 w-8 bg-white/60 rounded-full animate-scale-in"></div>
                  </div>
                </div>

                {/* Enhanced subtitle with better typography */}
                <div className="max-w-3xl mx-auto space-y-4">
                  <p className="text-xl md:text-2xl text-white font-inter leading-relaxed animate-fade-in" style={{animationDelay: '0.3s'}}>
                    Más que un gimnasio, somos una <span className="text-white font-semibold">familia unida</span> por la pasión del boxeo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Asociación sin ánimo de lucro - Diseño limpio */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="bg-muted/30 rounded-2xl p-8 md:p-12">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                    <Shield className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="font-oswald font-bold text-3xl md:text-4xl">
                    Asociación sin ánimo de lucro
                  </h2>
                </div>
                
                <p className="font-inter text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 text-center">
                  Nuestra entidad está constituida como una <span className="font-semibold text-foreground">asociación deportiva sin ánimo de lucro</span>.
                </p>
                
                <div className="space-y-6">
                  <p className="font-inter text-lg text-center text-muted-foreground">
                    Todos los recursos y aportaciones que recibimos se destinan íntegramente a:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="flex flex-col items-center text-center p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors">
                      <Target className="h-10 w-10 text-primary mb-4" />
                      <p className="font-inter text-base font-semibold">La promoción del boxeo</p>
                    </div>
                    
                    <div className="flex flex-col items-center text-center p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors">
                      <TrendingUp className="h-10 w-10 text-primary mb-4" />
                      <p className="font-inter text-base font-semibold">El desarrollo de actividades deportivas y formativas</p>
                    </div>
                    
                    <div className="flex flex-col items-center text-center p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors">
                      <Award className="h-10 w-10 text-primary mb-4" />
                      <p className="font-inter text-base font-semibold">Fomentar valores como el respeto, la disciplina y la superación personal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Misión y Valores - Diseño en dos columnas */}
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Valores */}
              <div className="text-center mb-12">
                <h2 className="font-oswald font-bold text-3xl md:text-4xl">Nuestros Valores</h2>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {valores.map((valor, index) => (
                  <Card key={index} className="border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                        <div className="text-primary">
                          {valor.icon}
                        </div>
                      </div>
                      <h3 className="font-oswald font-bold text-xl mb-3">{valor.title}</h3>
                      <p className="font-inter text-muted-foreground leading-relaxed">{valor.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Equipo - Diseño limpio y profesional */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-oswald font-bold text-3xl md:text-4xl">Nuestro Equipo</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {equipo.map((miembro, index) => (
                  <Card key={index} className="border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-8 text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                        <Award className="h-10 w-10 text-primary" />
                      </div>
                      
                      <h3 className="font-oswald font-bold text-2xl mb-2">{miembro.nombre}</h3>
                      <p className="font-inter text-primary font-semibold text-lg">{miembro.especialidad}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Acceso y aparcamiento */}
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-oswald font-bold text-3xl md:text-4xl">Acceso y aparcamiento</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-border hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <h3 className="font-oswald font-bold text-xl mb-4 text-primary">Calle sin salida</h3>
                    <p className="font-inter text-muted-foreground leading-relaxed">
                      Nuestro local está en una <span className="font-semibold text-foreground">calle sin salida</span>, por lo que <span className="font-semibold text-foreground">no hay aparcamiento para coches</span>.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <h3 className="font-oswald font-bold text-xl mb-4 text-primary">Parking para motos</h3>
                    <p className="font-inter text-muted-foreground leading-relaxed">
                      Disponemos de <span className="font-semibold text-foreground">dos parkings para motos</span> justo al lado del local.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <h3 className="font-oswald font-bold text-xl mb-4 text-primary">Recomendación</h3>
                    <p className="font-inter text-muted-foreground leading-relaxed">
                      Recomendamos venir <span className="font-semibold text-foreground">a pie o en transporte público</span> siempre que sea posible.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final - Limpio y directo */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/95 to-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-oswald font-bold text-3xl md:text-4xl text-primary-foreground mb-6">
              ¿Listo para unirte a la familia?
            </h2>
            <p className="font-inter text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Empieza tu viaje en el boxeo con los mejores entrenadores de Donostia
            </p>
            <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 font-oswald font-semibold text-lg px-8 h-14">
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
