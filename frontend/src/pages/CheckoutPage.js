/**
 * CheckoutPage - Customer details form and order placement
 * Collects shipping information for guest checkout
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotals, clearCart } = useCart();
  const { subtotal, shipping, total } = getCartTotals();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [errors, setErrors] = useState({});

  // Redirect if cart is empty
  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter valid 10-digit phone number';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Enter valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle order submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        payment_method: 'cod',
      };

      // Create order
      const response = await axios.post(`${API}/orders`, orderData);

      // Clear cart and redirect to confirmation
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${response.data.id}`);
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" data-testid="checkout-page">
      <Header />

      <div className="px-6 md:px-12 py-8 md:py-12">
        {/* Back Link */}
        <Link
          to="/cart"
          className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Cart
        </Link>

        {/* Page Title */}
        <h1 className="font-display text-3xl md:text-4xl font-bold text-zinc-900 mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="checkout-form space-y-6">
              {/* Contact Information */}
              <div className="p-6 border border-zinc-200 rounded-lg">
                <h2 className="font-display text-xl font-bold text-zinc-900 mb-6">
                  Contact Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className={errors.name ? 'border-red-500' : ''}
                      data-testid="input-name"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit number"
                      className={errors.phone ? 'border-red-500' : ''}
                      data-testid="input-phone"
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="For order updates"
                      data-testid="input-email"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-6 border border-zinc-200 rounded-lg">
                <h2 className="font-display text-xl font-bold text-zinc-900 mb-6">
                  Shipping Address
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House no., Street name, Landmark"
                      className={errors.address ? 'border-red-500' : ''}
                      data-testid="input-address"
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500">{errors.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        className={errors.city ? 'border-red-500' : ''}
                        data-testid="input-city"
                      />
                      {errors.city && (
                        <p className="text-xs text-red-500">{errors.city}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        className={errors.state ? 'border-red-500' : ''}
                        data-testid="input-state"
                      />
                      {errors.state && (
                        <p className="text-xs text-red-500">{errors.state}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="6-digit code"
                        className={errors.pincode ? 'border-red-500' : ''}
                        data-testid="input-pincode"
                      />
                      {errors.pincode && (
                        <p className="text-xs text-red-500">{errors.pincode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-6 border border-zinc-200 rounded-lg">
                <h2 className="font-display text-xl font-bold text-zinc-900 mb-4">
                  Payment Method
                </h2>
                <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-md">
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-900"></div>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">Cash on Delivery</p>
                    <p className="text-sm text-zinc-500">Pay when you receive</p>
                  </div>
                </div>
              </div>

              {/* Mobile Order Summary */}
              <div className="lg:hidden p-6 bg-zinc-50 rounded-lg">
                <h2 className="font-display text-xl font-bold text-zinc-900 mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal ({cart.length} items)</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                  </div>
                  <div className="border-t border-zinc-200 pt-3">
                    <div className="flex justify-between font-bold text-zinc-900">
                      <span>Total</span>
                      <span>₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button (Mobile) */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full lg:hidden bg-zinc-900 hover:bg-zinc-800 text-white h-14 uppercase tracking-wider font-bold btn-press"
                data-testid="place-order-btn-mobile"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `Place Order • ₹${total.toLocaleString()}`
                )}
              </Button>
            </form>
          </div>

          {/* Desktop Order Summary Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 p-6 bg-zinc-50 rounded-lg" data-testid="checkout-summary">
              <h2 className="font-display text-xl font-bold text-zinc-900 mb-6">
                Order Summary
              </h2>

              {/* Cart Items Preview */}
              <div className="space-y-4 mb-6">
                {cart.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-16 h-20 rounded-md overflow-hidden bg-zinc-100 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Qty: {item.quantity}
                        {item.size && ` • ${item.size}`}
                      </p>
                      <p className="text-sm font-medium text-zinc-900 mt-1">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-zinc-200 pt-4">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>
                <div className="border-t border-zinc-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-zinc-900">
                    <span>Total</span>
                    <span data-testid="checkout-total">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button (Desktop) */}
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-6 bg-zinc-900 hover:bg-zinc-800 text-white h-14 uppercase tracking-wider font-bold btn-press"
                data-testid="place-order-btn"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Place Order'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
