import { useState, useMemo } from 'react';
import { useBookingManagement, BookingWithFullDetails } from '@/hooks/useBookingManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, Circle, Filter, Search, AlertTriangle } from 'lucide-react';

const BookingManagement = () => {
  const { bookings, loading, updateAttendance } = useBookingManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');

  // Get unique classes and dates for filters
  const uniqueClasses = useMemo(() => {
    const classes = bookings
      .filter((b) => b.class)
      .map(b => ({
        id: b.class.id,
        title: b.class.title,
        time: `${b.class.start_time} - ${b.class.end_time}`
      }));
    return classes.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  }, [bookings]);

  const uniqueDates = useMemo(() => {
    const dates = [...new Set(bookings.map(b => b.booking_date))].sort((a, b) => b.localeCompare(a));
    return dates;
  }, [bookings]);

  // Filter bookings based on search and filters
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.profile.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.profile.phone.includes(searchTerm) ||
        (booking.profile.email && booking.profile.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        booking.class.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = dateFilter === 'all' || booking.booking_date === dateFilter;
      const matchesClass = classFilter === 'all' || booking.class.id === classFilter;
      
      let matchesAttendance = true;
      if (attendanceFilter === 'attended') matchesAttendance = booking.attended === true;
      else if (attendanceFilter === 'not_attended') matchesAttendance = booking.attended === false;
      else if (attendanceFilter === 'pending') matchesAttendance = booking.attended === null;

      return matchesSearch && matchesDate && matchesClass && matchesAttendance;
    });
  }, [bookings, searchTerm, dateFilter, classFilter, attendanceFilter]);

  // Group bookings by date first, then by class
  const groupedByDay = useMemo(() => {
    const dayGroups: { [key: string]: BookingWithFullDetails[] } = {};
    
    filteredBookings.forEach(booking => {
      if (!dayGroups[booking.booking_date]) {
        dayGroups[booking.booking_date] = [];
      }
      dayGroups[booking.booking_date].push(booking);
    });

    return Object.entries(dayGroups).map(([date, dayBookings]) => {
      // Group by class within the day
      const classGroups: { [key: string]: BookingWithFullDetails[] } = {};
      
      dayBookings.forEach(booking => {
        if (!classGroups[booking.class.id]) {
          classGroups[booking.class.id] = [];
        }
        classGroups[booking.class.id].push(booking);
      });

      const classes = Object.entries(classGroups).map(([classId, bookings]) => ({
        class: bookings[0].class,
        bookings: bookings.sort((a, b) => `${a.profile.first_name} ${a.profile.last_name}`.localeCompare(`${b.profile.first_name} ${b.profile.last_name}`))
      })).sort((a, b) => a.class.start_time.localeCompare(b.class.start_time));

      const totalReservations = dayBookings.length;
      const attendedCount = dayBookings.filter(b => b.attended === true).length;
      const notAttendedCount = dayBookings.filter(b => b.attended === false).length;
      const pendingCount = dayBookings.filter(b => b.attended === null).length;

      return {
        date,
        classes,
        totalReservations,
        attendedCount,
        notAttendedCount,
        pendingCount,
        dayBookings
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredBookings]);

  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  };

  const getAttendanceIcon = (attended: boolean | null) => {
    if (attended === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (attended === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const getAttendanceBadge = (attended: boolean | null) => {
    if (attended === true) return <Badge variant="secondary" className="bg-green-100 text-green-800">Asistió</Badge>;
    if (attended === false) return <Badge variant="destructive">No asistió</Badge>;
    return <Badge variant="outline">Pendiente</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lista de Reservas por Clase
          </CardTitle>
          <CardDescription>
            Gestiona la asistencia y visualiza las reservas organizadas por clase y fecha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, teléfono o clase..."
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
                    {new Date(date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
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
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.title} ({cls.time})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por asistencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="attended">Asistieron</SelectItem>
                <SelectItem value="not_attended">No asistieron</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{filteredBookings.length}</div>
                <p className="text-xs text-muted-foreground">Total Reservas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{filteredBookings.filter(b => b.attended === true).length}</div>
                <p className="text-xs text-muted-foreground">Asistieron</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{filteredBookings.filter(b => b.attended === false).length}</div>
                <p className="text-xs text-muted-foreground">No Asistieron</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-muted-foreground">{filteredBookings.filter(b => b.attended === null).length}</div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Grouped by Day */}
      <div className="space-y-6">
        {groupedByDay.map(day => (
          <Card key={day.date} className="overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {new Date(day.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Total de reservas del día
                  </CardDescription>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{day.totalReservations}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{day.pendingCount}</div>
                    <div className="text-xs text-muted-foreground">Pendientes</div>
                  </div>
                </div>
              </div>
              
              {/* Day Statistics */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-lg font-bold text-green-600">{day.attendedCount}</div>
                    <p className="text-xs text-muted-foreground">Asistieron</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-lg font-bold text-red-600">{day.notAttendedCount}</div>
                    <p className="text-xs text-muted-foreground">No Asistieron</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-lg font-bold text-muted-foreground">{day.pendingCount}</div>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </CardContent>
                </Card>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Classes for this day */}
              <div className="space-y-0">
                {day.classes.map((classGroup, index) => (
                  <div key={classGroup.class.id} className={index > 0 ? "border-t" : ""}>
                    {/* Class Header */}
                    <div className="bg-muted/30 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{classGroup.class.start_time} - {classGroup.class.end_time}</span>
                          </div>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {classGroup.class.title}
                          </Badge>
                          {classGroup.class.instructor && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {classGroup.class.instructor}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline">
                          {classGroup.bookings.length} {classGroup.bookings.length === 1 ? 'alumno' : 'alumnos'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Students Table */}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Clases Restantes</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classGroup.bookings.map((booking) => (
                          <TableRow 
                            key={booking.id}
                            className={booking.attended === false ? 'bg-red-50/50 hover:bg-red-100/50' : ''}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getAttendanceIcon(booking.attended)}
                                <span>{booking.profile.first_name} {booking.profile.last_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {booking.profile.email || 'Sin email'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {booking.profile.phone}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={booking.user_monthly_classes?.remaining_classes === 0 ? "destructive" : "secondary"}
                                className="flex items-center gap-1 w-fit text-xs"
                              >
                                {booking.user_monthly_classes?.remaining_classes === 0 && (
                                  <AlertTriangle className="h-3 w-3" />
                                )}
                                {booking.user_monthly_classes?.remaining_classes || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getAttendanceBadge(booking.attended)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {booking.attended !== true && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateAttendance(booking.id, true)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-100 h-8 px-2"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {booking.attended !== false && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateAttendance(booking.id, false)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 px-2"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {groupedByDay.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No se encontraron reservas</h3>
                <p>Ajusta los filtros para ver más resultados</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BookingManagement;