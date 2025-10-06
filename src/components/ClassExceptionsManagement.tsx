import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar as CalendarIcon, Edit, Trash2, X } from 'lucide-react';
import { ClassExceptionModal } from './ClassExceptionModal';
import { useClassExceptions, ClassException } from '@/hooks/useClassExceptions';
import { Calendar } from '@/components/ui/calendar';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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

interface ScheduleOccurrence {
  classId: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  instructor: string;
  maxStudents: number;
  dayOfWeek: number;
}

const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const ClassExceptionsManagement = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [exceptions, setExceptions] = useState<ClassException[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { deleteException, fetchExceptions } = useClassExceptions();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch active periodic classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });

      if (classesError) throw classesError;
      setClasses(classesData || []);

      // Fetch exceptions for current month
      const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(addMonths(selectedDate, 1)), 'yyyy-MM-dd');
      const exceptionsData = await fetchExceptions(startDate, endDate);
      setExceptions(exceptionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cls: Class) => {
    setSelectedClass(cls);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handleDeleteException = async (exceptionId: string) => {
    try {
      await deleteException(exceptionId);
      fetchData();
    } catch (error) {
      console.error('Error deleting exception:', error);
    }
  };

  const getExceptionForDateAndClass = (date: Date, classId: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return exceptions.find(
      ex => ex.class_id === classId && ex.exception_date === dateString
    );
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Gestión de Excepciones de Clases
          </CardTitle>
          <CardDescription>
            Edita o cancela ocurrencias específicas de clases periódicas sin afectar el resto de la serie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calendar selector */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={es}
              className="rounded-md border"
            />
          </div>

          {/* Class occurrences for selected date */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Clases para {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classes
                  .filter(cls => cls.day_of_week === selectedDate.getDay())
                  .map(cls => {
                    const exception = getExceptionForDateAndClass(selectedDate, cls.id);
                    const isCancelled = exception?.is_cancelled;
                    const hasException = !!exception;

                    return (
                      <div
                        key={cls.id}
                        className={`p-4 border rounded-lg ${
                          isCancelled ? 'bg-destructive/10 border-destructive/20' : 
                          hasException ? 'bg-amber-50 border-amber-200' : 
                          'bg-card'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{cls.title}</h3>
                              {hasException && (
                                <Badge variant={isCancelled ? "destructive" : "secondary"}>
                                  {isCancelled ? 'Cancelada' : 'Modificada'}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>
                                <span className="font-medium">Horario:</span>{' '}
                                {hasException && exception.override_start_time && exception.override_end_time ? (
                                  <>
                                    <span className="line-through text-muted-foreground/60">
                                      {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                                    </span>
                                    {' → '}
                                    <span className="font-medium text-foreground">
                                      {formatTime(exception.override_start_time)} - {formatTime(exception.override_end_time)}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                                  </>
                                )}
                              </p>
                              <p>
                                <span className="font-medium">Instructor:</span>{' '}
                                {hasException && exception.override_instructor ? (
                                  <>
                                    <span className="line-through text-muted-foreground/60">
                                      {cls.instructor || 'Sin asignar'}
                                    </span>
                                    {' → '}
                                    <span className="font-medium text-foreground">
                                      {exception.override_instructor}
                                    </span>
                                  </>
                                ) : (
                                  cls.instructor || 'Sin asignar'
                                )}
                              </p>
                              {exception?.notes && (
                                <p>
                                  <span className="font-medium">Notas:</span> {exception.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!isCancelled && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenModal(cls)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                {hasException ? 'Modificar' : 'Editar'}
                              </Button>
                            )}
                            {hasException && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Restaurar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Restaurar clase a su horario normal?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará la excepción y la clase volverá a su configuración periódica original.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteException(exception.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Restaurar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {classes.filter(cls => cls.day_of_week === selectedDate.getDay()).length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    No hay clases programadas para este día
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exceptions list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Todas las excepciones</CardTitle>
              <CardDescription>
                Lista completa de excepciones creadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Clase</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Cambios</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exceptions.map((exception) => {
                      const cls = classes.find(c => c.id === exception.class_id);
                      if (!cls) return null;

                      return (
                        <TableRow key={exception.id}>
                          <TableCell>
                            {format(new Date(exception.exception_date), "d 'de' MMMM, yyyy", { locale: es })}
                          </TableCell>
                          <TableCell className="font-medium">{cls.title}</TableCell>
                          <TableCell>
                            <Badge variant={exception.is_cancelled ? "destructive" : "secondary"}>
                              {exception.is_cancelled ? 'Cancelada' : 'Modificada'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {exception.is_cancelled ? (
                              'Clase cancelada'
                            ) : (
                              <div className="space-y-1">
                                {exception.override_start_time && exception.override_end_time && (
                                  <div>
                                    Horario: {formatTime(exception.override_start_time)} - {formatTime(exception.override_end_time)}
                                  </div>
                                )}
                                {exception.override_instructor && (
                                  <div>Instructor: {exception.override_instructor}</div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <X className="h-3 w-3 mr-1" />
                                  Eliminar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar excepción?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    La clase volverá a su configuración periódica original.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteException(exception.id)}
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {exceptions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay excepciones creadas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Exception Modal */}
      {selectedClass && (
        <ClassExceptionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          classId={selectedClass.id}
          classTitle={selectedClass.title}
          date={selectedDate}
          currentStartTime={selectedClass.start_time}
          currentEndTime={selectedClass.end_time}
          currentInstructor={selectedClass.instructor || undefined}
          currentMaxStudents={selectedClass.max_students}
          onSuccess={() => {
            fetchData();
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};
