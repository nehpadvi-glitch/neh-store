/**
 * CartPage - Shopping cart with item management
 * Shows cart items, quantity controls, and checkout CTA
 */

import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';

export const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, getCartTotals } = useCart();
  const { subtotal, shipping, total, itemCount } = getCartTotals();

  // Handle quantity change
  const handleQuantityChange = (item, newQty) => {
    updateQuantity(item.id, newQty, item.size, item.color);
  };

  // Handle item removal
  const handleRemove = (item) => {
    removeFromCart(item.id, item.size, item.color);
  };

  // Handle checkout navigation
  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white" data-testid="cart-page-empty">
        <Header />
        <div className="px-6 md:px-12 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-zinc-400" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-2xl font-bold text-zinc-900 mb-3">
              Your cart is empty
            </h1>
            <p className="text-zinc-600 mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Button
              asChild
              className="bg-zinc-900 hover:bg-zinc-800 text-white h-12 px-8 uppercase tracking-wider font-bold"
            >
              <Link to="/" data-testid="continue-shopping-btn">
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="cart-page">
      <Header />

      <div className="px-6 md:px-12 py-8 md:py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-zinc-900">
            Shopping Cart
          </h1>
          <p className="mt-2 text-zinc-600">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4" data-testid="cart-items">
            {cart.map((item, index) => (
              <div
                key={`${item.id}-${item.size}-${item.color}`}
                className="flex gap-4 p-4 border border-zinc-200 rounded-lg"
                data-testid={`cart-item-${index}`}
              >
                {/* Item Image */}
                <Link to={`/product/${item.id}`} className="flex-shrink-0">
                  <div className="w-24 h-32 rounded-md overflow-hidden bg-zinc-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link
                        to={`/product/${item.id}`}
                        className="font-medium text-zinc-900 hover:underline line-clamp-2"
                        data-testid={`item-name-${index}`}
                      >
                        {item.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(item)}
                      className="text-zinc-400 hover:text-zinc-900 transition-colors"
                      data-testid={`remove-item-${index}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Price and Quantity */}
                  <div className="mt-4 flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-zinc-200 rounded-md">
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        className="qty-btn w-8 h-8 flex items-center justify-center"
                        data-testid={`qty-decrease-${index}`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        className="qty-btn w-8 h-8 flex items-center justify-center"
                        data-testid={`qty-increase-${index}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-bold text-zinc-900" data-testid={`item-total-${index}`}>
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                      {item.original_price && (
                        <p className="text-sm text-zinc-400 line-through">
                          ₹{(item.original_price * item.quantity).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 bg-zinc-50 rounded-lg" data-testid="order-summary">
              <h2 className="font-display text-xl font-bold text-zinc-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span data-testid="cart-subtotal">₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-zinc-600">
                  <span>Shipping</span>
                  <span data-testid="cart-shipping">
                    {shipping === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className="text-xs text-zinc-500">
                    Free shipping on orders above ₹500
                  </p>
                )}

                <div className="border-t border-zinc-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-zinc-900">
                    <span>Total</span>
                    <span data-testid="cart-total">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full mt-6 bg-zinc-900 hover:bg-zinc-800 text-white h-12 uppercase tracking-wider font-bold btn-press"
                data-testid="checkout-btn"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Link
                to="/"
                className="block text-center mt-4 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
