import { useEffect } from 'react';

/**
 * Hook para actualizar dinámicamente el título de la página (SEO)
 * @param title - Título específico de la página
 * @param includeBase - Si se debe incluir el nombre del sitio (default: true)
 */
export const usePageTitle = (title: string, includeBase = true) => {
  useEffect(() => {
    const baseTitle = 'EgiaK.O. Boxeo elkartea';
    document.title = includeBase ? `${title} | ${baseTitle}` : title;
    
    // Actualizar meta description si existe
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && title) {
      const descriptions: Record<string, string> = {
        'Inicio': 'Gimnasio de boxeo en Donostia. Clases para todos los niveles, entrenadores titulados. Técnica, fuerza y disciplina.',
        'Sobre Nosotros': 'Conoce nuestro equipo de entrenadores certificados y las instalaciones profesionales de Egia K.O. Boxeo Elkartea.',
        'Horarios': 'Consulta los horarios de clases de boxeo en Donostia. Clases para principiantes, intermedios y avanzados.',
        'Precios': 'Tarifas y precios de membresías en Egia K.O. Boxeo Elkartea. Planes mensuales flexibles y sin permanencia.',
        'Regístrate': 'Únete a Egia K.O. Boxeo Elkartea. Regístrate online y comienza tu entrenamiento de boxeo en Donostia.',
      };
      
      if (descriptions[title]) {
        metaDescription.setAttribute('content', descriptions[title]);
      }
    }
  }, [title, includeBase]);
};
