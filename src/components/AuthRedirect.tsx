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
      
      // If user is not authenticated and trying to access protected route, redirect to register
      if (!user && location.pathname === '/horarios') {
        console.log('Redirecting unauthenticated user to /registrate');
        navigate('/registrate', { replace: true });
      }
    }
  }, [user, loading, navigate, location.pathname]);

  return null;
};

export default AuthRedirect;