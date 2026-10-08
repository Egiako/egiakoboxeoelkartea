import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';

const days = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' }, { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' }, { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' }, { value: 0, label: 'Domingo' },
];

type Props =
  | { kind: 'periodic'; item: { id: string; title: string; instructor: string | null; day_of_week: number; start_time: string; end_time: string; max_students: number }; onSaved: () => void }
  | { kind: 'sporadic'; item: { id: string; title: string; instructor_name: string; class_date: string; start_time: string; end_time: string; max_students: number; notes: string | null }; onSaved: () => void };

export const EditClassDialog = (props: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!open) return;
    const i: any = props.item;
    setForm({
      title: i.title,
      instructor: props.kind === 'periodic' ? i.instructor || '' : i.instructor_name,
      day: i.day_of_week,
      date: i.class_date,
      start: i.start_time?.slice(0, 5),
      end: i.end_time?.slice(0, 5),
      max: i.max_students,
      notes: i.notes || '',
    });
  }, [open]);

  const save = async () => {
    if (!form.title || !form.start || !form.end || form.start >= form.end) {
      toast({ title: 'Error', description: 'Revisa el título y que la hora de fin sea posterior al inicio.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const max = Math.max(1, Number(form.max) || 10);
    const { error } = props.kind === 'periodic'
      ? await supabase.from('classes').update({
          title: form.title, instructor: form.instructor || null, day_of_week: Number(form.day),
          start_time: form.start, end_time: form.end, max_students: max,
        }).eq('id', props.item.id)
      : await supabase.from('manual_class_schedules').update({
          title: form.title, instructor_name: form.instructor || 'Sin asignar', class_date: form.date,
          start_time: form.start, end_time: form.end, max_students: max, notes: form.notes || null,
        }).eq('id', props.item.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Éxito', description: 'Clase actualizada correctamente' });
    setOpen(false);
    props.onSaved();
  };

  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm"><Pencil className="h-3 w-3 mr-1" />Editar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar clase {props.kind === 'periodic' ? 'periódica' : 'esporádica'}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Título</Label><Input value={form.title || ''} onChange={set('title')} /></div>
          <div><Label>Instructor</Label><Input value={form.instructor || ''} onChange={set('instructor')} /></div>
          {props.kind === 'periodic' ? (
            <div><Label>Día</Label>
              <Select value={String(form.day ?? '')} onValueChange={(v) => setForm((f: any) => ({ ...f, day: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{days.map(d => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <div><Label>Fecha</Label><Input type="date" value={form.date || ''} onChange={set('date')} /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Inicio</Label><Input type="time" value={form.start || ''} onChange={set('start')} /></div>
            <div><Label>Fin</Label><Input type="time" value={form.end || ''} onChange={set('end')} /></div>
          </div>
          <div><Label>Máx. estudiantes</Label><Input type="number" min={1} value={form.max ?? ''} onChange={set('max')} /></div>
          {props.kind === 'sporadic' && (
            <div><Label>Notas</Label><Textarea value={form.notes || ''} onChange={set('notes')} rows={2} /></div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
