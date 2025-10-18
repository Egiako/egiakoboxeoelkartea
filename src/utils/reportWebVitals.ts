import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

/**
 * Web Vitals reporting para monitorear rendimiento
 * Métricas monitorizadas:
 * - CLS (Cumulative Layout Shift): Estabilidad visual
 * - INP (Interaction to Next Paint): Interactividad (reemplaza FID en web-vitals v4)
 * - FCP (First Contentful Paint): Velocidad de carga inicial
 * - LCP (Largest Contentful Paint): Velocidad de carga del contenido principal
 * - TTFB (Time to First Byte): Tiempo de respuesta del servidor
 */

const logMetric = (metric: Metric) => {
  // En desarrollo, mostrar en consola
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id
    });
  }
  
  // En producción, aquí podrías enviar a analytics
  // Por ejemplo: analytics.track('web-vital', { ...metric });
};

export const reportWebVitals = () => {
  onCLS(logMetric);
  onINP(logMetric);
  onFCP(logMetric);
  onLCP(logMetric);
  onTTFB(logMetric);
};
