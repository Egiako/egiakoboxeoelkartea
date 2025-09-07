import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Inicio', href: '/' },
    { name: 'Sobre nosotros', href: '/sobre-nosotros' },
    { name: 'Precios', href: '/precios' },
    { name: 'Regístrate', href: '/registrate' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="bg-boxing-black/95 backdrop-blur-sm border-b border-boxing-red/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="font-oswald font-bold text-2xl text-boxing-white hover:text-boxing-red transition-colors">
            EgiaK.O. <span className="text-boxing-red">Boxeo</span>
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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;