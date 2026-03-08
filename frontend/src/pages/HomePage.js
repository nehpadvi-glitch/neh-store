/**
 * HomePage - Main landing page with hero and product grid
 * Features search, category filters, and Tetris-style layout
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Hero images from design guidelines
const HERO_IMAGE = "https://images.unsplash.com/photo-1702017623971-64da69ced58f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBtaW5pbWFsaXN0aWMlMjBzdHVkaW98ZW58MHx8fHwxNzcyODk5ODEzfDA&ixlib=rb-4.1.0&q=85";

export const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // Get category from URL params
  const activeCategory = searchParams.get('category') || null;

  // Fetch products on mount and when filters change
  useEffect(() => {
    fetchProducts();
    seedProducts(); // Ensure products exist
  }, [activeCategory, searchQuery]);

  // Seed products if database is empty
  const seedProducts = async () => {
    try {
      await axios.post(`${API}/seed`);
    } catch (error) {
      console.log('Products already seeded or error:', error.message);
    }
  };

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.append('category', activeCategory);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle category filter
  const handleCategoryFilter = (category) => {
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Categories for filter
  const categories = [
    { id: null, name: 'All' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'footwear', name: 'Footwear' },
    { id: 'accessories', name: 'Accessories' },
  ];

  // Get featured products
  const featuredProducts = products.filter(p => p.is_featured).slice(0, 4);
  const newArrivals = products.filter(p => p.is_new_arrival);

  return (
    <div className="min-h-screen bg-white" data-testid="home-page">
      <Header onSearch={handleSearch} />

      {/* Hero Section */}
      <section className="hero-section relative" data-testid="hero-section">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Hero Content */}
          <div className="flex items-center px-6 md:px-12 py-16 md:py-24 lg:py-32">
            <div className="max-w-lg">
              <p className="ui-label text-zinc-500 mb-4">New Collection 2024</p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight leading-none">
                Discover Your Style
              </h1>
              <p className="mt-6 text-lg text-zinc-600 leading-relaxed">
                Premium fashion at reseller prices. Start your journey with trending styles that define you.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => handleCategoryFilter(null)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white h-12 px-8 text-sm uppercase tracking-wider font-bold btn-press"
                  data-testid="shop-now-btn"
                >
                  Shop Now
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCategoryFilter('clothing')}
                  className="border-zinc-300 hover:bg-zinc-50 h-12 px-8 text-sm uppercase tracking-wider font-bold"
                  data-testid="browse-collection-btn"
                >
                  Browse Collection
                </Button>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative h-[400px] lg:h-auto overflow-hidden">
            <img
              src={HERO_IMAGE}
              alt="Fashion Model"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/20 lg:hidden" />
          </div>
        </div>
      </section>

      {/* Category Filter Pills */}
      <section className="px-6 md:px-12 py-8 border-b border-zinc-100" data-testid="category-filter">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id || 'all'}
              onClick={() => handleCategoryFilter(cat.id)}
              className={`category-pill px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
              data-testid={`filter-${cat.name.toLowerCase()}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {!activeCategory && featuredProducts.length > 0 && (
        <section className="px-6 md:px-12 py-12" data-testid="featured-section">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-zinc-900">
              Featured
            </h2>
            <Button
              variant="ghost"
              className="text-zinc-600 hover:text-zinc-900"
              onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
            >
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Tetris Grid for Featured */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            {featuredProducts[0] && (
              <div className="md:col-span-8">
                <ProductCard product={featuredProducts[0]} className="h-full" />
              </div>
            )}
            {featuredProducts[1] && (
              <div className="md:col-span-4">
                <ProductCard product={featuredProducts[1]} />
              </div>
            )}
            {featuredProducts[2] && (
              <div className="md:col-span-4">
                <ProductCard product={featuredProducts[2]} />
              </div>
            )}
            {featuredProducts[3] && (
              <div className="md:col-span-8">
                <ProductCard product={featuredProducts[3]} className="h-full" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* All Products Grid */}
      <section className="px-6 md:px-12 py-12" data-testid="products-section">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-zinc-900">
            {activeCategory
              ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`
              : 'All Products'}
          </h2>
          <p className="text-sm text-zinc-500">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] rounded-md" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          // Empty state
          <div className="empty-state py-16">
            <p className="text-lg text-zinc-500">No products found</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                handleCategoryFilter(null);
              }}
              className="mt-4"
              variant="outline"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          // Products grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product, index) => (
              <div
                key={product.id}
                className={`animate-fade-in-up opacity-0 stagger-${(index % 5) + 1}`}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};
