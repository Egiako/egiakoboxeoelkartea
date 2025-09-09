import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin, isTrainer } = useUserRole();

  const navItems = [
    { name: 'Inicio', href: '/' },
    { name: 'Sobre nosotros', href: '/sobre-nosotros' },
    { name: 'Horarios', href: '/horarios' },
    { name: 'Precios', href: '/precios' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="bg-boxing-black/95 backdrop-blur-sm border-b border-boxing-red/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="font-oswald font-bold text-2xl hover:opacity-80 transition-opacity">
            <span className="text-boxing-white">Egia</span>
            <span className="text-boxing-red">K.O.</span>
            <span className="text-boxing-white"> Boxeo Elkartea</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-inter font-medium text-sm uppercase tracking-wide transition-colors ${
                  isActive(item.href)
                    ? 'text-boxing-red border-b-2 border-boxing-red pb-1'
                    : 'text-boxing-white hover:text-boxing-red'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {!user ? (
              <Link 
                to="/registrate" 
                className={`font-inter font-medium text-sm uppercase tracking-wide transition-colors ${
                  location.pathname === '/registrate' ? 'text-boxing-red border-b-2 border-boxing-red pb-1' : 'text-boxing-white hover:text-boxing-red'
                }`}
              >
                Regístrate
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`font-inter font-medium text-sm uppercase tracking-wide transition-colors ${
                      location.pathname === '/admin' ? 'text-boxing-red border-b-2 border-boxing-red pb-1' : 'text-boxing-white hover:text-boxing-red'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Admin
                    </div>
                  </Link>
                )}
                {isTrainer && (
                  <Link 
                    to="/trainer" 
                    className={`font-inter font-medium text-sm uppercase tracking-wide transition-colors ${
                      location.pathname === '/trainer' ? 'text-boxing-red border-b-2 border-boxing-red pb-1' : 'text-boxing-white hover:text-boxing-red'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Entrenador
                    </div>
                  </Link>
                )}
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="text-boxing-white border-boxing-white hover:bg-boxing-white hover:text-boxing-black"
                >
                  Cerrar Sesión
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-boxing-white hover:text-boxing-red hover:bg-boxing-red/10"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-boxing-red/20 py-4">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`font-inter font-medium text-sm uppercase tracking-wide transition-colors px-4 py-2 ${
                    isActive(item.href)
                      ? 'text-boxing-red bg-boxing-red/10 rounded-lg'
                      : 'text-boxing-white hover:text-boxing-red'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {!user ? (
                <Link 
                  to="/registrate" 
                  onClick={() => setIsOpen(false)}
                  className={`font-inter font-medium text-sm uppercase tracking-wide transition-colors px-4 py-2 ${
                    location.pathname === '/registrate' ? 'text-boxing-red bg-boxing-red/10 rounded-lg' : 'text-boxing-white hover:text-boxing-red'
                  }`}
                >
                  Regístrate
                </Link>
              ) : (
                <>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      onClick={() => setIsOpen(false)}
                      className={`font-inter font-medium text-sm uppercase tracking-wide transition-colors px-4 py-2 ${
                        location.pathname === '/admin' ? 'text-boxing-red bg-boxing-red/10 rounded-lg' : 'text-boxing-white hover:text-boxing-red'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Admin
                      </div>
                    </Link>
                  )}
                  {isTrainer && (
                    <Link 
                      to="/trainer" 
                      onClick={() => setIsOpen(false)}
                      className={`font-inter font-medium text-sm uppercase tracking-wide transition-colors px-4 py-2 ${
                        location.pathname === '/trainer' ? 'text-boxing-red bg-boxing-red/10 rounded-lg' : 'text-boxing-white hover:text-boxing-red'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Entrenador
                      </div>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="text-left font-inter font-medium text-sm uppercase tracking-wide transition-colors px-4 py-2 text-boxing-white hover:text-boxing-red"
                  >
                    Cerrar Sesión
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;