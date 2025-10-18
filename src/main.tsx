import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App.tsx";
import "./index.css";
import { loadFonts } from "./utils/fontLoader";
import { reportWebVitals } from "./utils/reportWebVitals";

// Cargar fuentes de forma diferida
loadFonts();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Monitorear Web Vitals para optimización de rendimiento
reportWebVitals();
