import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ActiveUserGuardProps {
  children: ReactNode;
}

const ActiveUserGuard = ({ children }: ActiveUserGuardProps) => {
  const { user, isActive, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verificando acceso...</div>
      </div>
    );
  }

  if (user && isActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu cuenta ha sido desactivada. Contacta con el administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default ActiveUserGuard;