import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ApprovalGuard from "@/components/ApprovalGuard";
import ProtectedRoute from "@/components/ProtectedRoute";

// Páginas críticas (carga inmediata)
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

// Páginas públicas (lazy loading para optimizar bundle inicial)
const SobreNosotros = lazy(() => import("@/pages/SobreNosotros"));
const Precios = lazy(() => import("@/pages/Precios"));
const Registrate = lazy(() => import("@/pages/Registrate"));
const PoliticaPrivacidad = lazy(() => import("@/pages/PoliticaPrivacidad"));
const AvisoLegal = lazy(() => import("@/pages/AvisoLegal"));

// Páginas protegidas (lazy loading para optimizar)
const Horarios = lazy(() => import("@/pages/Horarios"));
const EventosSemana = lazy(() => import("@/pages/EventosSemana"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const TrainerPanel = lazy(() => import("@/pages/TrainerPanel"));

/**
 * Configuración de rutas de la aplicación
 * - Rutas públicas: acceso sin autenticación
 * - Rutas protegidas: requieren aprobación del usuario
 * - Rutas admin: requieren rol de administrador
 */
export const AppRoutes = () => (
  <Routes>
    {/* Rutas públicas */}
    <Route path="/" element={<Index />} />
    <Route path="/sobre-nosotros" element={<SobreNosotros />} />
    <Route path="/precios" element={<Precios />} />
    <Route path="/registrate" element={<Registrate />} />
    <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
    <Route path="/aviso-legal" element={<AvisoLegal />} />

    {/* Rutas protegidas - requieren autenticación y aprobación */}
    <Route
      path="/horarios"
      element={
        <ApprovalGuard>
          <Horarios />
        </ApprovalGuard>
      }
    />
    <Route
      path="/eventos-semana"
      element={
        <ApprovalGuard>
          <EventosSemana />
        </ApprovalGuard>
      }
    />
    <Route
      path="/trainer"
      element={
        <ApprovalGuard>
          <TrainerPanel />
        </ApprovalGuard>
      }
    />

    {/* Ruta de administración - requiere rol admin */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute requireAdmin>
          <AdminPanel />
        </ProtectedRoute>
      }
    />

    {/* Ruta 404 - debe ir al final */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);
