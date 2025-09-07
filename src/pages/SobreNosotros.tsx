import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Shield, TrendingUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import coachImage from '@/assets/coach-training.jpg';

const SobreNosotros = () => {
  const timeline = [
    { year: '2018', event: 'Nacimos como club de barrio' },
    { year: '2020', event: 'Ampliamos ring y zona de sacos' },
    { year: '2023', event: 'Programas para iniciación, técnica y fuerza' },
    { year: '2025', event: 'Más clases, más horarios, misma esencia' },
  ];

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
      nombre: 'Carlos Mendoza',
      especialidad: 'Entrenador Principal',
      credenciales: [
        '15 años de experiencia profesional',
        'Campeón regional de boxeo amateur',
        'Certificado en entrenamiento deportivo'
      ]
    },
    {
      nombre: 'Ana García',
      especialidad: 'Técnica y Acondicionamiento',
      credenciales: [
        'Especialista en boxeo femenino',
        '8 años formando boxeadores',
        'Licenciada en Ciencias del Deporte'
      ]
    },
    {
      nombre: 'Miguel Ruiz',
      especialidad: 'Iniciación y Kids',
      credenciales: [
        'Especialista en formación juvenil',
        'Monitor certificado de boxeo',
        '5 años trabajando con menores'
      ]
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

        {/* Historia Timeline */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald font-bold text-4xl text-center mb-16">Nuestra Historia</h2>
            
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-boxing-red"></div>
                
                {timeline.map((item, index) => (
                  <div key={item.year} className={`flex items-center mb-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`flex-1 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                      <Card className="shadow-boxing">
                        <CardContent className="p-6">
                          <h3 className="font-oswald font-bold text-2xl text-boxing-red mb-2">{item.year}</h3>
                          <p className="font-inter text-foreground">{item.event}</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Timeline dot */}
                    <div className="w-6 h-6 bg-boxing-red rounded-full border-4 border-background relative z-10"></div>
                    
                    <div className="flex-1"></div>
                  </div>
                ))}
              </div>
            </div>
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
                    <p className="font-inter text-boxing-red font-semibold mb-4">{miembro.especialidad}</p>
                    
                    <ul className="space-y-2">
                      {miembro.credenciales.map((credencial, credIndex) => (
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