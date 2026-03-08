/**
 * AdminLayout - Shared layout for admin pages with auth check
 * Features sidebar navigation and authentication verification
 */

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ArrowLeft,
  Menu,
  LogOut
} from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Navigation items
const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
];

export const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authHeader = sessionStorage.getItem('adminAuth');
    
    if (!authHeader) {
      navigate('/admin');
      return;
    }

    try {
      await axios.get(`${API}/admin/verify`, {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      sessionStorage.removeItem('adminAuth');
      sessionStorage.removeItem('adminUsername');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminUsername');
    toast.success('Logged out successfully');
    navigate('/admin');
  };

  // Check if nav item is active
  const isActive = (href) => {
    return location.pathname === href;
  };

  // Get auth header for API calls
  const getAuthHeader = () => {
    const authHeader = sessionStorage.getItem('adminAuth');
    return authHeader ? { Authorization: `Basic ${authHeader}` } : {};
  };

  // Navigation component
  const Navigation = ({ onItemClick }) => (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          onClick={onItemClick}
          className={`admin-nav-item flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            isActive(item.href)
              ? 'active bg-zinc-100 text-zinc-900 font-medium'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
          data-testid={`admin-nav-${item.name.toLowerCase()}`}
        >
          <item.icon className="h-4 w-4" strokeWidth={1.5} />
          {item.name}
        </Link>
      ))}
    </nav>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white" data-testid="admin-layout">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 border-b border-zinc-200">
                  <h2 className="font-display text-lg font-bold text-zinc-900">
                    Admin Panel
                  </h2>
                </div>
                <div className="p-4">
                  <Navigation onItemClick={() => setMobileNavOpen(false)} />
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/admin/dashboard" className="font-display text-lg font-bold text-zinc-900">
              RESELL Admin
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-zinc-500">
              {sessionStorage.getItem('adminUsername')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 text-zinc-600 hover:text-zinc-900"
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              data-testid="back-to-store"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Store</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 admin-sidebar min-h-[calc(100vh-56px)] p-4">
          <Navigation />
          <div className="absolute bottom-4 left-4 w-56">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-[calc(100vh-56px)]">
          {children}
        </main>
      </div>
    </div>
  );
};

// Export helper function to get auth header
export const getAdminAuthHeader = () => {
  const authHeader = sessionStorage.getItem('adminAuth');
  return authHeader ? { Authorization: `Basic ${authHeader}` } : {};
};
