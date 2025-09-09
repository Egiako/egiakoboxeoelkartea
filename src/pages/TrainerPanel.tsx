import { useState, useEffect } from 'react';
import { useTrainerRole } from '@/hooks/useTrainerRole';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, Calendar, ClipboardList } from 'lucide-react';
import { TrainerActiveUsers } from '@/components/TrainerActiveUsers';
import { TrainerBookingManagement } from '@/components/TrainerBookingManagement';
import TrainerScheduleManagement from '@/components/TrainerScheduleManagement';

const TrainerPanel = () => {
  const { isTrainer, loading } = useTrainerRole();
  const [classes, setClasses] = useState([]);

  // Fetch classes for schedule management
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('is_active', true)
          .order('day_of_week', { ascending: true });

        if (error) throw error;
        setClasses(data || []);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    if (isTrainer) {
      fetchClasses();
    }
  }, [isTrainer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-muted-foreground">
              Verificando permisos...
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isTrainer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Alert variant="destructive" className="max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No tienes permisos para acceder al panel de entrenador.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Panel de Entrenador
            </h1>
            <p className="text-muted-foreground">
              Gestiona usuarios, asistencia y horarios de clases
            </p>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios Activos
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Gestión de Asistencia
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Gestión de Horarios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <TrainerActiveUsers />
            </TabsContent>

            <TabsContent value="bookings">
              <TrainerBookingManagement />
            </TabsContent>

            <TabsContent value="calendar">
              <TrainerScheduleManagement classes={classes} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TrainerPanel;