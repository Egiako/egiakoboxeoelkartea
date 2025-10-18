import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  layout?: 'full' | 'half' | 'third' | 'quarter';
  fallback?: string;
}

/**
 * Componente Image optimizado con:
 * - Lazy loading automático
 * - Prioridad configurable para imágenes críticas
 * - Placeholder mientras carga
 * - Fallback en caso de error
 */
const Image = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  layout = 'full',
  fallback = '/placeholder.svg'
}: ImageProps) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const getSizes = () => {
    switch(layout) {
      case 'full':
        return '100vw';
      case 'half':
        return '(max-width: 768px) 100vw, 50vw';
      case 'third':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
      case 'quarter':
        return '(max-width: 768px) 50vw, 25vw';
      default:
        return '100vw';
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder mientras carga */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      <img
        src={error ? fallback : src}
        sizes={getSizes()}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className
        )}
      />
    </div>
  );
};

export default Image;
