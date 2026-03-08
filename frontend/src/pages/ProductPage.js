/**
 * ProductPage - Individual product detail page
 * Shows images, description, size/color selection, add to cart
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Star, Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/products/${id}`);
        setProduct(response.data);
        
        // Set default selections
        if (response.data.sizes?.length > 0) {
          setSelectedSize(response.data.sizes[0]);
        }
        if (response.data.colors?.length > 0) {
          setSelectedColor(response.data.colors[0]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Product not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  // Handle add to cart
  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    addToCart(product, quantity, selectedSize, selectedColor);
    toast.success(`${product.name} added to cart`);
  };

  // Calculate discount
  const discountPercent = product?.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="px-6 md:px-12 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-md" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white" data-testid="product-page">
      <Header />

      {/* Breadcrumb */}
      <div className="px-6 md:px-12 py-4 border-b border-zinc-100">
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-zinc-500 hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <span className="text-zinc-300">/</span>
          <Link
            to={`/?category=${product.category}`}
            className="text-zinc-500 hover:text-zinc-900 transition-colors capitalize"
          >
            {product.category}
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 truncate">{product.name}</span>
        </nav>
      </div>

      {/* Product Content */}
      <div className="px-6 md:px-12 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square rounded-md overflow-hidden bg-zinc-100">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="product-image"
              />
            </div>

            {/* Tags */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.is_new_arrival && (
                <span className="new-arrival-tag">New</span>
              )}
              {discountPercent > 0 && (
                <span className="sale-tag">-{discountPercent}%</span>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Category */}
            <p className="ui-label text-zinc-500" data-testid="product-category">
              {product.category}
            </p>

            {/* Name */}
            <h1
              className="font-display text-3xl md:text-4xl font-bold text-zinc-900"
              data-testid="product-title"
            >
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-zinc-900">{product.rating}</span>
              </div>
              <span className="text-zinc-400">|</span>
              <span className="text-zinc-600">{product.reviews_count} reviews</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3" data-testid="product-price-section">
              <span className="text-3xl font-bold text-zinc-900">
                ₹{product.price.toLocaleString()}
              </span>
              {product.original_price && (
                <>
                  <span className="text-xl text-zinc-400 line-through">
                    ₹{product.original_price.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-zinc-600 leading-relaxed" data-testid="product-description">
              {product.description}
            </p>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3" data-testid="size-selection">
                <p className="ui-label text-zinc-700">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 flex items-center justify-center rounded-md border text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                      }`}
                      data-testid={`size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3" data-testid="color-selection">
                <p className="ui-label text-zinc-700">Color: {selectedColor}</p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${
                        selectedColor === color
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                      }`}
                      data-testid={`color-${color}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3" data-testid="quantity-selection">
              <p className="ui-label text-zinc-700">Quantity</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-zinc-200 rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="qty-btn w-10 h-10 flex items-center justify-center"
                    data-testid="qty-decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium" data-testid="qty-value">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="qty-btn w-10 h-10 flex items-center justify-center"
                    data-testid="qty-increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-zinc-500">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white h-14 text-base uppercase tracking-wider font-bold btn-press"
                data-testid="add-to-cart-btn"
              >
                <ShoppingBag className="h-5 w-5 mr-2" strokeWidth={1.5} />
                Add to Cart
              </Button>
            </div>

            {/* Stock notice */}
            {product.stock > 0 && product.stock < 10 && (
              <p className="text-sm text-orange-600 font-medium">
                Only {product.stock} left! Order soon.
              </p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
