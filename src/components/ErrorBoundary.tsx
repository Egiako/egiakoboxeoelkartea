import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, message: error?.message ?? String(error) };
  }

  componentDidCatch(error: any, info: any) {
    // Log detallado en producción para diagnosticar pantallas en blanco
    console.error('ErrorBoundary caught an error:', { error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center p-6">
          <section className="max-w-md text-center space-y-3">
            <h1 className="text-2xl font-bold text-destructive">Se ha producido un error</h1>
            <p className="text-muted-foreground">Intenta recargar la página. Si persiste, avísanos.</p>
            {this.state.message && (
              <p className="text-xs text-muted-foreground/70">Detalle: {this.state.message}</p>
            )}
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
