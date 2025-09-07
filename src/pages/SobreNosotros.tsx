import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Shield, TrendingUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import coachImage from '@/assets/coach-training.jpg';

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
        <section className="relative py-24 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-oswald font-bold text-5xl md:text-6xl text-boxing-white mb-6">
              Somos boxeo.
              <span className="block text-boxing-red">Somos comunidad.</span>
            </h1>
            <p className="font-inter text-xl text-boxing-white/90 max-w-2xl mx-auto">
              Más que un gimnasio, somos una familia unida por la pasión del boxeo
            </p>
          </div>
        </section>


        {/* Misión y Valores */}
        <section className="py-20 bg-boxing-grey/30">
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

        {/* Asociación sin ánimo de lucro */}
        <section className="py-20">
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

        {/* Equipo */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">Nuestro Equipo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {equipo.map((miembro, index) => (
                <Card key={index} className="shadow-boxing hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-32 h-32 mx-auto mb-6 bg-boxing-grey rounded-full overflow-hidden">
                      <img 
                        src={coachImage} 
                        alt={miembro.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <h3 className="font-oswald font-bold text-xl mb-2">{miembro.nombre}</h3>
                    <p className="font-inter text-boxing-red font-semibold">{miembro.especialidad}</p>
                  </CardContent>
                </Card>
              ))}
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