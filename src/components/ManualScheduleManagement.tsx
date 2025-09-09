import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, User, Settings, CalendarPlus, CalendarX, Trash2 } from 'lucide-react';
import { useManualScheduleManagement } from '@/hooks/useManualScheduleManagement';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ManualScheduleManagement = () => {
  const {
    schedules,
    loading,
    createSchedule,
    toggleSchedule,
    deleteSchedule
  } = useManualScheduleManagement();

  // Estados para crear clase
  const [title, setTitle] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxStudents, setMaxStudents] = useState(10);
  const [notes, setNotes] = useState('');

  // Estados para habilitar/deshabilitar clase
  const [toggleDate, setToggleDate] = useState<Date>();
  const [toggleStartTime, setToggleStartTime] = useState('');
  const [toggleEndTime, setToggleEndTime] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [toggleNotes, setToggleNotes] = useState('');

  const handleCreateSchedule = async () => {
    if (!title || !instructorName || !selectedDate || !startTime || !endTime) {
      return;
    }

    try {
      await createSchedule(
        title,
        instructorName,
        selectedDate,
        startTime,
        endTime,
        maxStudents,
        true,
        notes || undefined
      );
      
      // Reset form
      setTitle('');
      setInstructorName('');
      setSelectedDate(undefined);
      setStartTime('');
      setEndTime('');
      setMaxStudents(10);
      setNotes('');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleToggleSchedule = async () => {
    if (!toggleDate || !toggleStartTime || !toggleEndTime) {
      return;
    }

    try {
      await toggleSchedule(
        toggleDate,
        toggleStartTime,
        toggleEndTime,
        isEnabled,
        toggleNotes || undefined
      );
      
      // Reset form
      setToggleDate(undefined);
      setToggleStartTime('');
      setToggleEndTime('');
      setIsEnabled(true);
      setToggleNotes('');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Remove seconds if present
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">
          Cargando horarios...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Crear nueva clase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Programar Nueva Clase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la Clase</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Boxeo Avanzado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Nombre del Instructor</Label>
              <Input
                id="instructor"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Nombre del instructor"
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de la Clase</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-students">Máximo de Estudiantes</Label>
              <Input
                id="max-students"
                type="number"
                min="1"
                max="50"
                value={maxStudents}
                onChange={(e) => setMaxStudents(parseInt(e.target.value) || 10)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Hora de Inicio</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">Hora de Fin</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre esta clase"
                rows={3}
              />
            </div>
          </div>

          <Button 
            onClick={handleCreateSchedule} 
            disabled={!title || !instructorName || !selectedDate || !startTime || !endTime}
            className="w-full"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Programar Clase
          </Button>
        </CardContent>
      </Card>

      {/* Habilitar/Deshabilitar clase específica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Habilitar/Deshabilitar Clase Específica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de la Clase</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toggleDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {toggleDate ? (
                      format(toggleDate, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={toggleDate}
                    onSelect={setToggleDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-enabled-toggle"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
                <Label htmlFor="is-enabled-toggle">
                  {isEnabled ? 'Habilitar clase extraordinaria' : 'Deshabilitar clase existente'}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toggle-start-time">Hora de Inicio</Label>
              <Input
                id="toggle-start-time"
                type="time"
                value={toggleStartTime}
                onChange={(e) => setToggleStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toggle-end-time">Hora de Fin</Label>
              <Input
                id="toggle-end-time"
                type="time"
                value={toggleEndTime}
                onChange={(e) => setToggleEndTime(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="toggle-notes">Motivo/Notas</Label>
              <Textarea
                id="toggle-notes"
                value={toggleNotes}
                onChange={(e) => setToggleNotes(e.target.value)}
                placeholder={isEnabled ? "Motivo de la clase extraordinaria" : "Motivo de la cancelación"}
                rows={3}
              />
            </div>
          </div>

          <Button 
            onClick={handleToggleSchedule} 
            disabled={!toggleDate || !toggleStartTime || !toggleEndTime}
            variant={isEnabled ? "default" : "destructive"}
            className="w-full"
          >
            {isEnabled ? (
              <>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Habilitar Clase Extraordinaria
              </>
            ) : (
              <>
                <CalendarX className="mr-2 h-4 w-4" />
                Deshabilitar Clase
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de horarios programados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horarios Programados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay horarios programados
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`p-4 rounded-lg border ${
                    schedule.is_enabled
                      ? 'bg-white border-gray-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{schedule.title}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            schedule.is_enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {schedule.is_enabled ? 'Activa' : 'Cancelada'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{schedule.instructor_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(schedule.class_date), 'PPP', { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Capacidad máxima: </span>
                        <span className="font-medium">{schedule.max_students} estudiantes</span>
                      </div>

                      {schedule.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <span className="font-medium">Notas: </span>
                          <span>{schedule.notes}</span>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar horario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente el horario de "{schedule.title}" 
                              programado para el {format(new Date(schedule.class_date), 'PPP', { locale: es })}.
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualScheduleManagement;