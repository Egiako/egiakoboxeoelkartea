import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const PoliticaPrivacidad = () => {
  return (
    <>
      <Navigation />
      
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-oswald font-bold text-4xl text-center mb-12">
              Política de Privacidad
            </h1>

            <Card className="shadow-boxing">
              <CardContent className="p-8 space-y-8 font-inter">
                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    1. Información que recopilamos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    En EgiaK.O. Boxeo elkartea recopilamos la información que nos proporciona voluntariamente cuando se registra en nuestro servicio, incluyendo nombre, apellidos, email, teléfono y objetivos de entrenamiento. Esta información nos permite proporcionarle un servicio personalizado y mantenerle informado sobre nuestras clases y actividades.
                  </p>
                </section>

                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    2. Cómo utilizamos su información
                  </h2>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Gestionar su membresía y acceso a las clases</li>
                    <li>• Comunicar cambios en horarios y servicios</li>
                    <li>• Proporcionar asesoramiento personalizado de entrenamiento</li>
                    <li>• Mejorar nuestros servicios basándose en sus preferencias</li>
                    <li>• Cumplir con obligaciones legales y de seguridad</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    3. Protección de datos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción. Sus datos se almacenan en servidores seguros y solo el personal autorizado tiene acceso a ellos.
                  </p>
                </section>

                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    4. Sus derechos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Tiene derecho a acceder, rectificar, suprimir o solicitar la portabilidad de sus datos personales. 
                    También puede oponerse al tratamiento u solicitar su limitación. Para ejercer estos derechos, 
                    contacte con nosotros en egiako@gmail.com.
                  </p>
                </section>

                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    5. Contacto
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Para cualquier consulta sobre esta política de privacidad, puede contactarnos en:
                  </p>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p><strong>Email:</strong> egiako@gmail.com</p>
                    <p><strong>Teléfono:</strong> 669 339 812</p>
                    <p><strong>Dirección:</strong> Pje. Ur Zaleak de, 2, 20012 Donostia-San Sebastián</p>
                  </div>
                </section>

                <section className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Última actualización: Enero 2025
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default PoliticaPrivacidad;