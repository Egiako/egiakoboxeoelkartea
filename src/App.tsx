import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthRedirect from "@/components/AuthRedirect";
import ApprovalGuard from "@/components/ApprovalGuard";
import Index from "./pages/Index";
import SobreNosotros from "./pages/SobreNosotros";
import Precios from "./pages/Precios";
import Registrate from "./pages/Registrate";
import Horarios from "./pages/Horarios";
import EventosSemana from "./pages/EventosSemana";
import PoliticaPrivacidad from "./pages/PoliticaPrivacidad";
import AvisoLegal from "./pages/AvisoLegal";
import AdminPanel from "./pages/AdminPanel";
import TrainerPanel from "./pages/TrainerPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthRedirect />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sobre-nosotros" element={<SobreNosotros />} />
            <Route path="/precios" element={<Precios />} />
            <Route path="/registrate" element={<Registrate />} />
            <Route path="/horarios" element={<ApprovalGuard><Horarios /></ApprovalGuard>} />
            <Route path="/eventos-semana" element={<ApprovalGuard><EventosSemana /></ApprovalGuard>} />
            <Route path="/admin" element={<ApprovalGuard><AdminPanel /></ApprovalGuard>} />
            <Route path="/trainer" element={<ApprovalGuard><TrainerPanel /></ApprovalGuard>} />
            <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
            <Route path="/aviso-legal" element={<AvisoLegal />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
