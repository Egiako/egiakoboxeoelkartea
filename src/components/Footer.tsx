import { memo } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Footer = memo(() => {
  return (
    <footer className="bg-boxing-black text-boxing-white" role="contentinfo">
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
                <Phone className="h-4 w-4 text-boxing-red mr-2 flex-shrink-0" aria-hidden="true" />
                <a href="tel:+34669339812" className="font-inter hover:text-boxing-red transition-colors">
                  669 339 812
                </a>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 text-boxing-red mr-2 flex-shrink-0" aria-hidden="true" />
                <a href="mailto:egiakobe@gmail.com" className="font-inter hover:text-boxing-red transition-colors">
                  egiakobe@gmail.com
                </a>
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
                </div>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <h4 className="font-oswald font-semibold text-lg mb-4">Ubicación</h4>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!4v1760036963634!6m8!1m7!1sre7GfAfpgp-Zwbm3SfSREg!2m2!1d43.3164278967476!2d-1.971383167159462!3f320.4956414575747!4f-28.554973194118922!5f0.7820865974627469" 
              width="100%" 
              height="350" 
              style={{ border: 0, borderRadius: '12px' }} 
              allowFullScreen={true}
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Egia K.O. Boxeo Elkartea"
            />
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-boxing-red/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm font-inter text-boxing-grey">
            <p>&copy; 2025 <span className="text-boxing-white">Egia</span><span className="text-boxing-red">K.O.</span><span className="text-boxing-white"> Boxeo Elkartea</span>. Todos los derechos reservados.</p>
            <nav className="flex space-x-6 mt-4 md:mt-0" aria-label="Enlaces legales">
              <a 
                href="/politica-privacidad" 
                className="hover:text-boxing-red transition-colors focus:outline-none focus:ring-2 focus:ring-boxing-red focus:ring-offset-2 focus:ring-offset-boxing-black rounded"
              >
                Política de privacidad
              </a>
              <a 
                href="/aviso-legal" 
                className="hover:text-boxing-red transition-colors focus:outline-none focus:ring-2 focus:ring-boxing-red focus:ring-offset-2 focus:ring-offset-boxing-black rounded"
              >
                Aviso legal
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;