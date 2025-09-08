import { ReactNode } from 'react';
import { useApprovalStatus } from '@/hooks/useApprovalStatus';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, XCircle, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApprovalGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ApprovalGuard = ({ children, fallback }: ApprovalGuardProps) => {
  const { user } = useAuth();
  const { approvalStatus, loading } = useApprovalStatus();

  // If not authenticated, let the auth system handle it
  if (!user) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Verificando estado de la cuenta...
        </div>
      </div>
    );
  }

  // If approved, show the protected content
  if (approvalStatus === 'approved') {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default approval status screens
  if (approvalStatus === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl font-oswald">
              Solicitud Pendiente de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Tu solicitud de registro está siendo revisada por nuestro equipo. 
              Te notificaremos por email cuando tu cuenta sea activada.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Mientras tanto:</p>
              <ul className="text-left space-y-1 text-muted-foreground">
                <li>• Revisa tu email regularmente</li>
                <li>• El proceso suele tomar 1-2 días hábiles</li>
                <li>• Te avisaremos cuando esté lista</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button asChild variant="outline">
                <Link to="/">Volver al Inicio</Link>
              </Button>
              
              <div className="text-xs text-muted-foreground">
                <p>¿Necesitas ayuda? Contáctanos:</p>
                <div className="flex items-center justify-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>info@egiako.com</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>943 XXX XXX</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (approvalStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-oswald text-red-600">
              Solicitud No Aprobada
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Lamentablemente, tu solicitud de registro no ha sido aprobada en este momento.
              Esto puede deberse a que hemos alcanzado nuestra capacidad máxima.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">¿Qué puedes hacer?</p>
              <ul className="text-left space-y-1 text-muted-foreground">
                <li>• Contactarnos para más información</li>
                <li>• Intentar registrarte nuevamente más adelante</li>
                <li>• Consultar sobre lista de espera</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button asChild variant="outline">
                <Link to="/">Volver al Inicio</Link>
              </Button>
              
              <div className="text-xs text-muted-foreground">
                <p>Para más información, contáctanos:</p>
                <div className="flex items-center justify-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>info@egiako.com</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>943 XXX XXX</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default fallback if status is unknown
  return <>{children}</>;
};

export default ApprovalGuard;