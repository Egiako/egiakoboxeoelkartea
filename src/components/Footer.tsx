import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import LocationMap from '@/components/LocationMap';

const Footer = () => {
  return (
    <footer className="bg-boxing-black text-boxing-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Información del gimnasio */}
          <div>
            <h3 className="font-oswald font-bold text-xl mb-4">
              <span className="text-boxing-white">Egia</span>
              <span className="text-boxing-red">K.O.</span>
              <span className="text-boxing-white"> Boxeo Elkartea</span>
            </h3>
            <p className="font-inter text-boxing-grey text-sm mb-4">
              Boxeo real. Resultados reales. Tu gimnasio de confianza en Donostia.
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-oswald font-semibold text-lg mb-4">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 text-boxing-red mr-2 flex-shrink-0" />
                <span className="font-inter">Pje. Ur Zaleak de, 2, 20012 Donostia-San Sebastián</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 text-boxing-red mr-2 flex-shrink-0" />
                <span className="font-inter">669339812</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 text-boxing-red mr-2 flex-shrink-0" />
                <span className="font-inter">egiakobe@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Horarios */}
          <div>
            <h4 className="font-oswald font-semibold text-lg mb-4">Horarios de Recepción</h4>
            <div className="space-y-2 text-sm font-inter">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-boxing-red mr-2 flex-shrink-0" />
                <div>
                  <div>L–V: 10:00–13:00</div>
                  <div className="ml-6">17:00–21:00</div>
                  <div>S: 10:00–13:00</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mapa con ubicación real */}
          <div>
            <LocationMap />
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-boxing-red/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm font-inter text-boxing-grey">
            <p>&copy; 2025 <span className="text-boxing-white">Egia</span><span className="text-boxing-red">K.O.</span><span className="text-boxing-white"> Boxeo Elkartea</span>. Todos los derechos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/politica-privacidad" className="hover:text-boxing-red transition-colors">
                Política de privacidad
              </a>
              <a href="/aviso-legal" className="hover:text-boxing-red transition-colors">
                Aviso legal
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;