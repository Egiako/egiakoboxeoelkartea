import { QueryClient } from "@tanstack/react-query";

/**
 * Configuración optimizada del QueryClient para React Query
 * - staleTime: Datos considerados frescos durante 5 minutos
 * - retry: Solo 1 reintento en caso de error
 * - refetchOnWindowFocus: Desactivado para evitar refetches innecesarios
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
