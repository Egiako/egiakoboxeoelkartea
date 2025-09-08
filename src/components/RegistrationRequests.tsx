import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserCheck, UserX, Clock, Search, RefreshCw, Mail, Phone, User } from 'lucide-react';

interface PendingUser {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_reregistration: boolean;
  previous_status: string | null;
}

const RegistrationRequests = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
    
    // Set up real-time subscription for profile changes
    const profilesChannel = supabase
      .channel('pending-profiles-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: 'approval_status=eq.pending'
      }, () => {
        fetchPendingUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes pendientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationEmail = async (user: PendingUser, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.functions.invoke('send-approval-email', {
        body: {
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          status: status
        }
      });

      if (error) {
        console.error('Error sending notification email:', error);
        // Don't throw error here - approval should still work even if email fails
        toast({
          title: "Advertencia",
          description: "El usuario fue procesado pero no se pudo enviar el email de notificación",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending notification email:', error);
    }
  };

  const handleApproveUser = async (user: PendingUser) => {
    try {
      setProcessingUser(user.id);
      
      const { data, error } = await supabase.rpc('admin_approve_user', {
        target_user_id: user.user_id
      });

      if (error) throw error;

      // Send notification email
      await sendNotificationEmail(user, 'approved');

      toast({
        title: "Usuario aprobado",
        description: `${user.first_name} ${user.last_name} ha sido aprobado exitosamente`,
      });

      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar el usuario",
        variant: "destructive"
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRejectUser = async (user: PendingUser) => {
    try {
      setProcessingUser(user.id);
      
      const { data, error } = await supabase.rpc('admin_reject_user', {
        target_user_id: user.user_id
      });

      if (error) throw error;

      // Send notification email
      await sendNotificationEmail(user, 'rejected');

      toast({
        title: "Usuario rechazado",
        description: `La solicitud de ${user.first_name} ${user.last_name} ha sido rechazada`,
      });

      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar el usuario",
        variant: "destructive"
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const filteredUsers = pendingUsers.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const newUsers = filteredUsers.filter((u) => !u.is_reregistration);
  const oldUsers = filteredUsers.filter((u) => u.is_reregistration);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Cargando solicitudes...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Solicitudes de Registro Pendientes
          {pendingUsers.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingUsers.length} pendientes
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={fetchPendingUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay solicitudes pendientes</h3>
            <p className="text-muted-foreground">
              Todas las solicitudes de registro han sido procesadas.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Nuevos socios */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Nuevos socios</h3>
                <Badge variant="secondary">{newUsers.length}</Badge>
              </div>
              {newUsers.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-lg p-4">
                  No hay nuevas solicitudes.
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Usuario
                          </div>
                        </TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Teléfono
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </TableHead>
                        <TableHead>Fecha Solicitud</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {user.first_name} {user.last_name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Primera solicitud
                            </Badge>
                          </TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    disabled={processingUser === user.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Aprobar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Aprobar usuario?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Estás seguro de que quieres aprobar la solicitud de {user.first_name} {user.last_name}?
                                      <br /><br />El usuario podrá acceder a todas las funcionalidades de socio y se le enviará un email de confirmación.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleApproveUser(user)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Aprobar Usuario
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={processingUser === user.id}
                                  >
                                    <UserX className="h-3 w-3 mr-1" />
                                    Rechazar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Rechazar usuario?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Estás seguro de que quieres rechazar la solicitud de {user.first_name} {user.last_name}?
                                      El usuario no podrá acceder a las funcionalidades de socio y se le enviará un email informativo.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRejectUser(user)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Rechazar Usuario
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Viejos socios */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Viejos socios</h3>
                <Badge variant="secondary">{oldUsers.length}</Badge>
              </div>
              {oldUsers.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-lg p-4">
                  No hay solicitudes de antiguos socios.
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Usuario
                          </div>
                        </TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Teléfono
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </TableHead>
                        <TableHead>Fecha Solicitud</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {oldUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {user.first_name} {user.last_name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Re-solicitud
                              </Badge>
                              {user.previous_status && (
                                <div className="text-xs text-muted-foreground">
                                  {user.previous_status === 'previously_expelled' && 'Usuario expulsado anteriormente'}
                                  {user.previous_status === 'previously_rejected' && 'Solicitud rechazada anteriormente'}
                                  {user.previous_status === 'previously_deactivated' && 'Usuario desactivado anteriormente'}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    disabled={processingUser === user.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Volver a ser socio
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Permitir que vuelva a ser socio?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Vas a aprobar la re-solicitud de {user.first_name} {user.last_name}.
                                      <br /><br />
                                      <strong>Nota:</strong> Se mantendrá el perfil generado en este nuevo registro. No se recuperan datos de perfiles anteriores.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleApproveUser(user)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Aprobar re-solicitud
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={processingUser === user.id}
                                  >
                                    <UserX className="h-3 w-3 mr-1" />
                                    Rechazar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Rechazar re-solicitud?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Estás seguro de que quieres rechazar la re-solicitud de {user.first_name} {user.last_name}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRejectUser(user)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Rechazar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>
        )}

        {filteredUsers.length === 0 && searchTerm && (
          <div className="text-center py-4 text-muted-foreground">
            No se encontraron usuarios que coincidan con "{searchTerm}"
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationRequests;