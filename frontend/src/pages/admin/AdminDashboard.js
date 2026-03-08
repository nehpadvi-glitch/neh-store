/**
 * Admin Dashboard - Analytics overview and quick stats
 * Features sales metrics, order counts, and recent activity
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Clock,
  Check,
  Truck,
  XCircle
} from 'lucide-react';
import { AdminLayout, getAdminAuthHeader } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Seed products first
        await axios.post(`${API}/seed`);
        
        const response = await axios.get(`${API}/analytics`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Stats cards configuration
  const statCards = analytics ? [
    {
      title: 'Total Revenue',
      value: `₹${analytics.total_revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: analytics.total_orders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Products',
      value: analytics.total_products,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pending Orders',
      value: analytics.pending_orders,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ] : [];

  // Order status cards
  const orderStatusCards = analytics ? [
    { status: 'Confirmed', count: analytics.confirmed_orders, icon: Check, color: 'text-blue-600' },
    { status: 'Shipped', count: analytics.shipped_orders, icon: Truck, color: 'text-indigo-600' },
    { status: 'Delivered', count: analytics.delivered_orders, icon: TrendingUp, color: 'text-green-600' },
    { status: 'Cancelled', count: analytics.cancelled_orders, icon: XCircle, color: 'text-red-600' },
  ] : [];

  return (
    <AdminLayout>
      <div className="space-y-8" data-testid="admin-dashboard">
        {/* Page Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Overview of your store performance</p>
        </div>

        {/* Main Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card
                key={stat.title}
                className="p-6 border-zinc-200"
                data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Order Status Breakdown */}
        {!loading && analytics && (
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-900 mb-4">
              Order Status Breakdown
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {orderStatusCards.map((item) => (
                <Card
                  key={item.status}
                  className="p-4 border-zinc-200"
                  data-testid={`status-${item.status.toLowerCase()}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                    <div>
                      <p className="text-sm text-zinc-500">{item.status}</p>
                      <p className="text-xl font-bold text-zinc-900">{item.count}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Sales by Category */}
        {!loading && analytics && Object.keys(analytics.orders_by_category).length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-900 mb-4">
              Sales by Category
            </h2>
            <Card className="p-6 border-zinc-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {Object.entries(analytics.orders_by_category).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <p className="text-3xl font-bold text-zinc-900">{count}</p>
                    <p className="text-sm text-zinc-500 capitalize mt-1">{category} items sold</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Recent Orders */}
        {!loading && analytics && analytics.recent_orders.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-900 mb-4">
              Recent Orders
            </h2>
            <Card className="border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recent_orders.slice(0, 5).map((order) => (
                      <tr key={order.id}>
                        <td className="font-mono text-sm">
                          {order.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td>{order.customer?.name || 'N/A'}</td>
                        <td>{order.items?.length || 0} items</td>
                        <td className="font-medium">₹{order.total?.toLocaleString() || 0}</td>
                        <td>
                          <span className={`status-badge status-${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!loading && analytics && analytics.total_orders === 0 && (
          <Card className="p-12 border-zinc-200 text-center">
            <ShoppingCart className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 mb-2">No orders yet</h3>
            <p className="text-sm text-zinc-500">
              When customers place orders, they'll appear here.
            </p>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};
