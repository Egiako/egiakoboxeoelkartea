import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Lock, User, Phone, Target, CheckCircle, Clock, Calendar, FileText, ExternalLink } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const Registrate = () => {
  const { user, signUp, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    console.log('Registrate page: user state changed:', user?.email);
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('nombre') as string;
    const lastName = formData.get('apellidos') as string;
    const phone = formData.get('telefono') as string;
    const dni = formData.get('dni') as string;
    const birthDate = formData.get('birth_date') as string;
    const objective = formData.get('objetivo') as string;

    console.log('Registering user:', email);

    const { error, data } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
      phone
    });

    console.log('Registration result:', { error, data });

    if (!error && data?.user) {
      // Wait a bit for the trigger to create the profile, then update it with consent data
      setTimeout(async () => {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            dni,
            birth_date: birthDate,
            objective,
            consent_signed: true,
            consent_signed_at: new Date().toISOString()
          })
          .eq('user_id', data.user.id);

        if (updateError) {
          console.error('Error updating profile with consent:', updateError);
        } else {
          console.log('Profile updated with consent and objective data');
        }
      }, 1000);

      setRegistrationSuccess(true);
      console.log('Registration successful, showing approval message...');
    }

    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('loginEmail') as string;
    const password = formData.get('loginPassword') as string;

    console.log('Logging in user:', email);

    const { error } = await signIn(email, password);
    
    console.log('Login result:', { error });

    if (!error) {
      // Don't navigate immediately, let AuthRedirect handle it
      console.log('Login successful, waiting for auth state update...');
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <Navigation />
      
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            {/* Registration Success Message */}
            {registrationSuccess ? (
              <>
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h1 className="font-oswald font-bold text-4xl mb-4 text-green-600">
                    ¡Solicitud Enviada!
                  </h1>
                  <p className="font-inter text-muted-foreground">
                    Tu registro ha sido enviado correctamente
                  </p>
                </div>

                <Card className="shadow-boxing mb-8">
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-2 text-yellow-600 mb-4">
                        <Clock className="h-6 w-6" />
                        <span className="font-semibold text-lg">Pendiente de Aprobación</span>
                      </div>
                      
                       <Alert className="border-yellow-200 bg-yellow-50">
                         <AlertDescription className="text-center">
                           <strong>Tu solicitud ha sido enviada y está pendiente de aprobación.</strong>
                           <br />
                           Te avisaremos cuando se active tu cuenta.
                         </AlertDescription>
                       </Alert>

                      <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                        <p className="font-medium">¿Qué pasa ahora?</p>
                        <ul className="text-left space-y-1 text-muted-foreground">
                          <li>✅ Hemos recibido tu solicitud de registro</li>
                          <li>⏳ Nuestro equipo la revisará en 1-2 días hábiles</li>
                          <li>📧 Te enviaremos un email con la decisión</li>
                          <li>🥊 Una vez aprobado, podrás reservar clases</li>
                        </ul>
                      </div>

                      <div className="pt-4">
                        <Button onClick={() => navigate('/')} className="w-full">
                          Volver al Inicio
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-oswald font-bold text-lg mb-2">¿Necesitas ayuda?</h3>
                    <p className="font-inter text-sm text-muted-foreground mb-3">
                      Si tienes preguntas sobre tu solicitud, no dudes en contactarnos:
                    </p>
                    <div className="text-sm space-y-1">
                      <p>📧 egiakobe@gmail.com</p>
                      <p>📞 669 339 812</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Normal Registration/Login Form */}
            <div className="text-center mb-8">
              <h1 className="font-oswald font-bold text-4xl mb-4">
                Únete a <span className="text-boxing-black">Egia</span><span className="text-boxing-red">K.O.</span><span className="text-boxing-black"> Boxeo Elkartea</span>
              </h1>
              <p className="font-inter text-muted-foreground">
                Crea tu cuenta para acceder al horario de eventos y comenzar tu transformación
              </p>
            </div>

            <Card className="shadow-boxing">
              <CardContent className="p-6">
                <Tabs defaultValue="register" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="register" className="font-oswald">Crear cuenta</TabsTrigger>
                    <TabsTrigger value="login" className="font-oswald">Iniciar sesión</TabsTrigger>
                  </TabsList>

                  {/* Registro */}
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nombre" className="font-inter font-semibold">Nombre *</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                           <Input 
                             id="nombre"
                             name="nombre"
                             type="text"
                             placeholder="Tu nombre"
                             className="pl-10"
                             required
                           />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="apellidos" className="font-inter font-semibold">Apellidos *</Label>
                           <Input 
                             id="apellidos"
                             name="apellidos"
                             type="text"
                             placeholder="Tus apellidos"
                             required
                           />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email" className="font-inter font-semibold">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                           <Input 
                             id="email"
                             name="email"
                             type="email"
                             placeholder="tu@email.com"
                             className="pl-10"
                             required
                           />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="telefono" className="font-inter font-semibold">Teléfono *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                           <Input 
                             id="telefono"
                             name="telefono"
                             type="tel"
                             placeholder="000 000 000"
                             className="pl-10"
                             required
                           />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="dni" className="font-inter font-semibold">DNI / Documento de identidad *</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                           <Input 
                             id="dni"
                             name="dni"
                             type="text"
                             placeholder="12345678A"
                             className="pl-10"
                             required
                           />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="birth_date" className="font-inter font-semibold">Fecha de nacimiento *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                           <Input 
                             id="birth_date"
                             name="birth_date"
                             type="date"
                             className="pl-10"
                             required
                             max={new Date().toISOString().split('T')[0]}
                           />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="password" className="font-inter font-semibold">Contraseña *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                           <Input 
                             id="password"
                             name="password"
                             type="password"
                             placeholder="Mínimo 8 caracteres"
                             className="pl-10"
                             required
                             minLength={8}
                           />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="objetivo" className="font-inter font-semibold">Objetivo (opcional)</Label>
                        <div className="relative">
                          <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                           <Select name="objetivo">
                             <SelectTrigger className="pl-10">
                               <SelectValue placeholder="¿Qué te gustaría conseguir?" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="forma">Ponerme en forma</SelectItem>
                               <SelectItem value="competir">Competir</SelectItem>
                               <SelectItem value="tecnica">Aprender técnica</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                      </div>

                      {/* Consentimiento informado */}
                      <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-3">
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 text-boxing-red mt-0.5 flex-shrink-0" />
                          <div className="space-y-2 flex-1">
                            <h4 className="font-semibold font-oswald text-sm">Consentimiento Informado</h4>
                            <p className="text-xs text-muted-foreground font-inter leading-relaxed">
                              Al participar en actividades de boxeo, reconozco los riesgos inherentes a este deporte de contacto. 
                              Me comprometo a seguir las normas de seguridad y las instrucciones de los entrenadores en todo momento.
                            </p>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full font-inter text-xs mt-2"
                                >
                                  <ExternalLink className="h-3 w-3 mr-2" />
                                  Ver documento completo (PDF)
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh]">
                                <DialogHeader>
                                  <DialogTitle className="font-oswald">Consentimiento Informado - EgiaK.O. Boxeo</DialogTitle>
                                  <DialogDescription className="font-inter">
                                    Lee detenidamente el documento completo antes de aceptar
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="overflow-auto max-h-[70vh] border rounded-lg">
                                  <object 
                                    data="/documents/consentimiento-informado.pdf#toolbar=0" 
                                    type="application/pdf" 
                                    className="w-full h-[70vh]"
                                  >
                                    <p className="p-4 text-sm text-muted-foreground">
                                      No se pudo visualizar el PDF en tu navegador. 
                                      <a href="/documents/consentimiento-informado.pdf" download className="underline">Descargar PDF</a> o 
                                      <a href="/documents/consentimiento-informado.pdf" target="_blank" rel="noopener noreferrer" className="underline ml-1">abrir en nueva pestaña</a>.
                                    </p>
                                  </object>
                                </div>
                                <div className="flex justify-center gap-2 pt-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.open('/documents/consentimiento-informado.pdf', '_blank')}
                                    className="font-inter text-sm"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Abrir en nueva pestaña
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <div className="flex items-start space-x-2 mt-3">
                              <Checkbox id="consent" required />
                              <Label htmlFor="consent" className="text-xs font-inter leading-relaxed cursor-pointer">
                                He leído y acepto el consentimiento informado para la práctica de boxeo *
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox id="privacy" required />
                        <Label htmlFor="privacy" className="text-sm font-inter">
                          Acepto la{' '}
                          <a href="/politica-privacidad" className="text-boxing-red hover:underline">
                            Política de privacidad
                          </a>{' '}
                          *
                        </Label>
                      </div>

                      <Button 
                        type="submit" 
                        variant="hero" 
                        className="w-full font-oswald font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Login */}
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-6">
                      <div>
                        <Label htmlFor="loginEmail" className="font-inter font-semibold">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                           <Input 
                             id="loginEmail"
                             name="loginEmail"
                             type="email"
                             placeholder="tu@email.com"
                             className="pl-10"
                             required
                           />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="loginPassword" className="font-inter font-semibold">Contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                           <Input 
                             id="loginPassword"
                             name="loginPassword"
                             type="password"
                             placeholder="Tu contraseña"
                             className="pl-10"
                             required
                           />
                        </div>
                      </div>

                      <div className="text-center">
                        <a href="#" className="text-sm text-boxing-red hover:underline font-inter">
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>

                      <Button 
                        type="submit" 
                        variant="hero" 
                        className="w-full font-oswald font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card className="mt-8 bg-boxing-grey/30">
              <CardContent className="p-6 text-center">
                <h3 className="font-oswald font-bold text-lg mb-2">¡Bienvenido/a a la familia!</h3>
                <p className="font-inter text-sm text-muted-foreground">
                  Una vez registrado y aprobado, tendrás acceso al horario completo de eventos 
                  y podrás empezar tu entrenamiento.
                </p>
              </CardContent>
            </Card>
            </>
          )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Registrate;