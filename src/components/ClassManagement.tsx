import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Minus, Users, RefreshCw, Calendar, BarChart3, ArrowRight } from 'lucide-react';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  user_id: string;
}

interface MonthlyClasses {
  id: string;
  user_id: string;
  remaining_classes: number;
  month: number;
  year: number;
}

interface MonthlyStats {
  total_users: number;
  users_with_classes: number;
  users_without_classes: number;
  average_remaining: number;
  current_month: number;
  current_year: number;
}

interface UserWithClasses extends UserProfile {
  monthly_classes?: MonthlyClasses;
}

const ClassManagement = () => {
  const [users, setUsers] = useState<UserWithClasses[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsersWithClasses();
    fetchMonthlyStats();
  }, []);

  const fetchMonthlyStats = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_monthly_stats');
      if (error) throw error;
      if (data && data.length > 0) {
        setMonthlyStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  const fetchUsersWithClasses = async () => {
    try {
      setLoading(true);
      
      // Get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get monthly classes for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data: monthlyClasses, error: classesError } = await supabase
        .from('user_monthly_classes')
        .select('*')
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (classesError) throw classesError;

      // Combine the data
      const usersWithClasses = profiles.map(profile => ({
        ...profile,
        monthly_classes: monthlyClasses?.find(mc => mc.user_id === profile.user_id)
      }));

      setUsers(usersWithClasses);
    } catch (error) {
      console.error('Error fetching users with classes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClasses = async (userId: string, change: number) => {
    try {
      const { data, error } = await supabase.rpc('admin_update_user_classes', {
        target_user_id: userId,
        class_change: change
      });

      if (error) throw error;

      toast({
        title: "Clases actualizadas",
        description: `Se han ${change > 0 ? 'agregado' : 'quitado'} ${Math.abs(change)} clase(s) exitosamente`,
      });

      fetchUsersWithClasses();
      fetchMonthlyStats();
    } catch (error: any) {
      console.error('Error updating classes:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar las clases",
        variant: "destructive"
      });
    }
  };

  const handleResetUserMonthly = async (userId: string, newAmount: number = 12) => {
    try {
      const { data, error } = await supabase.rpc('admin_reset_user_monthly_classes', {
        target_user_id: userId,
        new_remaining: newAmount
      });

      if (error) throw error;

      toast({
        title: "Clases mensuales reseteadas",
        description: `Se han configurado ${newAmount} clases para el usuario`,
      });

      fetchUsersWithClasses();
      fetchMonthlyStats();
    } catch (error: any) {
      console.error('Error resetting monthly classes:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron resetear las clases mensuales",
        variant: "destructive"
      });
    }
  };

  const handleAdvanceToNextMonth = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_advance_all_to_next_month');

      if (error) throw error;

      toast({
        title: "Mes avanzado",
        description: `Todos los usuarios han sido configurados para el próximo mes con 12 clases`,
      });

      fetchUsersWithClasses();
      fetchMonthlyStats();
    } catch (error: any) {
      console.error('Error advancing month:', error);
      toast({
        title: "Error", 
        description: error.message || "No se pudo avanzar el mes",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Cargando gestión de clases...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Statistics Card */}
      {monthlyStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estadísticas Mensuales - {monthlyStats.current_month}/{monthlyStats.current_year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{monthlyStats.total_users}</div>
                <div className="text-sm text-muted-foreground">Total Usuarios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{monthlyStats.users_with_classes}</div>
                <div className="text-sm text-muted-foreground">Con Clases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{monthlyStats.users_without_classes}</div>
                <div className="text-sm text-muted-foreground">Sin Clases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{Number(monthlyStats.average_remaining).toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Promedio Restante</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Avanzar a Próximo Mes
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Avanzar a próximo mes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción creará registros de 12 clases para todos los usuarios en el próximo mes.
                      Los usuarios que ya tengan registro para el próximo mes no se verán afectados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAdvanceToNextMonth}>
                      Confirmar Avance
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" onClick={() => { fetchUsersWithClasses(); fetchMonthlyStats(); }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar Datos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Clases Mensual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Clases Restantes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Gestión Individual</TableHead>
                  <TableHead>Gestión Mensual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const remainingClasses = user.monthly_classes?.remaining_classes ?? 12;
                  const hasClasses = remainingClasses > 0;
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <div className="text-xl font-bold">
                          {remainingClasses}/12
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={hasClasses ? "default" : "destructive"}>
                          {hasClasses ? "Activo" : "Sin clases"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateClasses(user.user_id, 1)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            +1
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateClasses(user.user_id, 5)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            +5
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateClasses(user.user_id, -1)}
                            disabled={remainingClasses === 0}
                            className="flex items-center gap-1"
                          >
                            <Minus className="h-3 w-3" />
                            -1
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateClasses(user.user_id, -5)}
                            disabled={remainingClasses < 5}
                            className="flex items-center gap-1"
                          >
                            <Minus className="h-3 w-3" />
                            -5
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleResetUserMonthly(user.user_id, 12)}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            12/12
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleResetUserMonthly(user.user_id, 13)}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            13/13
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetUserMonthly(user.user_id, 0)}
                            className="flex items-center gap-1 text-red-600"
                          >
                            <Minus className="h-3 w-3" />
                            0/12
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron usuarios
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassManagement;