import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Trash2, Search, Calendar, Phone, Mail, User, UserX, UserCheck, ClipboardList, Clock, Settings, Eye, Download, FileText } from 'lucide-react';
import BookingManagement from '@/components/BookingManagement';
import RegistrationRequests from '@/components/RegistrationRequests';
import { UnifiedScheduleManagement } from '@/components/UnifiedScheduleManagement';
import ClassManagement from '@/components/ClassManagement';
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  user_id: string;
  email?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  dni?: string;
  birth_date?: string;
  consent_signed?: boolean;
  consent_signed_at?: string;
  consent_signature_url?: string;
  consent_method?: string;
  consent_signed_ip?: string;
  consent_user_agent?: string;
  consent_text_version?: string;
  objective?: string;
}
interface BookingWithDetails {
  id: string;
  booking_date: string;
  status: string;
  created_at: string;
  profile: UserProfile;
  class: {
    title: string;
    start_time: string;
    end_time: string;
  };
}
const AdminPanel = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const profilesSubscription = supabase.channel('profiles-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles'
    }, () => {
      fetchData();
    }).subscribe();
    const bookingsSubscription = supabase.channel('bookings-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'bookings'
    }, () => {
      fetchData();
    }).subscribe();
    return () => {
      supabase.removeChannel(profilesSubscription);
      supabase.removeChannel(bookingsSubscription);
    };
  }, []);
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all user profiles
      const {
        data: profilesData,
        error: profilesError
      } = await supabase.from('profiles').select('*').order('created_at', {
        ascending: false
      });
      if (profilesError) throw profilesError;

      // Type the data properly
      const profilesWithEmails = (profilesData || []).map(profile => ({
        ...profile,
        consent_signed_ip: profile.consent_signed_ip as string | undefined,
        consent_user_agent: profile.consent_user_agent as string | undefined,
      })) as UserProfile[];
      
      setUsers(profilesWithEmails);

      // Fetch bookings with user and class details
      const {
        data: bookingsData,
        error: bookingsError
      } = await supabase.from('bookings').select(`
          *,
          profiles!inner(
            id,
            first_name,
            last_name,
            phone,
            created_at,
            user_id,
            approval_status,
            is_active
          ),
          classes!inner(
            title,
            start_time,
            end_time
          )
        `).eq('status', 'confirmed').order('created_at', {
        ascending: false
      });
      if (bookingsError) throw bookingsError;

      // Transform the data to match our interface
      const transformedBookings = (bookingsData || []).map(booking => ({
        id: booking.id,
        booking_date: booking.booking_date,
        status: booking.status,
        created_at: booking.created_at,
        profile: booking.profiles,
        class: booking.classes
      }));
      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const deactivateUser = async (userId: string, userName: string) => {
    try {
      const {
        data,
        error
      } = await supabase.rpc('admin_deactivate_user', {
        target_user_id: userId
      });
      if (error) throw error;
      toast({
        title: "Usuario desactivado",
        description: `${userName} ha sido desactivado. Ya no podrá acceder al sistema.`
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      toast({
        title: "Error al desactivar usuario",
        description: error.message || "No se pudo desactivar el usuario",
        variant: "destructive"
      });
    }
  };
  const reactivateUser = async (userId: string, userName: string) => {
    try {
      const {
        data,
        error
      } = await supabase.rpc('admin_reactivate_user', {
        target_user_id: userId
      });
      if (error) throw error;
      toast({
        title: "Usuario reactivado",
        description: `${userName} vuelve a estar activo y puede acceder al sistema.`
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error reactivating user:', error);
      toast({
        title: "Error al reactivar usuario",
        description: error.message || "No se pudo reactivar el usuario",
        variant: "destructive"
      });
    }
  };
  const expelUser = async (userId: string, userName: string) => {
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-expel-user', {
        body: {
          target_user_id: userId,
          delete_auth: true
        }
      });
      if (error) throw error;
      toast({
        title: "Usuario expulsado",
        description: `${userName} ha sido expulsado y su cuenta ha sido desactivada. Podrá solicitar re-registro si lo desea.`
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error expelling user:', error);
      toast({
        title: "Error al expulsar usuario",
        description: error.message || "No se pudo expulsar el usuario",
        variant: "destructive"
      });
    }
  };
  const filteredUsers = users.filter(user => user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.phone.includes(searchTerm));
  const approvedUsers = users.filter(user => user.approval_status === 'approved');
  const activeUsers = approvedUsers.filter(user => user.is_active);
  const inactiveUsers = approvedUsers.filter(user => !user.is_active);
  const filteredActiveUsers = activeUsers.filter(user => user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.phone.includes(searchTerm));
  const filteredInactiveUsers = inactiveUsers.filter(user => user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.phone.includes(searchTerm));
  const filteredApprovedUsers = approvedUsers.filter(user => user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.phone.includes(searchTerm));
  const filteredBookings = bookings.filter(booking => booking.profile.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || booking.profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || booking.profile.phone.includes(searchTerm) || booking.class.title.toLowerCase().includes(searchTerm.toLowerCase()));
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando panel de administración...</div>
      </div>;
  }

  return <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
            <p className="text-muted-foreground">Gestiona usuarios y reservas del club de boxeo</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Solicitudes
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Gestión
              </TabsTrigger>
              <TabsTrigger value="classes" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Clases
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Reservas
              </TabsTrigger>
              <TabsTrigger value="schedules" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gestión de Horarios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-6">
              <RegistrationRequests />
            </TabsContent>

            <TabsContent value="classes" className="space-y-6">
              <ClassManagement />
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              <BookingManagement />
            </TabsContent>

            <TabsContent value="schedules" className="space-y-6">
              <UnifiedScheduleManagement />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuarios Activos
                  </CardTitle>
                  <CardDescription>
                    Lista de usuarios activos que pueden acceder al sistema y reservar clases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar por nombre, apellido o teléfono..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Nombre
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Teléfono
                            </div>
                          </TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>DNI</TableHead>
                          <TableHead>Consentimiento</TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Fecha de Registro
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredActiveUsers.map(user => <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.first_name} {user.last_name}
                            </TableCell>
                            <TableCell>{user.phone}</TableCell>
                            <TableCell>{user.dni || '-'}</TableCell>
                            <TableCell>
                              {user.consent_signed ? (
                                <Badge variant="default" className="bg-green-600">
                                  ✓ Firmado
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Sin firmar</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                            </TableCell>
                          </TableRow>)}
                        {filteredActiveUsers.length === 0 && <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              {activeUsers.length === 0 ? "No hay usuarios activos en el sistema" : "No se encontraron usuarios activos que coincidan con la búsqueda"}
                            </TableCell>
                          </TableRow>}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    Total de usuarios activos: {filteredActiveUsers.length}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inactive" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Users className="h-5 w-5" />
                    Usuarios Inactivos
                  </CardTitle>
                  <CardDescription>
                    Lista de usuarios desactivados que no pueden acceder al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar por nombre, apellido o teléfono..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Nombre
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Correo
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Teléfono
                            </div>
                          </TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Fecha de Registro
                            </div>
                          </TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInactiveUsers.map(user => <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.first_name} {user.last_name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {user.email || 'No disponible'}
                            </TableCell>
                            <TableCell>{user.phone}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">Inactivo</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Reactivar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reactivar usuario</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      El usuario <strong>{user.first_name} {user.last_name}</strong> vuelve a estar activo y puede acceder al sistema.
                                      <br /><br />
                                      Podrá iniciar sesión y reservar clases normalmente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => reactivateUser(user.user_id, `${user.first_name} ${user.last_name}`)}>
                                      Reactivar Usuario
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>)}
                        {filteredInactiveUsers.length === 0 && <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              {inactiveUsers.length === 0 ? "No hay usuarios inactivos en el sistema" : "No se encontraron usuarios inactivos que coincidan con la búsqueda"}
                            </TableCell>
                          </TableRow>}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    Total de usuarios inactivos: {filteredInactiveUsers.length}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>



            <TabsContent value="management" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestión Completa de Estados
                  </CardTitle>
                  <CardDescription>
                    Vista completa de todos los usuarios aprobados con capacidad de cambiar su estado activo/inactivo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar usuario para gestionar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha de Registro</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApprovedUsers.map(user => <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.first_name} {user.last_name}
                            </TableCell>
                            <TableCell>{user.phone}</TableCell>
                            <TableCell>
                              <Badge variant={user.is_active ? "default" : "destructive"}>
                                {user.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Ver detalles
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="text-2xl">Información del Alumno</DialogTitle>
                                      <DialogDescription>
                                        Información completa de {user.first_name} {user.last_name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-6 py-4">
                                      {/* Datos Personales */}
                                      <div className="space-y-3">
                                        <h3 className="font-semibold text-lg border-b pb-2">Datos Personales</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm text-muted-foreground">Nombre completo</p>
                                            <p className="font-medium">{user.first_name} {user.last_name}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">DNI</p>
                                            <p className="font-medium">{user.dni || 'No proporcionado'}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Email</p>
                                            <p className="font-medium">{user.email || 'No disponible'}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Teléfono</p>
                                            <p className="font-medium">{user.phone}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Fecha de nacimiento</p>
                                            <p className="font-medium">
                                              {user.birth_date 
                                                ? new Date(user.birth_date).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                  })
                                                : 'No proporcionada'}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Fecha de registro</p>
                                            <p className="font-medium">
                                              {new Date(user.created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                              })}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Objetivo */}
                                      <div className="space-y-3">
                                        <h3 className="font-semibold text-lg border-b pb-2">Objetivo de Entrenamiento</h3>
                                        <div className="bg-muted/50 rounded-lg p-4">
                                          <p className="font-medium">
                                            {user.objective === 'forma' && '🎯 Ponerme en forma'}
                                            {user.objective === 'competir' && '🥊 Competir'}
                                            {user.objective === 'tecnica' && '📚 Aprender técnica'}
                                            {!user.objective && 'No especificado'}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Consentimiento */}
                                      <div className="space-y-3">
                                        <h3 className="font-semibold text-lg border-b pb-2">Consentimiento Informado</h3>
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                                            <div className="flex items-center gap-3">
                                              <FileText className="h-5 w-5 text-muted-foreground" />
                                              <div>
                                                <p className="font-medium">Estado del consentimiento</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {user.consent_signed 
                                                    ? `Firmado el ${new Date(user.consent_signed_at || '').toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                      })}`
                                                    : 'No firmado'}
                                                </p>
                                              </div>
                                            </div>
                                            <Badge variant={user.consent_signed ? "default" : "secondary"} className={user.consent_signed ? "bg-green-600" : ""}>
                                              {user.consent_signed ? '✓ Firmado' : 'Sin firmar'}
                                            </Badge>
                                          </div>
                                          
                                          {user.consent_signed && user.consent_signature_url && (
                                            <>
                                              {/* Signature Image */}
                                              <div className="border rounded-lg p-4 bg-white">
                                                <p className="text-sm font-medium mb-2">Firma Digital:</p>
                                                <img 
                                                  src={user.consent_signature_url} 
                                                  alt="Firma del usuario" 
                                                  className="max-w-full h-32 object-contain border border-muted mx-auto"
                                                />
                                                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                                                  <p><strong>Método:</strong> {user.consent_method === 'canvas' ? 'Firma dibujada' : 'Nombre escrito'}</p>
                                                  {user.consent_signed_ip && <p><strong>IP:</strong> {user.consent_signed_ip}</p>}
                                                  {user.consent_text_version && <p><strong>Versión del documento:</strong> {user.consent_text_version}</p>}
                                                </div>
                                              </div>

                                              {/* Download Buttons */}
                                              <div className="grid grid-cols-2 gap-2">
                                                <Button 
                                                  variant="outline" 
                                                  size="sm"
                                                  asChild
                                                >
                                                  <a href={user.consent_signature_url} download={`firma-${user.first_name}-${user.last_name}.png`}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Descargar firma
                                                  </a>
                                                </Button>
                                                <Button 
                                                  variant="outline" 
                                                  size="sm"
                                                  onClick={async () => {
                                                    try {
                                                      const { data: { session } } = await supabase.auth.getSession();
                                                      if (!session) throw new Error('No session');

                                                      const response = await fetch(
                                                        `https://qdpvgbnkewxrervdoexg.supabase.co/functions/v1/generate-consent-pdf`,
                                                        {
                                                          method: 'POST',
                                                          headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${session.access_token}`
                                                          },
                                                          body: JSON.stringify({ userId: user.user_id })
                                                        }
                                                      );

                                                      if (!response.ok) throw new Error('Failed to generate PDF');

                                                      const blob = await response.blob();
                                                      const url = window.URL.createObjectURL(blob);
                                                      const a = document.createElement('a');
                                                      a.href = url;
                                                      a.download = `consentimiento-${user.first_name}-${user.last_name}.html`;
                                                      document.body.appendChild(a);
                                                      a.click();
                                                      window.URL.revokeObjectURL(url);
                                                      document.body.removeChild(a);

                                                      toast({
                                                        title: "PDF generado",
                                                        description: "El documento se está descargando."
                                                      });
                                                    } catch (error) {
                                                      console.error('Error generating PDF:', error);
                                                      toast({
                                                        title: "Error",
                                                        description: "No se pudo generar el PDF.",
                                                        variant: "destructive"
                                                      });
                                                    }
                                                  }}
                                                >
                                                  <FileText className="h-4 w-4 mr-2" />
                                                  Generar PDF
                                                </Button>
                                              </div>
                                            </>
                                          )}

                                          {user.consent_signed && !user.consent_signature_url && (
                                            <Button 
                                              asChild
                                              variant="outline" 
                                              className="w-full"
                                            >
                                              <a href="/documents/consentimiento-informado.pdf" download>
                                                <Download className="h-4 w-4 mr-2" />
                                                Descargar documento de consentimiento
                                              </a>
                                            </Button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Estado de la cuenta */}
                                      <div className="space-y-3">
                                        <h3 className="font-semibold text-lg border-b pb-2">Estado de la Cuenta</h3>
                                        <div className="flex gap-4">
                                          <Badge variant={user.is_active ? "default" : "destructive"}>
                                            {user.is_active ? "✓ Cuenta Activa" : "✗ Cuenta Inactiva"}
                                          </Badge>
                                          <Badge variant="outline">
                                            {user.approval_status === 'approved' && '✓ Aprobado'}
                                            {user.approval_status === 'pending' && '⏳ Pendiente'}
                                            {user.approval_status === 'rejected' && '✗ Rechazado'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                {user.is_active ? <>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <UserX className="h-4 w-4 mr-1" />
                                          Desactivar
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Seguro que quieres desactivar esta cuenta?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            El usuario <strong>{user.first_name} {user.last_name}</strong> no podrá acceder hasta que lo reactives.
                                            <br /><br />
                                            Sus datos se mantendrán en el sistema y podrás reactivarlo en cualquier momento.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => deactivateUser(user.user_id, `${user.first_name} ${user.last_name}`)} className="bg-orange-600 text-white hover:bg-orange-700">
                                            Desactivar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                          <Trash2 className="h-4 w-4 mr-1" />
                                          Expulsar
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Seguro que quieres expulsar a este usuario?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            <strong>ATENCIÓN:</strong> Su cuenta y datos se eliminarán por completo. 
                                            <br /><br />
                                            El usuario <strong>{user.first_name} {user.last_name}</strong> perderá:
                                            <br />• Toda su información de perfil
                                            <br />• Historial de reservas
                                            <br />• Acceso inmediato al sistema
                                            <br /><br />
                                            <strong>Solo podrá volver a entrar si se registra de nuevo y apruebas su solicitud.</strong>
                                            <br /><br />
                                            Esta acción NO se puede deshacer.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => expelUser(user.user_id, `${user.first_name} ${user.last_name}`)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Sí, expulsar usuario
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </> : <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        Reactivar
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Reactivar usuario</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          El usuario <strong>{user.first_name} {user.last_name}</strong> vuelve a estar activo y puede acceder al sistema.
                                          <br /><br />
                                          Podrá iniciar sesión y reservar clases normalmente.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => reactivateUser(user.user_id, `${user.first_name} ${user.last_name}`)}>
                                          Reactivar Usuario
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>}
                              </div>
                            </TableCell>
                          </TableRow>)}
                        {filteredApprovedUsers.length === 0 && <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              {approvedUsers.length === 0 ? "No hay usuarios aprobados en el sistema" : "No se encontraron usuarios aprobados que coincidan con la búsqueda"}
                            </TableCell>
                          </TableRow>}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                    <span>Usuarios activos: {activeUsers.length} | Usuarios inactivos: {inactiveUsers.length}</span>
                    <span>Total de usuarios aprobados: {approvedUsers.length}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>;
};
export default AdminPanel;