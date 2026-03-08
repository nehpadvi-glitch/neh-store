/**
 * OrderConfirmation - Success page after order placement
 * Shows order details and tracking info
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Package, MapPin, Phone, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${API}/orders/${orderId}`);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="px-6 md:px-12 py-16 max-w-2xl mx-auto">
          <div className="text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="px-6 md:px-12 py-16 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Order not found</h1>
          <Button asChild className="mt-4">
            <Link to="/">Go to Homepage</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="order-confirmation-page">
      <Header />

      <div className="px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-zinc-900 mb-3">
              Order Confirmed!
            </h1>
            <p className="text-zinc-600">
              Thank you for your order. We'll send you updates via SMS.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="border border-zinc-200 rounded-lg overflow-hidden" data-testid="order-details">
            {/* Order Header */}
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="ui-label text-zinc-500">Order ID</p>
                  <p className="font-mono text-sm text-zinc-900" data-testid="order-id">
                    {order.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                <span className={`status-badge status-${order.status}`} data-testid="order-status">
                  {order.status}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6 border-b border-zinc-200">
              <h3 className="ui-label text-zinc-500 mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-16 h-20 rounded-md overflow-hidden bg-zinc-100 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900">{item.name}</p>
                      <p className="text-sm text-zinc-500">
                        Qty: {item.quantity}
                        {item.size && ` • Size: ${item.size}`}
                        {item.color && ` • ${item.color}`}
                      </p>
                      <p className="text-sm font-medium text-zinc-900 mt-1">
                        ₹{item.item_total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-6 border-b border-zinc-200">
              <h3 className="ui-label text-zinc-500 mb-3">Shipping To</h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-900">{order.customer.name}</p>
                  <p className="text-sm text-zinc-600 mt-1">
                    {order.customer.address}<br />
                    {order.customer.city}, {order.customer.state} - {order.customer.pincode}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Phone className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                <p className="text-sm text-zinc-600">{order.customer.phone}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-6 bg-zinc-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>Shipping</span>
                  <span>
                    {order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>Payment</span>
                  <span className="capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}</span>
                </div>
                <div className="border-t border-zinc-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-zinc-900">
                    <span>Total</span>
                    <span data-testid="order-total">₹{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-4">
              <Package className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-zinc-900">Estimated Delivery</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  Your order will be delivered within 3-5 business days. You'll receive tracking updates via SMS.
                </p>
              </div>
            </div>
          </div>

          {/* Continue Shopping Button */}
          <div className="mt-8 text-center">
            <Button
              asChild
              className="bg-zinc-900 hover:bg-zinc-800 text-white h-12 px-8 uppercase tracking-wider font-bold btn-press"
            >
              <Link to="/" data-testid="continue-shopping-btn">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
