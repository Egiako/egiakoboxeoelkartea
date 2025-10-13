import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Language = 'es' | 'en';

interface TrainerTranslations {
  trainerPanel: {
    title: string;
    subtitle: string;
    bookingsTab: string;
    calendarTab: string;
    verifyingPermissions: string;
    noPermission: string;
  };
  bookingManagement: {
    title: string;
    loading: string;
    noBookings: string;
    noBookingsMessage: string;
    attended: string;
    notAttended: string;
    changeToAttended: string;
    changeToNotAttended: string;
    updating: string;
    hasClasses: string;
    noClasses: string;
  };
  scheduleManagement: {
    title: string;
    subtitle: string;
    loading: string;
    sporadicTab: string;
    periodicTab: string;
    manageTab: string;
    exceptionsTab: string;
    addSporadic: string;
    sporadicDescription: string;
    addPeriodic: string;
    periodicDescription: string;
    classTitle: string;
    instructor: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: string;
    notes: string;
    notesPlaceholder: string;
    create: string;
    add: string;
    cancel: string;
    required: string;
    optional: string;
    selectDays: string;
    selectDaysHelp: string;
    periodicClasses: string;
    periodicClassesDesc: string;
    sporadicClasses: string;
    sporadicClassesDesc: string;
    day: string;
    schedule: string;
    maxStudents: string;
    status: string;
    actions: string;
    active: string;
    inactive: string;
    activate: string;
    deactivate: string;
    delete: string;
    confirmDeletePeriodic: string;
    confirmDeletePeriodicMessage: string;
    confirmDeleteSporadic: string;
    confirmDeleteSporadicMessage: string;
    noPeriodicClasses: string;
    noSporadicClasses: string;
    successAdded: string;
    successDeleted: string;
    successToggled: string;
    errorRequired: string;
    errorGeneric: string;
    unassigned: string;
  };
}

const translations: Record<Language, TrainerTranslations> = {
  es: {
    trainerPanel: {
      title: 'Panel de Entrenador',
      subtitle: 'Gestiona usuarios activos y asistencia a clases',
      bookingsTab: 'Gestión de Asistencia',
      calendarTab: 'Gestión de Horarios',
      verifyingPermissions: 'Verificando permisos...',
      noPermission: 'No tienes permisos para acceder al panel de entrenador.',
    },
    bookingManagement: {
      title: 'Gestión de Asistencia',
      loading: 'Cargando reservas...',
      noBookings: 'No hay reservas',
      noBookingsMessage: 'No hay reservas confirmadas para mostrar',
      attended: 'Asistió',
      notAttended: 'No asistió',
      changeToAttended: 'Marcar como asistido',
      changeToNotAttended: 'Marcar como no asistido',
      updating: 'Actualizando...',
      hasClasses: 'Tiene clases disponibles',
      noClasses: 'Sin clases disponibles',
    },
    scheduleManagement: {
      title: 'Gestión de Horarios',
      subtitle: 'Administra clases esporádicas, periódicas y suprime clases existentes',
      loading: 'Cargando gestión de horarios...',
      sporadicTab: 'Clases Esporádicas',
      periodicTab: 'Clases Periódicas',
      manageTab: 'Gestionar Clases',
      exceptionsTab: 'Excepciones',
      addSporadic: 'Agregar Clase Esporádica',
      sporadicDescription: 'Añadir una clase puntual en cualquier día y hora',
      addPeriodic: 'Agregar Clase Periódica',
      periodicDescription: 'Añadir una clase fija que se repita cada semana',
      classTitle: 'Título',
      instructor: 'Instructor',
      date: 'Fecha',
      startTime: 'Hora inicio',
      endTime: 'Hora fin',
      capacity: 'Máximo estudiantes',
      notes: 'Notas adicionales',
      notesPlaceholder: 'Información adicional sobre la clase...',
      create: 'Crear',
      add: 'Agregar',
      cancel: 'Cancelar',
      required: '*',
      optional: '(opcional)',
      selectDays: 'Días de la semana',
      selectDaysHelp: 'Selecciona uno o varios días para la clase',
      periodicClasses: 'Clases Periódicas',
      periodicClassesDesc: 'Activar o desactivar clases que se repiten semanalmente',
      sporadicClasses: 'Clases Esporádicas',
      sporadicClassesDesc: 'Gestionar clases puntuales programadas',
      day: 'Día',
      schedule: 'Horario',
      maxStudents: 'Máx. estudiantes',
      status: 'Estado',
      actions: 'Acciones',
      active: 'Activa',
      inactive: 'Desactivada',
      activate: 'Activar',
      deactivate: 'Desactivar',
      delete: 'Eliminar',
      confirmDeletePeriodic: '¿Eliminar clase periódica?',
      confirmDeletePeriodicMessage: '¿Estás seguro de que quieres eliminar permanentemente esta clase? Esta acción no se puede deshacer y se cancelarán todas las reservas futuras.',
      confirmDeleteSporadic: '¿Eliminar clase esporádica?',
      confirmDeleteSporadicMessage: '¿Estás seguro de que quieres eliminar esta clase? Esta acción no se puede deshacer.',
      noPeriodicClasses: 'No hay clases periódicas configuradas',
      noSporadicClasses: 'No hay clases esporádicas programadas',
      successAdded: 'Clase agregada correctamente',
      successDeleted: 'Clase eliminada correctamente',
      successToggled: 'Clase modificada correctamente',
      errorRequired: 'Por favor completa todos los campos obligatorios',
      errorGeneric: 'Ocurrió un error',
      unassigned: 'Sin asignar',
    },
  },
  en: {
    trainerPanel: {
      title: 'Trainer Panel',
      subtitle: 'Manage active users and class attendance',
      bookingsTab: 'Attendance Management',
      calendarTab: 'Schedule Management',
      verifyingPermissions: 'Verifying permissions...',
      noPermission: 'You do not have permission to access the trainer panel.',
    },
    bookingManagement: {
      title: 'Attendance Management',
      loading: 'Loading bookings...',
      noBookings: 'No bookings',
      noBookingsMessage: 'No confirmed bookings to display',
      attended: 'Attended',
      notAttended: 'Did not attend',
      changeToAttended: 'Mark as attended',
      changeToNotAttended: 'Mark as not attended',
      updating: 'Updating...',
      hasClasses: 'Has classes available',
      noClasses: 'No classes available',
    },
    scheduleManagement: {
      title: 'Schedule Management',
      subtitle: 'Manage sporadic and recurring classes',
      loading: 'Loading schedule management...',
      sporadicTab: 'Sporadic Classes',
      periodicTab: 'Recurring Classes',
      manageTab: 'Manage Classes',
      exceptionsTab: 'Exceptions',
      addSporadic: 'Add Sporadic Class',
      sporadicDescription: 'Add a one-time class on any day and time',
      addPeriodic: 'Add Recurring Class',
      periodicDescription: 'Add a fixed class that repeats weekly',
      classTitle: 'Title',
      instructor: 'Instructor',
      date: 'Date',
      startTime: 'Start time',
      endTime: 'End time',
      capacity: 'Maximum students',
      notes: 'Additional notes',
      notesPlaceholder: 'Additional information about the class...',
      create: 'Create',
      add: 'Add',
      cancel: 'Cancel',
      required: '*',
      optional: '(optional)',
      selectDays: 'Days of the week',
      selectDaysHelp: 'Select one or more days for the class',
      periodicClasses: 'Recurring Classes',
      periodicClassesDesc: 'Activate or deactivate classes that repeat weekly',
      sporadicClasses: 'Sporadic Classes',
      sporadicClassesDesc: 'Manage scheduled one-time classes',
      day: 'Day',
      schedule: 'Schedule',
      maxStudents: 'Max. students',
      status: 'Status',
      actions: 'Actions',
      active: 'Active',
      inactive: 'Inactive',
      activate: 'Activate',
      deactivate: 'Deactivate',
      delete: 'Delete',
      confirmDeletePeriodic: 'Delete recurring class?',
      confirmDeletePeriodicMessage: 'Are you sure you want to permanently delete this class? This action cannot be undone and all future bookings will be cancelled.',
      confirmDeleteSporadic: 'Delete sporadic class?',
      confirmDeleteSporadicMessage: 'Are you sure you want to delete this class? This action cannot be undone.',
      noPeriodicClasses: 'No recurring classes configured',
      noSporadicClasses: 'No sporadic classes scheduled',
      successAdded: 'Class added successfully',
      successDeleted: 'Class deleted successfully',
      successToggled: 'Class updated successfully',
      errorRequired: 'Please complete all required fields',
      errorGeneric: 'An error occurred',
      unassigned: 'Unassigned',
    },
  },
};

export const useTrainerLanguage = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>('es');

  useEffect(() => {
    const detectLanguage = async () => {
      if (!user) {
        setLanguage('es');
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', user.id)
          .single();

        if (profile?.email === 'egiakojw@gmail.com') {
          setLanguage('en');
        } else {
          setLanguage('es');
        }
      } catch (error) {
        console.error('Error detecting language:', error);
        setLanguage('es');
      }
    };

    detectLanguage();
  }, [user]);

  return {
    language,
    t: translations[language],
  };
};
