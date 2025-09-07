import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Lock, User, Phone, Target } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

const Registrate = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulación de registro - En producción necesitará Supabase
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "¡Registro completado!",
        description: "Para activar la funcionalidad completa de autenticación, conecta tu proyecto con Supabase.",
      });
    }, 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulación de login - En producción necesitará Supabase
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Funcionalidad de autenticación",
        description: "Para habilitar login/logout, conecta tu proyecto con Supabase.",
      });
    }, 1500);
  };

  return (
    <>
      <Navigation />
      
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-oswald font-bold text-4xl mb-4">
                Únete a <span className="text-boxing-red">EgiaK.O.</span>
              </h1>
              <p className="font-inter text-muted-foreground">
                Crea tu cuenta para acceder al horario de clases y comenzar tu transformación
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
                            type="tel"
                            placeholder="000 000 000"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="password" className="font-inter font-semibold">Contraseña *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="password"
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
                          <Select>
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
                  Una vez registrado, tendrás acceso al horario completo de clases 
                  y podrás empezar tu entrenamiento inmediatamente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Registrate;