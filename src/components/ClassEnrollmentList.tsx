import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EnrolledStudent {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  attended: boolean | null;
  remaining_classes: number;
  booking_date: string;
}

interface ClassEnrollmentListProps {
  classId: string;
  date: string;
  className: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
}

export const ClassEnrollmentList = ({ 
  classId, 
  date, 
  className, 
  startTime, 
  endTime, 
  maxStudents 
}: ClassEnrollmentListProps) => {
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEnrolledStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings for this class and date with student details
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          attended,
          booking_date,
          profiles!inner (
            first_name,
            last_name,
            is_active,
            approval_status
          )
        `)
        .or(`class_id.eq.${classId},manual_schedule_id.eq.${classId}`)
        .eq('booking_date', date)
        .eq('status', 'confirmed')
        .eq('profiles.is_active', true)
        .eq('profiles.approval_status', 'approved');

      if (error) throw error;

      // Get monthly classes for each user
      const studentsWithClasses = await Promise.all(
        (data || []).map(async (booking: any) => {
          const { data: monthlyData, error: monthlyError } = await supabase.rpc(
            'get_or_create_monthly_classes',
            { user_uuid: booking.user_id }
          );

          return {
            id: booking.id,
            user_id: booking.user_id,
            first_name: booking.profiles.first_name,
            last_name: booking.profiles.last_name,
            attended: booking.attended,
            remaining_classes: monthlyData?.remaining_classes || 0,
            booking_date: booking.booking_date
          };
        })
      );

      setEnrolledStudents(studentsWithClasses);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los alumnos inscritos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (bookingId: string, attended: boolean) => {
    try {
      const { data, error } = await supabase.rpc('trainer_update_attendance', {
        booking_uuid: bookingId,
        attendance_status: attended
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: attended 
          ? "Alumno marcado como asistido" 
          : "Alumno marcado como no asistido. Se ha aplicado la penalización.",
      });

      // Refresh the list to show updated data
      await fetchEnrolledStudents();
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la asistencia",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEnrolledStudents();

    // Set up real-time subscription for booking changes
    const channel = supabase
      .channel(`class-${classId}-${date}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        fetchEnrolledStudents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId, date]);

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const getAttendanceIcon = (attended: boolean | null) => {
    if (attended === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (attended === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAttendanceStatus = (attended: boolean | null) => {
    if (attended === true) return 'Asistió';
    if (attended === false) return 'No asistió';
    return 'Pendiente';
  };

  const getAttendanceVariant = (attended: boolean | null) => {
    if (attended === true) return 'default';
    if (attended === false) return 'destructive';
    return 'secondary';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Cargando alumnos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {className}
        </CardTitle>
        <CardDescription>
          {format(new Date(date), "EEEE, d 'de' MMMM", { locale: es })} • {formatTime(startTime)} - {formatTime(endTime)}
          <br />
          Alumnos inscritos: {enrolledStudents.length}/{maxStudents}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {enrolledStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay alumnos inscritos en esta clase</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Clases restantes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {student.remaining_classes} clases
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAttendanceIcon(student.attended)}
                        <Badge variant={getAttendanceVariant(student.attended)}>
                          {getAttendanceStatus(student.attended)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {student.attended !== true && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateAttendance(student.id, true)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Asistió
                          </Button>
                        )}
                        {student.attended !== false && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateAttendance(student.id, false)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            No asistió
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};