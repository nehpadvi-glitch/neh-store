/**
 * Admin Orders - Order management page
 * View orders and update status
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ChevronDown, Eye, Package } from 'lucide-react';
import { AdminLayout, getAdminAuthHeader } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Order statuses
const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'status-pending' },
  { value: 'confirmed', label: 'Confirmed', color: 'status-confirmed' },
  { value: 'shipped', label: 'Shipped', color: 'status-shipped' },
  { value: 'delivered', label: 'Delivered', color: 'status-delivered' },
  { value: 'cancelled', label: 'Cancelled', color: 'status-cancelled' },
];

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${newStatus}`, {}, {
        headers: getAdminAuthHeader(),
      });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to update order status');
      }
    }
  };

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-orders">
        {/* Page Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">Orders</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage customer orders and update status
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by order ID, name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-orders"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-12 border-zinc-200 text-center">
            <Package className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500">No orders found</p>
          </Card>
        ) : (
          <Card className="border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="admin-table" data-testid="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} data-testid={`order-row-${order.id}`}>
                      <td className="font-mono text-sm">
                        {order.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-zinc-900">
                            {order.customer?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {order.customer?.phone || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td>{order.items?.length || 0} items</td>
                      <td className="font-medium">₹{order.total?.toLocaleString() || 0}</td>
                      <td className="text-sm text-zinc-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`status-badge ${
                                ORDER_STATUSES.find((s) => s.value === order.status)?.color ||
                                'status-pending'
                              } cursor-pointer inline-flex items-center gap-1`}
                              data-testid={`status-dropdown-${order.id}`}
                            >
                              {order.status}
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {ORDER_STATUSES.map((status) => (
                              <DropdownMenuItem
                                key={status.value}
                                onClick={() => handleStatusChange(order.id, status.value)}
                                className={order.status === status.value ? 'bg-zinc-100' : ''}
                                data-testid={`status-option-${status.value}`}
                              >
                                {status.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewOrder(order)}
                            data-testid={`view-order-${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Order Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Order Details</DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6 mt-4">
                {/* Order Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">Order ID</p>
                    <p className="font-mono font-medium">
                      {selectedOrder.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <span
                    className={`status-badge ${
                      ORDER_STATUSES.find((s) => s.value === selectedOrder.status)?.color
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="p-4 bg-zinc-50 rounded-lg">
                  <h4 className="ui-label text-zinc-500 mb-2">Customer Information</h4>
                  <p className="font-medium text-zinc-900">
                    {selectedOrder.customer?.name}
                  </p>
                  <p className="text-sm text-zinc-600 mt-1">
                    {selectedOrder.customer?.phone}
                  </p>
                  {selectedOrder.customer?.email && (
                    <p className="text-sm text-zinc-600">
                      {selectedOrder.customer?.email}
                    </p>
                  )}
                  <p className="text-sm text-zinc-600 mt-2">
                    {selectedOrder.customer?.address}
                    <br />
                    {selectedOrder.customer?.city}, {selectedOrder.customer?.state} -{' '}
                    {selectedOrder.customer?.pincode}
                  </p>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="ui-label text-zinc-500 mb-3">Items Ordered</h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 border border-zinc-100 rounded-lg"
                      >
                        <div className="w-12 h-16 rounded overflow-hidden bg-zinc-100 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-zinc-500">
                            Qty: {item.quantity}
                            {item.size && ` • Size: ${item.size}`}
                            {item.color && ` • ${item.color}`}
                          </p>
                        </div>
                        <p className="font-medium text-zinc-900">
                          ₹{item.item_total?.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="p-4 bg-zinc-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Subtotal</span>
                      <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Shipping</span>
                      <span>
                        {selectedOrder.shipping === 0
                          ? 'FREE'
                          : `₹${selectedOrder.shipping}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Payment Method</span>
                      <span className="capitalize">
                        {selectedOrder.payment_method === 'cod'
                          ? 'Cash on Delivery'
                          : selectedOrder.payment_method}
                      </span>
                    </div>
                    <div className="border-t border-zinc-200 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>₹{selectedOrder.total?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Date */}
                <p className="text-sm text-zinc-500 text-center">
                  Order placed on {formatDate(selectedOrder.created_at)}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
