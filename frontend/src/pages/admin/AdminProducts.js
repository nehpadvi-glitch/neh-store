/**
 * Admin Products - Product management page with image upload
 * CRUD operations for products catalog
 */

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, Search, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { AdminLayout, getAdminAuthHeader } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Initial form state
const initialFormState = {
  name: '',
  description: '',
  price: '',
  original_price: '',
  category: 'clothing',
  subcategory: '',
  images: [],
  sizes: '',
  colors: '',
  stock: '100',
  is_featured: false,
  is_new_arrival: false,
};

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState(initialFormState);
  
  // File input ref
  const fileInputRef = useRef(null);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await axios.post(`${API}/upload-image`, formDataUpload, {
          headers: {
            ...getAdminAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });

        // Construct full URL for the uploaded image
        const imageUrl = `${BACKEND_URL}${response.data.url}`;
        uploadedUrls.push(imageUrl);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));

      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to upload image');
      }
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove image from list
  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Open modal for adding new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  // Open modal for editing product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      category: product.category,
      subcategory: product.subcategory || '',
      images: product.images || [],
      sizes: product.sizes?.join(', ') || '',
      colors: product.colors?.join(', ') || '',
      stock: product.stock.toString(),
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
    });
    setIsModalOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.price) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    setSubmitting(true);

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category: formData.category,
        subcategory: formData.subcategory.trim() || null,
        images: formData.images,
        sizes: formData.sizes ? formData.sizes.split(',').map((s) => s.trim()).filter(Boolean) : null,
        colors: formData.colors ? formData.colors.split(',').map((c) => c.trim()).filter(Boolean) : null,
        stock: parseInt(formData.stock) || 100,
        is_featured: formData.is_featured,
        is_new_arrival: formData.is_new_arrival,
      };

      if (editingProduct) {
        // Update existing product
        await axios.put(`${API}/products/${editingProduct.id}`, productData, {
          headers: getAdminAuthHeader(),
        });
        toast.success('Product updated successfully');
      } else {
        // Create new product
        await axios.post(`${API}/products`, productData, {
          headers: getAdminAuthHeader(),
        });
        toast.success('Product created successfully');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to save product');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await axios.delete(`${API}/products/${productToDelete.id}`, {
        headers: getAdminAuthHeader(),
      });
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to delete product');
      }
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-products">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-900">Products</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage your product catalog</p>
          </div>
          <Button
            onClick={handleAddProduct}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
            data-testid="add-product-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-products"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="footwear">Footwear</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 border-zinc-200 text-center">
            <p className="text-zinc-500">No products found</p>
          </Card>
        ) : (
          <Card className="border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="admin-table" data-testid="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} data-testid={`product-row-${product.id}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 rounded overflow-hidden bg-zinc-100 flex-shrink-0">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900 truncate max-w-[200px]">
                              {product.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              ID: {product.id.substring(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="capitalize">{product.category}</td>
                      <td>
                        <span className="font-medium">₹{product.price.toLocaleString()}</span>
                        {product.original_price && (
                          <span className="text-xs text-zinc-400 line-through ml-2">
                            ₹{product.original_price.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td>{product.stock}</td>
                      <td>
                        <div className="flex gap-1">
                          {product.is_featured && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                          {product.is_new_arrival && (
                            <span className="new-arrival-tag">New</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                            data-testid={`edit-${product.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Add/Edit Product Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    data-testid="input-product-name"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    data-testid="input-product-description"
                  />
                </div>

                {/* Image Upload Section */}
                <div className="md:col-span-2 space-y-3">
                  <Label>Product Images *</Label>
                  
                  {/* Image Preview Grid */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {formData.images.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
                            <img
                              src={url}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-400 transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="image-upload-input"
                    />
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                        <span className="text-sm text-zinc-500">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                        <p className="text-sm text-zinc-600">
                          Click to upload images
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          JPEG, PNG, WebP or GIF
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="999"
                    data-testid="input-product-price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price (₹)</Label>
                  <Input
                    id="original_price"
                    name="original_price"
                    type="number"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    placeholder="1499"
                    data-testid="input-product-original-price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="footwear">Footwear</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    placeholder="e.g., shirts, sneakers"
                    data-testid="input-subcategory"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sizes">Sizes (comma separated)</Label>
                  <Input
                    id="sizes"
                    name="sizes"
                    value={formData.sizes}
                    onChange={handleInputChange}
                    placeholder="S, M, L, XL"
                    data-testid="input-sizes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colors">Colors (comma separated)</Label>
                  <Input
                    id="colors"
                    name="colors"
                    value={formData.colors}
                    onChange={handleInputChange}
                    placeholder="Black, White, Blue"
                    data-testid="input-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="100"
                    data-testid="input-stock"
                  />
                </div>

                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-zinc-300"
                      data-testid="checkbox-featured"
                    />
                    <span className="text-sm">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_new_arrival"
                      checked={formData.is_new_arrival}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-zinc-300"
                      data-testid="checkbox-new-arrival"
                    />
                    <span className="text-sm">New Arrival</span>
                  </label>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white"
                  data-testid="save-product-btn"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingProduct ? (
                    'Update Product'
                  ) : (
                    'Create Product'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="confirm-delete-btn"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};
