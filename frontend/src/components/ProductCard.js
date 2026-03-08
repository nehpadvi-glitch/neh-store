/**
 * ProductCard Component - Displays product in grid
 * Features hover effects, sale tags, and quick add to cart
 */

import { Link } from 'react-router-dom';
import { ShoppingBag, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const ProductCard = ({ product, className = '' }) => {
  const { addToCart } = useCart();

  // Calculate discount percentage
  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  // Handle quick add to cart
  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add with default size/color (first available)
    const defaultSize = product.sizes?.[0] || null;
    const defaultColor = product.colors?.[0] || null;
    
    addToCart(product, 1, defaultSize, defaultColor);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className={`product-card group block ${className}`}
      data-testid={`product-card-${product.id}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-zinc-100">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover image-hover"
          loading="lazy"
        />
        
        {/* Tags */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_new_arrival && (
            <span className="new-arrival-tag" data-testid="new-arrival-tag">
              New
            </span>
          )}
          {discountPercent > 0 && (
            <span className="sale-tag" data-testid="sale-tag">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Quick Add Button - Appears on hover */}
        <div className="add-to-cart-overlay absolute bottom-3 left-3 right-3">
          <Button
            onClick={handleQuickAdd}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-10 text-sm font-medium btn-press"
            data-testid={`quick-add-${product.id}`}
          >
            <ShoppingBag className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-4 space-y-1">
        {/* Category */}
        <p className="ui-label text-zinc-500" data-testid="product-category">
          {product.category}
        </p>
        
        {/* Name */}
        <h3 className="font-body text-base font-medium text-zinc-900 line-clamp-1" data-testid="product-name">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-zinc-600">
            {product.rating} ({product.reviews_count})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <span className="font-body text-lg font-bold text-zinc-900" data-testid="product-price">
            ₹{product.price.toLocaleString()}
          </span>
          {product.original_price && (
            <span className="text-sm text-zinc-400 line-through">
              ₹{product.original_price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
