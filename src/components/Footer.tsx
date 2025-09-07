import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-boxing-black text-boxing-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Información del gimnasio */}
          <div>
            <h3 className="font-oswald font-bold text-xl text-boxing-red mb-4">
              EgiaK.O. Boxeo elkartea
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
                <span className="font-inter">Calle Ejemplo 123, Donostia</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 text-boxing-red mr-2 flex-shrink-0" />
                <span className="font-inter">000 000 000</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 text-boxing-red mr-2 flex-shrink-0" />
                <span className="font-inter">egiaK.O.@gmail.com</span>
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

          {/* Mapa embebido placeholder */}
          <div>
            <h4 className="font-oswald font-semibold text-lg mb-4">Ubicación</h4>
            <div className="bg-boxing-grey/20 h-32 rounded-lg flex items-center justify-center text-sm text-boxing-grey">
              <MapPin className="h-6 w-6 text-boxing-red" />
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-boxing-red/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm font-inter text-boxing-grey">
            <p>&copy; 2025 EgiaK.O. Boxeo elkartea. Todos los derechos reservados.</p>
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