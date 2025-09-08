import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      console.log('AuthRedirect: loading done, user:', user?.email, 'current path:', location.pathname);
      
      // If user is authenticated and on register page, redirect to schedules
      if (user && location.pathname === '/registrate') {
        console.log('Redirecting authenticated user to /horarios');
        navigate('/horarios', { replace: true });
      }
      
      // Horarios es público: no redirigir a usuarios no autenticados
    }
  }, [user, loading, navigate, location.pathname]);

  return null;
};

export default AuthRedirect;