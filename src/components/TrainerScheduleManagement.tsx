import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, User, Settings } from 'lucide-react';
import { useTrainerScheduleManagement } from '@/hooks/useTrainerScheduleManagement';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TrainerScheduleManagementProps {
  classes: Array<{
    id: string;
    title: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    instructor: string | null;
  }>;
}

const TrainerScheduleManagement = ({ classes }: TrainerScheduleManagementProps) => {
  const {
    setClassInstructor,
    setScheduleOverride,
    fetchScheduleForDate,
    scheduleForDate,
    loading
  } = useTrainerScheduleManagement();

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [instructorName, setInstructorName] = useState<string>('');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [overrideDate, setOverrideDate] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [instructorOverride, setInstructorOverride] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dayNames = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  const handleSetInstructor = async () => {
    if (!selectedClass || !instructorName) return;

    try {
      await setClassInstructor(
        selectedClass,
        instructorName,
        specificDate ? new Date(specificDate) : undefined
      );
      
      // Reset form
      setSelectedClass('');
      setInstructorName('');
      setSpecificDate('');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleSetOverride = async () => {
    if (!selectedClass || !overrideDate) return;

    try {
      await setScheduleOverride(
        selectedClass,
        new Date(overrideDate),
        isEnabled,
        instructorOverride || undefined,
        notes || undefined
      );
      
      // Reset form
      setSelectedClass('');
      setOverrideDate('');
      setIsEnabled(false);
      setInstructorOverride('');
      setNotes('');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleViewSchedule = async () => {
    await fetchScheduleForDate(selectedDate);
  };

  return (
    <div className="space-y-6">
      {/* Instructor Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Gestión de Profesores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class-select">Clase</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar clase" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.title} - {dayNames[cls.day_of_week]} {cls.start_time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor-name">Nombre del Instructor</Label>
              <Input
                id="instructor-name"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Nombre del instructor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specific-date">Fecha Específica (opcional)</Label>
              <Input
                id="specific-date"
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Dejar vacío para asignar como instructor por defecto
              </p>
            </div>
          </div>

          <Button onClick={handleSetInstructor} disabled={!selectedClass || !instructorName}>
            Asignar Instructor
          </Button>
        </CardContent>
      </Card>

      {/* Schedule Overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Modificación de Horarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="override-class">Clase</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar clase" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.title} - {dayNames[cls.day_of_week]} {cls.start_time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="override-date">Fecha</Label>
              <Input
                id="override-date"
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-enabled"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
                <Label htmlFor="is-enabled">
                  {isEnabled ? 'Habilitar día especial' : 'Deshabilitar clase'}
                </Label>
              </div>
            </div>

            {isEnabled && (
              <div className="space-y-2">
                <Label htmlFor="instructor-override">Instructor para este día (opcional)</Label>
                <Input
                  id="instructor-override"
                  value={instructorOverride}
                  onChange={(e) => setInstructorOverride(e.target.value)}
                  placeholder="Instructor específico"
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre este cambio"
                rows={3}
              />
            </div>
          </div>

          <Button onClick={handleSetOverride} disabled={!selectedClass || !overrideDate}>
            {isEnabled ? 'Habilitar Día Especial' : 'Deshabilitar Clase'}
          </Button>
        </CardContent>
      </Card>

      {/* Schedule View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Vista de Horarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="view-date">Fecha a consultar</Label>
              <Input
                id="view-date"
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>
            <Button onClick={handleViewSchedule} className="mt-6">
              <Clock className="h-4 w-4 mr-2" />
              Ver Horarios
            </Button>
          </div>

          {scheduleForDate.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">
                Horarios para {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
              </h4>
              <div className="grid gap-2">
                {scheduleForDate.map((schedule) => (
                  <div
                    key={`${schedule.class_id}-${selectedDate}`}
                    className={`p-3 rounded-lg border ${
                      schedule.is_active
                        ? schedule.is_special_day
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{schedule.title}</h5>
                        <p className="text-sm text-muted-foreground">
                          {schedule.start_time} - {schedule.end_time}
                        </p>
                        <p className="text-sm">
                          Instructor: <span className="font-medium">{schedule.instructor}</span>
                        </p>
                        {schedule.override_notes && (
                          <p className="text-sm text-blue-600 mt-1">
                            Nota: {schedule.override_notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            schedule.is_active
                              ? schedule.is_special_day
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {schedule.is_active
                            ? schedule.is_special_day
                              ? 'Día Especial'
                              : 'Activo'
                            : 'Deshabilitado'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerScheduleManagement;