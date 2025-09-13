import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Plus, Trash2, Clock, Repeat, CalendarDays, Eye, EyeOff } from 'lucide-react';

interface Class {
  id: string;
  title: string;
  instructor: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_students: number;
  is_active: boolean;
}

interface ManualSchedule {
  id: string;
  title: string;
  instructor_name: string;
  class_date: string;
  start_time: string;
  end_time: string;
  max_students: number;
  is_enabled: boolean;
  notes: string | null;
  created_at: string;
}

interface ScheduleOverride {
  id: string;
  class_id: string;
  override_date: string;
  is_enabled: boolean;
  instructor_override: string | null;
  notes: string | null;
  created_at: string;
}

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export const UnifiedScheduleManagement = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [manualSchedules, setManualSchedules] = useState<ManualSchedule[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Form states
  const [sporadicForm, setSporadicForm] = useState({
    title: '',
    instructor: '',
    date: '',
    startTime: '',
    endTime: '',
    maxStudents: 10,
    notes: ''
  });

  const [periodicForm, setPeriodicForm] = useState({
    title: '',
    instructor: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    maxStudents: 10
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch regular classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (classesError) throw classesError;

      // Fetch manual schedules
      const { data: manualData, error: manualError } = await supabase
        .from('manual_class_schedules')
        .select('*')
        .order('class_date', { ascending: true });

      if (manualError) throw manualError;

      // Fetch schedule overrides
      const { data: overridesData, error: overridesError } = await supabase
        .from('schedule_overrides')
        .select('*')
        .order('override_date', { ascending: true });

      if (overridesError) throw overridesError;

      setClasses(classesData || []);
      setManualSchedules(manualData || []);
      setScheduleOverrides(overridesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // A. Sumar clases esporádicas
  const handleAddSporadicClass = async () => {
    if (!sporadicForm.title || !sporadicForm.date || !sporadicForm.startTime || !sporadicForm.endTime) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_manual_class_schedule', {
        p_title: sporadicForm.title,
        p_instructor_name: sporadicForm.instructor,
        p_class_date: sporadicForm.date,
        p_start_time: sporadicForm.startTime,
        p_end_time: sporadicForm.endTime,
        p_max_students: sporadicForm.maxStudents,
        p_is_enabled: true,
        p_notes: sporadicForm.notes || null
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Clase esporádica agregada correctamente",
      });

      setSporadicForm({
        title: '',
        instructor: '',
        date: '',
        startTime: '',
        endTime: '',
        maxStudents: 10,
        notes: ''
      });

      fetchData();
    } catch (error: any) {
      console.error('Error adding sporadic class:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar la clase esporádica",
        variant: "destructive",
      });
    }
  };

  // B. Sumar clases periódicas
  const handleAddPeriodicClass = async () => {
    if (!periodicForm.title || !periodicForm.dayOfWeek || !periodicForm.startTime || !periodicForm.endTime) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          title: periodicForm.title,
          instructor: periodicForm.instructor,
          day_of_week: parseInt(periodicForm.dayOfWeek),
          start_time: periodicForm.startTime,
          end_time: periodicForm.endTime,
          max_students: periodicForm.maxStudents,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Clase periódica agregada correctamente",
      });

      setPeriodicForm({
        title: '',
        instructor: '',
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        maxStudents: 10
      });

      fetchData();
    } catch (error: any) {
      console.error('Error adding periodic class:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar la clase periódica",
        variant: "destructive",
      });
    }
  };

  // C. Suprimir clases
  const handleTogglePeriodicClass = async (classId: string, isActive: boolean, event?: React.MouseEvent) => {
    // Prevent any default behavior that might cause scrolling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .update({ is_active: !isActive })
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Clase ${!isActive ? 'activada' : 'desactivada'} correctamente`,
      });

      // Refresh data without changing focus or scroll position
      await fetchData();
    } catch (error: any) {
      console.error('Error toggling periodic class:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo modificar la clase",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSporadicClass = async (scheduleId: string) => {
    try {
      const { data, error } = await supabase.rpc('delete_manual_class_schedule', {
        schedule_id: scheduleId
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Clase esporádica eliminada correctamente",
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting sporadic class:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la clase esporádica",
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds
  };

  const getDayName = (dayOfWeek: number) => {
    return daysOfWeek.find(day => day.value === dayOfWeek)?.label || 'Desconocido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Cargando gestión de horarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestión de Horarios
          </CardTitle>
          <CardDescription>
            Administra clases esporádicas, periódicas y suprime clases existentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sporadic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sporadic" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Clases Esporádicas
              </TabsTrigger>
              <TabsTrigger value="periodic" className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Clases Periódicas
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Gestionar Clases
              </TabsTrigger>
            </TabsList>

            {/* A. Sumar clases esporádicas */}
            <TabsContent value="sporadic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Clase Esporádica
                  </CardTitle>
                  <CardDescription>
                    Añadir una clase puntual en cualquier día y hora
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sporadic-title">Título *</Label>
                      <Input
                        id="sporadic-title"
                        value={sporadicForm.title}
                        onChange={(e) => setSporadicForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ej: Clase especial de sábado"
                      />
                    </div>
                     <div className="space-y-2">
                       <Label htmlFor="sporadic-instructor">Instructor</Label>
                       <Input
                         id="sporadic-instructor"
                         value={sporadicForm.instructor}
                         onChange={(e) => setSporadicForm(prev => ({ ...prev, instructor: e.target.value }))}
                         placeholder="Nombre del instructor (opcional)"
                       />
                     </div>
                    <div className="space-y-2">
                      <Label htmlFor="sporadic-date">Fecha *</Label>
                      <Input
                        id="sporadic-date"
                        type="date"
                        value={sporadicForm.date}
                        onChange={(e) => setSporadicForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sporadic-max">Máximo estudiantes</Label>
                      <Input
                        id="sporadic-max"
                        type="number"
                        min="1"
                        max="50"
                        value={sporadicForm.maxStudents}
                        onChange={(e) => setSporadicForm(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sporadic-start">Hora inicio *</Label>
                      <Input
                        id="sporadic-start"
                        type="time"
                        value={sporadicForm.startTime}
                        onChange={(e) => setSporadicForm(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sporadic-end">Hora fin *</Label>
                      <Input
                        id="sporadic-end"
                        type="time"
                        value={sporadicForm.endTime}
                        onChange={(e) => setSporadicForm(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sporadic-notes">Notas adicionales</Label>
                    <Textarea
                      id="sporadic-notes"
                      value={sporadicForm.notes}
                      onChange={(e) => setSporadicForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Información adicional sobre la clase..."
                    />
                  </div>
                  <Button onClick={handleAddSporadicClass} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Clase Esporádica
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* B. Sumar clases periódicas */}
            <TabsContent value="periodic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Clase Periódica
                  </CardTitle>
                  <CardDescription>
                    Añadir una clase fija que se repita cada semana
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="periodic-title">Título *</Label>
                      <Input
                        id="periodic-title"
                        value={periodicForm.title}
                        onChange={(e) => setPeriodicForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ej: Boxeo Avanzado"
                      />
                    </div>
                     <div className="space-y-2">
                       <Label htmlFor="periodic-instructor">Instructor</Label>
                       <Input
                         id="periodic-instructor"
                         value={periodicForm.instructor}
                         onChange={(e) => setPeriodicForm(prev => ({ ...prev, instructor: e.target.value }))}
                         placeholder="Nombre del instructor (opcional)"
                       />
                     </div>
                    <div className="space-y-2">
                      <Label htmlFor="periodic-day">Día de la semana *</Label>
                      <Select value={periodicForm.dayOfWeek} onValueChange={(value) => setPeriodicForm(prev => ({ ...prev, dayOfWeek: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un día" />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map(day => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="periodic-max">Máximo estudiantes</Label>
                      <Input
                        id="periodic-max"
                        type="number"
                        min="1"
                        max="50"
                        value={periodicForm.maxStudents}
                        onChange={(e) => setPeriodicForm(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="periodic-start">Hora inicio *</Label>
                      <Input
                        id="periodic-start"
                        type="time"
                        value={periodicForm.startTime}
                        onChange={(e) => setPeriodicForm(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="periodic-end">Hora fin *</Label>
                      <Input
                        id="periodic-end"
                        type="time"
                        value={periodicForm.endTime}
                        onChange={(e) => setPeriodicForm(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddPeriodicClass} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Clase Periódica
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* C. Gestionar clases existentes */}
            <TabsContent value="manage" className="space-y-4">
              {/* Clases periódicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    Clases Periódicas
                  </CardTitle>
                  <CardDescription>
                    Activar o desactivar clases que se repiten semanalmente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Día</TableHead>
                          <TableHead>Horario</TableHead>
                          <TableHead>Máx. estudiantes</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classes.map((cls) => (
                          <TableRow key={cls.id}>
                            <TableCell className="font-medium">{cls.title}</TableCell>
                            <TableCell>{cls.instructor || 'Sin asignar'}</TableCell>
                            <TableCell>{getDayName(cls.day_of_week)}</TableCell>
                            <TableCell>{formatTime(cls.start_time)} - {formatTime(cls.end_time)}</TableCell>
                            <TableCell>{cls.max_students}</TableCell>
                            <TableCell>
                              <Badge variant={cls.is_active ? "default" : "secondary"}>
                                {cls.is_active ? "Activa" : "Desactivada"}
                              </Badge>
                            </TableCell>
                             <TableCell>
                               <Button
                                 variant={cls.is_active ? "outline" : "default"}
                                 size="sm"
                                 onClick={(e) => handleTogglePeriodicClass(cls.id, cls.is_active, e)}
                               >
                                 {cls.is_active ? (
                                   <>
                                     <EyeOff className="h-3 w-3 mr-1" />
                                     Desactivar
                                   </>
                                 ) : (
                                   <>
                                     <Eye className="h-3 w-3 mr-1" />
                                     Activar
                                   </>
                                 )}
                               </Button>
                             </TableCell>
                          </TableRow>
                        ))}
                        {classes.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No hay clases periódicas configuradas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Clases esporádicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Clases Esporádicas
                  </CardTitle>
                  <CardDescription>
                    Gestionar clases puntuales programadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Horario</TableHead>
                          <TableHead>Máx. estudiantes</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manualSchedules.map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-medium">{schedule.title}</TableCell>
                            <TableCell>{schedule.instructor_name}</TableCell>
                            <TableCell>
                              {new Date(schedule.class_date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</TableCell>
                            <TableCell>{schedule.max_students}</TableCell>
                            <TableCell>
                              <Badge variant={schedule.is_enabled ? "default" : "secondary"}>
                                {schedule.is_enabled ? "Activa" : "Desactivada"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Eliminar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar clase esporádica?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Estás seguro de que quieres eliminar la clase "{schedule.title}" del {new Date(schedule.class_date).toLocaleDateString('es-ES')}? Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteSporadicClass(schedule.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                        {manualSchedules.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No hay clases esporádicas programadas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};