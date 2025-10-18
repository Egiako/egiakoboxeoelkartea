/**
 * Carga diferida de fuentes de Google para mejorar FCP
 */
export const loadFonts = () => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap';
  
  // Usar requestIdleCallback para cargar fuentes cuando el navegador esté inactivo
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      document.head.appendChild(link);
    });
  } else {
    // Fallback para navegadores que no soportan requestIdleCallback
    setTimeout(() => {
      document.head.appendChild(link);
    }, 1);
  }
};
