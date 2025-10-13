import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any; data?: any }>;
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
        .maybeSingle();
      
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
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls to prevent deadlocks
          setTimeout(() => {
            checkUserActive(session.user!.id).then((active) => {
              if (!active) {
                supabase.auth.signOut();
                toast({
                  title: "Cuenta desactivada",
                  description: "Tu cuenta ha sido desactivada. Contacta con el administrador.",
                  variant: "destructive"
                });
              }
              setLoading(false);
            });
          }, 0);
        } else {
          setIsActive(null);
          setLoading(false);
        }
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
    
    // Handle network errors with retry
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        console.log('Sign in result:', { data, error });

        if (error) {
          // Handle specific error types
          if (error.message === "Load failed" || error.name === "AuthRetryableFetchError") {
            attempt++;
            if (attempt < maxAttempts) {
              console.log(`Retry attempt ${attempt}/${maxAttempts}`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
              continue;
            } else {
              toast({
                title: "Error de conexión",
                description: "No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.",
                variant: "destructive"
              });
            }
          } else {
            toast({
              title: "Error al iniciar sesión",
              description: error.message,
              variant: "destructive"
            });
          }
          
          return { error, data };
        } else {
          toast({
            title: "¡Bienvenido/a de vuelta!",
            description: "Has iniciado sesión correctamente."
          });
          
          return { error, data };
        }
      } catch (networkError: any) {
        attempt++;
        if (attempt >= maxAttempts) {
          toast({
            title: "Error de conexión",
            description: "No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.",
            variant: "destructive"
          });
          return { error: networkError, data: null };
        }
        console.log(`Network error, retry attempt ${attempt}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    // This should never be reached, but TypeScript needs it
    return { error: new Error("Maximum retry attempts exceeded"), data: null };
  };

  const signOut = async () => {
    try {
      // Check if there's a session first (production can lose session tokens between domains)
      const { data: sessionData } = await supabase.auth.getSession();

      // If no session, perform a local sign out and redirect gracefully
      if (!sessionData.session) {
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        setSession(null);
        setIsActive(null);
        toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
        window.location.href = '/';
        return;
      }

      // Try global sign out; if session missing error, fall back to local
      const { error } = await supabase.auth.signOut();
      if (error && /auth session missing/i.test(error.message)) {
        await supabase.auth.signOut({ scope: 'local' });
      }

      // Clear local state and redirect
      setUser(null);
      setSession(null);
      setIsActive(null);
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
      window.location.href = '/';
    } catch (error: any) {
      // Last resort: local sign out and redirect
      try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
      setUser(null);
      setSession(null);
      setIsActive(null);
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
      window.location.href = '/';
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