import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TrainerCalendarManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gestión de Horarios y Profesores
        </CardTitle>
        <CardDescription>
          Gestiona la asignación de profesores y horarios especiales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Funcionalidad en desarrollo:</strong>
            <br />
            Esta sección incluirá las siguientes herramientas:
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Asignación de profesores por día y clase</li>
              <li>Habilitación/deshabilitación de días especiales</li>
              <li>Modificación de horarios puntuales</li>
              <li>Gestión de días extraordinarios (sábados especiales, etc.)</li>
              <li>Vista de calendario con estado de cada clase</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="mt-6 p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
          <p className="text-muted-foreground">
            Las herramientas de gestión de horarios y profesores estarán disponibles pronto.
            <br />
            Esta funcionalidad también estará disponible para el Administrador.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};