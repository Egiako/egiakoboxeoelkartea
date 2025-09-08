import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Users, RefreshCw, Edit } from 'lucide-react';

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
  max_monthly_classes: number;
  month: number;
  year: number;
}

interface UserWithClasses extends UserProfile {
  monthly_classes?: MonthlyClasses;
}

const ClassManagement = () => {
  const [users, setUsers] = useState<UserWithClasses[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserWithClasses | null>(null);
  const [newRemaining, setNewRemaining] = useState<number>(0);
  const [newMax, setNewMax] = useState<number>(12);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsersWithClasses();
  }, []);

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
    } catch (error: any) {
      console.error('Error updating classes:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar las clases",
        variant: "destructive"
      });
    }
  };

  const handleUpdateLimits = async () => {
    if (!editingUser) return;

    try {
      const { data, error } = await supabase.rpc('admin_update_user_monthly_limits', {
        target_user_id: editingUser.user_id,
        new_remaining: newRemaining,
        new_max: newMax
      });

      if (error) throw error;

      toast({
        title: "Límites actualizados",
        description: `Se han configurado ${newRemaining}/${newMax} clases para el usuario`,
      });

      setEditingUser(null);
      fetchUsersWithClasses();
    } catch (error: any) {
      console.error('Error updating limits:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar los límites",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (user: UserWithClasses) => {
    setEditingUser(user);
    setNewRemaining(user.monthly_classes?.remaining_classes ?? 12);
    setNewMax(user.monthly_classes?.max_monthly_classes ?? 12);
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
            <Button variant="outline" onClick={fetchUsersWithClasses}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Clases Restantes/Tope</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ajustes Rápidos</TableHead>
                  <TableHead>Configuración</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const remainingClasses = user.monthly_classes?.remaining_classes ?? 12;
                  const maxClasses = user.monthly_classes?.max_monthly_classes ?? 12;
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
                          {remainingClasses}/{maxClasses}
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
                            onClick={() => handleUpdateClasses(user.user_id, -1)}
                            disabled={remainingClasses === 0}
                            className="flex items-center gap-1"
                          >
                            <Minus className="h-3 w-3" />
                            -1
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Configurar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Configurar Clases - {user.first_name} {user.last_name}</DialogTitle>
                              <DialogDescription>
                                Ajusta las clases restantes y el tope mensual para este usuario.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="remaining" className="text-right">
                                  Clases Restantes
                                </Label>
                                <Input
                                  id="remaining"
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={newRemaining}
                                  onChange={(e) => setNewRemaining(parseInt(e.target.value) || 0)}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="maxClasses" className="text-right">
                                  Tope Mensual
                                </Label>
                                <Input
                                  id="maxClasses"
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={newMax}
                                  onChange={(e) => setNewMax(parseInt(e.target.value) || 12)}
                                  className="col-span-3"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleUpdateLimits}>Guardar Cambios</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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