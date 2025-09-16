import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/new-hero-boxing.jpg';
const Hero = () => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${heroImage})`
    }}>
        <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-oswald font-bold text-5xl md:text-7xl lg:text-8xl text-boxing-white mb-6 leading-tight">
            Boxeo real.
            <span className="block text-boxing-red">Resultados reales.</span>
          </h1>
          
          <p className="font-inter text-xl md:text-2xl text-boxing-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
            Entrena técnica, fuerza y disciplina en Donostia. 
            
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button asChild variant="hero" size="lg" className="font-oswald font-semibold text-lg px-8 py-4 min-w-[200px]">
              <Link to="/registrate">Prueba una clase</Link>
            </Button>
            
            <Button asChild variant="outline-hero" size="lg" className="font-oswald font-semibold text-lg px-8 py-4 min-w-[200px]">
              <Link to="/precios">Ver precios</Link>
            </Button>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-boxing-white/60">
          <div className="animate-bounce">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;