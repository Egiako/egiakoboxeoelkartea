import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isActive: boolean | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const { toast } = useToast();

  const checkUserActive = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error checking user active status:', error);
        setIsActive(false);
        return false;
      }
      
      setIsActive(data?.is_active ?? false);
      return data?.is_active ?? false;
    } catch (error) {
      console.error('Error checking user active status:', error);
      setIsActive(false);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if user is active
          const active = await checkUserActive(session.user.id);
          if (!active) {
            // Sign out inactive user immediately
            await supabase.auth.signOut();
            toast({
              title: "Cuenta desactivada",
              description: "Tu cuenta ha sido desactivada. Contacta con el administrador.",
              variant: "destructive"
            });
          }
        } else {
          setIsActive(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const active = await checkUserActive(session.user.id);
        if (!active) {
          await supabase.auth.signOut();
          toast({
            title: "Cuenta desactivada", 
            description: "Tu cuenta ha sido desactivada. Contacta con el administrador.",
            variant: "destructive"
          });
        }
      } else {
        setIsActive(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signUp = async (email: string, password: string, metadata?: any) => {
    console.log('Attempting sign up for:', email);
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });

    console.log('Sign up result:', { data, error });

    if (error) {
      toast({
        title: "Error en el registro",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "¡Registro exitoso!",
        description: "Revisa tu email para confirmar tu cuenta."
      });
    }

    return { error, data };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('Sign in result:', { data, error });

    if (error) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "¡Bienvenido/a de vuelta!",
        description: "Has iniciado sesión correctamente."
      });
    }

    return { error, data };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Error al cerrar sesión",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Clear local state immediately
        setUser(null);
        setSession(null);
        setIsActive(null);
        
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión correctamente."
        });
        
        // Navigate to home page after successful logout
        window.location.href = '/';
      }
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      signUp,
      signIn,
      signOut,
      loading,
      isActive
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};