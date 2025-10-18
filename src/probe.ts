// Small probe to diagnose production blank screen
(async () => {
  const log = (...args: any[]) => { try { console.log('[Probe]', ...args); } catch {} };
  const show = (html: string) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:99999;background:#111;color:#fff;padding:8px 10px;border-radius:6px;font-family:system-ui;font-size:12px;max-width:90vw;opacity:.9;white-space:pre-wrap;';
    el.innerHTML = html;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 12000);
  };
  try {
    const React = await import('react');
    const ReactDom = await import('react-dom/client');
    log('React ok?', !!React, 'version?', (React as any).version, 'createContext?', typeof (React as any).createContext);
    log('ReactDOM ok?', !!ReactDom);
    (window as any).__probeReactOK = !!(React as any).createContext;
    (window as any).__probeReactVersion = (React as any).version;
    if (!(window as any).__probeReactOK) {
      show('Diagnóstico: React no cargó correctamente.');
    }
  } catch (e: any) {
    log('Probe import error', e);
    show('Error al importar React: ' + (e?.message || e));
  }
})();
