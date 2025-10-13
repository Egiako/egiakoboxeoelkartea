import { useTrainerRole } from '@/hooks/useTrainerRole';
import { useTrainerLanguage } from '@/hooks/useTrainerLanguage';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, ClipboardList, Calendar } from 'lucide-react';

import TrainerBookingManagement from '@/components/TrainerBookingManagement';
import { UnifiedScheduleManagement } from '@/components/UnifiedScheduleManagement';

const TrainerPanel = () => {
  const { isTrainer, loading } = useTrainerRole();
  const { t } = useTrainerLanguage();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-muted-foreground">
              {t.trainerPanel.verifyingPermissions}
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
                {t.trainerPanel.noPermission}
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
              {t.trainerPanel.title}
            </h1>
            <p className="text-muted-foreground">
              {t.trainerPanel.subtitle}
            </p>
          </div>

          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                {t.trainerPanel.bookingsTab}
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t.trainerPanel.calendarTab}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <TrainerBookingManagement />
            </TabsContent>

            <TabsContent value="calendar">
              <UnifiedScheduleManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TrainerPanel;