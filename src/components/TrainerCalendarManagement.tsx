import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Plus, Ban, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

export const TrainerCalendarManagement = () => {
  const { classes, scheduleOverrides, loading, addSpecialClass, disableClass } = useScheduleManagement();
  
  const [selectedAction, setSelectedAction] = useState<'add' | 'disable' | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [instructorName, setInstructorName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = async () => {
    if (!selectedClass || !selectedDate) return;

    const date = new Date(selectedDate);
    
    if (selectedAction === 'add') {
      await addSpecialClass(selectedClass, date, instructorName || undefined, notes || undefined);
    } else if (selectedAction === 'disable') {
      await disableClass(selectedClass, date, notes || undefined);
    }

    // Reset form
    setSelectedAction(null);
    setSelectedClass('');
    setSelectedDate('');
    setInstructorName('');
    setNotes('');
  };

  const getClassName = (classId: string) => {
    const classData = classes.find(c => c.id === classId);
    return classData ? classData.title : 'Clase desconocida';
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestión de Horarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gestión de Horarios
        </CardTitle>
        <CardDescription>
          Agregar clases especiales o deshabilitar clases existentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setSelectedAction('add')}
            variant={selectedAction === 'add' ? 'default' : 'outline'}
            className="flex items-center gap-2 h-auto p-4"
          >
            <Plus className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Agregar Clase Especial</div>
              <div className="text-sm opacity-75">Habilitar clase en fecha específica</div>
            </div>
          </Button>
          
          <Button
            onClick={() => setSelectedAction('disable')}
            variant={selectedAction === 'disable' ? 'destructive' : 'outline'}
            className="flex items-center gap-2 h-auto p-4"
          >
            <Ban className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Deshabilitar Clase</div>
              <div className="text-sm opacity-75">Cancelar clase en fecha específica</div>
            </div>
          </Button>
        </div>

        {selectedAction && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Seleccionar Clase</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige una clase..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          <div className="flex flex-col">
                            <span>{classItem.title}</span>
                            <span className="text-sm text-muted-foreground">
                              {daysOfWeek.find(d => d.value === classItem.day_of_week)?.label} - 
                              {formatTime(classItem.start_time)} a {formatTime(classItem.end_time)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {selectedAction === 'add' && (
                <div className="space-y-2">
                  <Label>Instructor (Opcional)</Label>
                  <Input
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="Nombre del instructor para esta clase especial"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Notas (Opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={selectedAction === 'add' 
                    ? "Información adicional sobre la clase especial..."
                    : "Motivo de la cancelación..."
                  }
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={!selectedClass || !selectedDate}
                className="w-full"
                variant={selectedAction === 'disable' ? 'destructive' : 'default'}
              >
                {selectedAction === 'add' ? 'Agregar Clase Especial' : 'Deshabilitar Clase'}
              </Button>
            </div>
          </>
        )}

        {/* Recent Schedule Changes */}
        {scheduleOverrides.length > 0 && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <h3 className="font-semibold">Modificaciones Recientes</h3>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {scheduleOverrides.slice(-10).reverse().map((override) => (
                  <div key={override.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{getClassName(override.class_id)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(override.override_date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      {override.instructor_override && (
                        <div className="text-sm text-muted-foreground">
                          Instructor: {override.instructor_override}
                        </div>
                      )}
                      {override.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {override.notes}
                        </div>
                      )}
                    </div>
                    
                    <Badge variant={override.is_enabled ? 'default' : 'destructive'}>
                      {override.is_enabled ? 'Habilitada' : 'Deshabilitada'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};