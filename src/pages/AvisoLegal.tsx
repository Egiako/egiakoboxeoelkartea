import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const AvisoLegal = () => {
  return (
    <>
      <Navigation />
      
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-oswald font-bold text-4xl text-center mb-12">
              Aviso Legal
            </h1>

            <Card className="shadow-boxing">
              <CardContent className="p-8 space-y-8 font-inter">
                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    1. Datos identificativos
                  </h2>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p><strong>Denominación:</strong> EgiaK.O. Boxeo Elkartea</p>
                    <p><strong>Dirección:</strong> Pje. Ur Zaleak de, 2, 20012 Donostia-San Sebastián</p>
                    <p><strong>Email:</strong> egiako@gmail.com</p>
                    <p><strong>Teléfono:</strong> 669 339 812</p>
                    <p><strong>Actividad:</strong> Asociación sin ánimo de lucro</p>
                  </div>
                </section>

                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    2. Objeto y ámbito de aplicación
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    El presente aviso legal regula el uso de la página web de EgiaK.O. Boxeo elkartea. 
                    El acceso y uso de este sitio web implica la aceptación plena de todas las condiciones establecidas en este aviso legal.
                  </p>
                </section>

                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    3. Servicios
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    A través de este sitio web ofrecemos información sobre nuestros servicios de entrenamiento de boxeo, 
                    incluyendo eventos grupales e individuales, horarios, precios y proceso de registro. 
                    La formalización de la inscripción se realiza presencialmente en nuestras instalaciones.
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

                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    6. Responsabilidad
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    EgiaK.O. Boxeo elkartea no se hace responsable de los daños y perjuicios que pudieran derivarse 
                    del uso inadecuado de este sitio web. Los precios mostrados son orientativos y pueden sufrir modificaciones. 
                    Los horarios de eventos pueden variar según disponibilidad y circunstancias especiales.
                  </p>
                </section>

                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    7. Propiedad intelectual
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Todos los contenidos de este sitio web, incluyendo textos, imágenes, marcas y diseños, 
                    son propiedad de EgiaK.O. Boxeo elkartea o se utilizan con la debida autorización. 
                    Queda prohibida su reproducción, distribución o modificación sin consentimiento expreso.
                  </p>
                </section>

                <section>
                  <h2 className="font-oswald font-bold text-2xl text-boxing-red mb-4">
                    8. Modificaciones
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    EgiaK.O. Boxeo elkartea se reserva el derecho de modificar el presente aviso legal 
                    en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en este sitio web.
                  </p>
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

export default AvisoLegal;