/**
 * Header Component - Main navigation with search, cart icon
 * Features glassmorphism effect and mobile menu
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, Settings } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const Header = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const itemCount = getItemCount();

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  // Navigation links
  const navLinks = [
    { name: 'All', href: '/', category: null },
    { name: 'Clothing', href: '/?category=clothing', category: 'clothing' },
    { name: 'Footwear', href: '/?category=footwear', category: 'footwear' },
    { name: 'Accessories', href: '/?category=accessories', category: 'accessories' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-header border-b border-zinc-200" data-testid="main-header">
      <div className="px-6 md:px-12">
        {/* Main header row */}
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0" data-testid="logo-link">
            <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-zinc-900">
              RESELL
            </h1>
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center gap-8" data-testid="desktop-nav">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="ui-label text-zinc-600 hover:text-zinc-900 transition-colors"
                data-testid={`nav-link-${link.name.toLowerCase()}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 h-10 bg-zinc-50 border-zinc-200 focus:border-zinc-900"
                  data-testid="search-input"
                />
              </div>
            </form>

            {/* Admin Link */}
            <Link
              to="/admin"
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-zinc-100 transition-colors"
              data-testid="admin-link"
            >
              <Settings className="h-5 w-5 text-zinc-600" strokeWidth={1.5} />
            </Link>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-zinc-100 transition-colors"
              data-testid="cart-link"
            >
              <ShoppingBag className="h-5 w-5 text-zinc-900" strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="cart-badge" data-testid="cart-count">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="mobile-menu-toggle">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-6 mt-8">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="mobile-search-input"
                      />
                    </div>
                  </form>

                  {/* Mobile Nav Links */}
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
                        data-testid={`mobile-nav-${link.name.toLowerCase()}`}
                      >
                        {link.name}
                      </Link>
                    ))}
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                      data-testid="mobile-admin-link"
                    >
                      Admin Panel
                    </Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
