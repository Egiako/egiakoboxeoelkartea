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
import { Users, Trash2, Search, Calendar, Phone, Mail, User } from 'lucide-react';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  user_id: string;
  email?: string;
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
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const profilesSubscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .subscribe();

    const bookingsSubscription = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesSubscription);
      supabase.removeChannel(bookingsSubscription);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user emails from auth.users through a custom function or RPC
      const profilesWithEmails = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // We can't directly query auth.users, so we'll store email in the booking context
          return profile;
        })
      );

      setUsers(profilesWithEmails);

      // Fetch bookings with user and class details
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!inner(
            id,
            first_name,
            last_name,
            phone,
            created_at,
            user_id
          ),
          classes!inner(
            title,
            start_time,
            end_time
          )
        `)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

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

  const deleteUser = async (userId: string, profileId: string) => {
    try {
      // First delete all bookings for this user
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', userId);

      if (bookingsError) throw bookingsError;

      // Then delete the profile (this will cascade to user_roles)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (profileError) throw profileError;

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente",
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  const filteredBookings = bookings.filter(booking =>
    booking.profile.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.profile.phone.includes(searchTerm) ||
    booking.class.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando panel de administración...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
            <p className="text-muted-foreground">Gestiona usuarios y reservas del club de boxeo</p>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Lista de Inscritos
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Gestión de Bajas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuarios Registrados en Clases
                  </CardTitle>
                  <CardDescription>
                    Lista completa de todos los usuarios que se han registrado en las clases de boxeo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre, apellido o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
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
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Fecha de Registro
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.first_name} {user.last_name}
                            </TableCell>
                            <TableCell>{user.phone}</TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No se encontraron usuarios
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    Total de usuarios: {filteredUsers.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reservas Activas</CardTitle>
                  <CardDescription>
                    Detalles de todas las reservas confirmadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Clase</TableHead>
                          <TableHead>Fecha Reserva</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                              {booking.profile.first_name} {booking.profile.last_name}
                            </TableCell>
                            <TableCell>{booking.profile.phone}</TableCell>
                            <TableCell>
                              {booking.class.title}
                              <div className="text-sm text-muted-foreground">
                                {booking.class.start_time} - {booking.class.end_time}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(booking.booking_date).toLocaleDateString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">
                                {booking.status === 'confirmed' ? 'Confirmada' : booking.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredBookings.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No se encontraron reservas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="management" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Gestión de Bajas de Usuario
                  </CardTitle>
                  <CardDescription>
                    Eliminar usuarios del sistema. Esta acción no se puede deshacer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar usuario para eliminar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Fecha de Registro</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.first_name} {user.last_name}
                            </TableCell>
                            <TableCell>{user.phone}</TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Dar de Baja
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará permanentemente al usuario{' '}
                                      <strong>{user.first_name} {user.last_name}</strong> y todas sus reservas.
                                      Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser(user.user_id, user.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar Usuario
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No se encontraron usuarios
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
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AdminPanel;