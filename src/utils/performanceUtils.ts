/**
 * Utilidades para optimizar el rendimiento y evitar forced reflows
 */

// Batch de lecturas del DOM para evitar forced reflows
export class DOMBatcher {
  private readCallbacks: Array<() => void> = [];
  private writeCallbacks: Array<() => void> = [];
  private scheduled = false;

  read(callback: () => void) {
    this.readCallbacks.push(callback);
    this.schedule();
  }

  write(callback: () => void) {
    this.writeCallbacks.push(callback);
    this.schedule();
  }

  private schedule() {
    if (this.scheduled) return;
    this.scheduled = true;

    requestAnimationFrame(() => {
      // Primero todas las lecturas
      const reads = this.readCallbacks;
      this.readCallbacks = [];

      reads.forEach((callback) => callback());

      // Luego todas las escrituras
      const writes = this.writeCallbacks;
      this.writeCallbacks = [];

      writes.forEach((callback) => callback());

      this.scheduled = false;
    });
  }
}

export const domBatcher = new DOMBatcher();

// Hook para medir elementos sin causar reflow
export const useMeasure = () => {
  const measure = (element: HTMLElement) => {
    return new Promise<DOMRect>((resolve) => {
      domBatcher.read(() => {
        resolve(element.getBoundingClientRect());
      });
    });
  };

  return measure;
};

// Debounce para eventos de scroll/resize
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// RAF throttle para animaciones
export const rafThrottle = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => void) => {
  let rafId: number | null = null;

  return (...args: Parameters<T>) => {
    if (rafId !== null) return;
    
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
};
