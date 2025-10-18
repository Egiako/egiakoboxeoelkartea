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

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Monitorear Web Vitals para optimización de rendimiento
reportWebVitals();
