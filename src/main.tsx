import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadFonts } from "./utils/fontLoader";
import { reportWebVitals } from "./utils/reportWebVitals";

// Cargar fuentes de forma diferida
loadFonts();

createRoot(document.getElementById("root")!).render(<App />);

// Monitorear Web Vitals para optimización de rendimiento
reportWebVitals();
