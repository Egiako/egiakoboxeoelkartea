import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App.tsx";
import "./index.css";
import { loadFonts } from "./utils/fontLoader";
import { reportWebVitals } from "./utils/reportWebVitals";

// Cargar fuentes de forma diferida
loadFonts();

// Registro de errores global para diagnosticar pantallas en blanco en producción
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error || e.message || e);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

try {
  createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
} catch (e) {
  console.error('App bootstrap error:', e);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<main style="padding:16px;font-family:system-ui"><h1>Se produjo un error al iniciar la aplicación.</h1><p>Actualiza la página o vuelve más tarde.</p></main>';
  }
}


// Monitorear Web Vitals para optimización de rendimiento
reportWebVitals();
