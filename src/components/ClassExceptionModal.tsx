import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useClassExceptions } from '@/hooks/useClassExceptions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClassExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  classTitle: string;
  date: Date;
  currentStartTime: string;
  currentEndTime: string;
  currentInstructor?: string;
  currentMaxStudents: number;
  onSuccess?: () => void;
}

export const ClassExceptionModal = ({
  isOpen,
  onClose,
  classId,
  classTitle,
  date,
  currentStartTime,
  currentEndTime,
  currentInstructor,
  currentMaxStudents,
  onSuccess
}: ClassExceptionModalProps) => {
  const [startTime, setStartTime] = useState(currentStartTime);
  const [endTime, setEndTime] = useState(currentEndTime);
  const [instructor, setInstructor] = useState(currentInstructor || '');
  const [maxStudents, setMaxStudents] = useState(currentMaxStudents);
  const [notes, setNotes] = useState('');
  const [migrateBookings, setMigrateBookings] = useState(true);
  const [action, setAction] = useState<'edit' | 'cancel'>('edit');

  const { createException, loading } = useClassExceptions();

  const handleSubmit = async () => {
    try {
      const dateString = format(date, 'yyyy-MM-dd');

      if (action === 'cancel') {
        await createException({
          classId,
          exceptionDate: dateString,
          isCancelled: true,
          notes: notes || 'Clase cancelada'
        });
      } else {
        // Verificar que se hayan hecho cambios
        const hasChanges = 
          startTime !== currentStartTime ||
          endTime !== currentEndTime ||
          instructor !== (currentInstructor || '') ||
          maxStudents !== currentMaxStudents;

        if (!hasChanges) {
          throw new Error('No se han realizado cambios');
        }

        await createException({
          classId,
          exceptionDate: dateString,
          overrideStartTime: startTime !== currentStartTime ? startTime : undefined,
          overrideEndTime: endTime !== currentEndTime ? endTime : undefined,
          overrideInstructor: instructor !== (currentInstructor || '') ? instructor : undefined,
          overrideMaxStudents: maxStudents !== currentMaxStudents ? maxStudents : undefined,
          migrateBookings,
          notes
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating exception:', error);
    }
  };

  const handleClose = () => {
    setStartTime(currentStartTime);
    setEndTime(currentEndTime);
    setInstructor(currentInstructor || '');
    setMaxStudents(currentMaxStudents);
    setNotes('');
    setMigrateBookings(true);
    setAction('edit');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar ocurrencia de clase</DialogTitle>
          <DialogDescription>
            {classTitle} - {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Acción</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={action === 'edit' ? 'default' : 'outline'}
                onClick={() => setAction('edit')}
                className="flex-1"
              >
                Editar esta fecha
              </Button>
              <Button
                type="button"
                variant={action === 'cancel' ? 'destructive' : 'outline'}
                onClick={() => setAction('cancel')}
                className="flex-1"
              >
                Cancelar esta fecha
              </Button>
            </div>
          </div>

          {action === 'edit' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora de inicio</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora de fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="Nombre del instructor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Capacidad máxima</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(parseInt(e.target.value) || currentMaxStudents)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="migrateBookings"
                  checked={migrateBookings}
                  onCheckedChange={(checked) => setMigrateBookings(checked as boolean)}
                />
                <Label
                  htmlFor="migrateBookings"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Migrar reservas existentes a la nueva hora si es posible
                </Label>
              </div>
            </>
          ) : (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                ⚠️ Esta acción cancelará todas las reservas para esta fecha. Los usuarios
                serán notificados y se les devolverán sus clases sin penalización.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade notas sobre esta excepción..."
              rows={3}
            />
          </div>

          <div className="p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">
              💡 Esto NO modifica la clase periódica; solo esta fecha específica.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar excepción'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
