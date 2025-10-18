import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Lock, User, Phone, Target, CheckCircle, Clock, Calendar, FileText } from 'lucide-react';
import SEO from '@/components/SEO';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { ConsentModal } from '@/components/ConsentModal';
import { useToast } from '@/hooks/use-toast';

const Registrate = () => {
  const { user, signUp, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureMethod, setSignatureMethod] = useState<'canvas' | 'typed'>('canvas');
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [trainingGoal, setTrainingGoal] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    console.log('Registrate page: user state changed:', user?.email);
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!signatureData) {
      toast({
        title: "Firma requerida",
        description: "Por favor, firma el consentimiento informado antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    if (!consentAccepted) {
      toast({
        title: "Debes aceptar el consentimiento",
        description: "Marca la casilla de aceptación del consentimiento informado.",
        variant: "destructive"
      });
      return;
    }

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
      phone,
      dni,
      birth_date: birthDate,
      training_goal: objective,
      consent_signed: true,
      consent_signed_at: new Date().toISOString(),
      consent_method: signatureMethod
    });

    console.log('Registration result:', { error, data });

    if (!error && data?.user) {
      // Show loading toast for signature upload
      toast({
        title: "Guardando firma...",
        description: "Subiendo tu firma digital de forma segura.",
      });

      try {
        // Try to get current session
        const { data: sessionResp } = await supabase.auth.getSession();
        let accessToken = sessionResp.session?.access_token ?? null;

        // Fallback: try to sign in to obtain a session if needed
        if (!accessToken) {
          const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
          accessToken = signInData.session?.access_token ?? null;
        }

        // Convert base64 signature to blob
        const base64Response = await fetch(signatureData);
        const blob = await base64Response.blob();
        
        // Prepare form data for edge function
        const signatureFormData = new FormData();
        signatureFormData.append('signature', blob, 'signature.png');
        signatureFormData.append('method', signatureMethod);
        signatureFormData.append('userAgent', navigator.userAgent);
        signatureFormData.append('textVersion', 'v1');
        signatureFormData.append('userId', data.user.id);

        // Call edge function to save signature (multipart/form-data)
        const headers: Record<string, string> = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const response = await fetch(
          `https://qdpvgbnkewxrervdoexg.supabase.co/functions/v1/save-consent`,
          {
            method: 'POST',
            headers,
            body: signatureFormData
          }
        );

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({} as any));
          const errorMsg = errJson?.error || 'No se pudo guardar la firma';
          console.error('Error saving signature:', errorMsg);
          throw new Error(errorMsg);
        }

        const result = await response.json();
        console.log('Signature saved successfully:', result);

        // Update profile with additional data (dni, birth_date, objective)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            dni,
            birth_date: birthDate,
            objective
          })
          .eq('user_id', data.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }

        toast({
          title: "¡Registro completado!",
          description: "Tu consentimiento y firma se han guardado correctamente.",
        });

      } catch (err: any) {
        console.error('Error in registration process:', err);
        toast({
          title: 'Error al guardar la firma',
          description: err?.message || 'Hubo un problema guardando tu firma. Por favor, contacta con el administrador.',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      setRegistrationSuccess(true);
      console.log('Registration successful, showing approval message...');
    } else if (error) {
      toast({
        title: 'Error en el registro',
        description: error.message || 'No se pudo completar el registro',
        variant: 'destructive'
      });
    }

    setIsLoading(false);
  };

  const handleConsentAccept = (signature: string, method: 'canvas' | 'typed') => {
    setSignatureData(signature);
    setSignatureMethod(method);
    setConsentAccepted(true);
    toast({
      title: "Consentimiento aceptado",
      description: "Tu firma ha sido capturada correctamente.",
    });
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
      <SEO 
        title="Regístrate"
        description="Únete a Egia K.O. Boxeo Elkartea. Regístrate ahora y prueba tu primera clase gratis."
        keywords="registro boxeo, inscripción gimnasio Donostia, apuntarse boxeo, unirse club boxeo"
      />
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
                            <Select 
                              name="objetivo"
                              value={trainingGoal}
                              onValueChange={setTrainingGoal}
                            >
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
                            <h4 className="font-semibold font-oswald text-sm">Consentimiento Informado *</h4>
                            <p className="text-xs text-muted-foreground font-inter leading-relaxed">
                              Es obligatorio leer y firmar el consentimiento informado para poder registrarte en el club.
                            </p>
                            
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setShowConsentDialog(true)}
                              className="w-full font-inter text-xs mt-2"
                            >
                              <FileText className="h-3 w-3 mr-2" />
                              Leer y firmar consentimiento
                            </Button>

                            {signatureData && consentAccepted && (
                              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                                <CheckCircle className="h-4 w-4" />
                                <span>Consentimiento firmado y aceptado</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <ConsentModal 
                        open={showConsentDialog}
                        onOpenChange={setShowConsentDialog}
                        onAccept={handleConsentAccept}
                      />

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