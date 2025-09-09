import { useState, useMemo } from 'react';
import { useManualBookingManagement } from '@/hooks/useManualBookingManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Calendar, BookOpen, Check, X, Clock, AlertTriangle } from 'lucide-react';

export const TrainerBookingManagement = () => {
  const { bookings, loading, updateTrainerAttendance } = useManualBookingManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');

  // Get unique classes and dates for filters
  const { uniqueClasses, uniqueDates } = useMemo(() => {
    const classes = Array.from(new Set(bookings.map(b => b.manual_schedule.title)));
    const dates = Array.from(new Set(bookings.map(b => b.booking_date))).sort();
    return { uniqueClasses: classes, uniqueDates: dates };
  }, [bookings]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = `${booking.profile.first_name} ${booking.profile.last_name}`
        .toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.profile.phone.includes(searchTerm) ||
        booking.manual_schedule.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = dateFilter === 'all' || booking.booking_date === dateFilter;
      const matchesClass = classFilter === 'all' || booking.manual_schedule.title === classFilter;
      
      const matchesAttendance = attendanceFilter === 'all' ||
        (attendanceFilter === 'attended' && booking.attended === true) ||
        (attendanceFilter === 'not_attended' && booking.attended === false) ||
        (attendanceFilter === 'pending' && booking.attended === null);

      return matchesSearch && matchesDate && matchesClass && matchesAttendance;
    });
  }, [bookings, searchTerm, dateFilter, classFilter, attendanceFilter]);

  // Group bookings by date, then by class
  const groupedByDay = useMemo(() => {
    const grouped = filteredBookings.reduce((acc: any, booking) => {
      const date = booking.booking_date;
      if (!acc[date]) {
        acc[date] = {};
      }
      const classTitle = booking.manual_schedule.title;
      if (!acc[date][classTitle]) {
        acc[date][classTitle] = {
          class: booking.manual_schedule,
          bookings: [],
          stats: { total: 0, attended: 0, notAttended: 0, pending: 0 }
        };
      }
      acc[date][classTitle].bookings.push(booking);
      acc[date][classTitle].stats.total++;
      
      if (booking.attended === true) acc[date][classTitle].stats.attended++;
      else if (booking.attended === false) acc[date][classTitle].stats.notAttended++;
      else acc[date][classTitle].stats.pending++;
      
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [filteredBookings]);

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getAttendanceIcon = (attended: boolean | null) => {
    if (attended === true) return <Check className="h-4 w-4 text-green-600" />;
    if (attended === false) return <X className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  const getAttendanceBadge = (attended: boolean | null) => {
    if (attended === true) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Asistió</Badge>;
    }
    if (attended === false) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">No asistió</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Asistencia</CardTitle>
          <CardDescription>
            Marca la asistencia de los estudiantes a las clases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Cargando reservas...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Gestión de Asistencia
        </CardTitle>
        <CardDescription>
          Marca la asistencia de los estudiantes. Si no asistió, se descontará automáticamente 1 clase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar estudiante o clase..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              {uniqueDates.map(date => (
                <SelectItem key={date} value={date}>
                  {new Date(date).toLocaleDateString('es-ES')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por clase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las clases</SelectItem>
              {uniqueClasses.map(className => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por asistencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo</SelectItem>
              <SelectItem value="attended">Asistieron</SelectItem>
              <SelectItem value="not_attended">No asistieron</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advertencia sobre penalización */}
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Importante:</strong> Al marcar a un estudiante como "No asistió", se le descontará automáticamente 1 clase de su contador mensual.
          </p>
        </div>

        {/* Resultados agrupados */}
        {groupedByDay.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron reservas con los filtros aplicados
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDay.map(([date, classes]: [string, any]) => (
              <div key={date} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {getDayName(date)}
                </h3>
                
                {Object.entries(classes).map(([className, classData]: [string, any]) => (
                  <div key={className} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        {className}
                        <span className="text-sm text-muted-foreground">
                          ({classData.class.start_time} - {classData.class.end_time})
                        </span>
                      </h4>
                      <div className="flex gap-2 text-sm">
                        <span className="text-green-600">✓ {classData.stats.attended}</span>
                        <span className="text-red-600">✗ {classData.stats.notAttended}</span>
                        <span className="text-yellow-600">⏳ {classData.stats.pending}</span>
                      </div>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Clases Restantes</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classData.bookings.map((booking: any) => (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">
                                {booking.profile.first_name} {booking.profile.last_name}
                              </TableCell>
                              <TableCell>{booking.profile.phone}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {booking.user_monthly_classes?.remaining_classes || 0} clases
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {getAttendanceBadge(booking.attended)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant={booking.attended === true ? "default" : "outline"}
                                    onClick={() => updateTrainerAttendance(booking.id, true)}
                                    disabled={booking.attended === true}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={booking.attended === false ? "destructive" : "outline"}
                                    onClick={() => updateTrainerAttendance(booking.id, false)}
                                    disabled={booking.attended === false}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};