/**
 * Cart Context - Global state management for shopping cart
 * Handles add, remove, update quantity operations
 */

import { createContext, useContext, useState, useEffect } from 'react';

// Create Cart Context
const CartContext = createContext(null);

// Cart Provider Component
export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage if available
  const [cart, setCart] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fashion-cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('fashion-cart', JSON.stringify(cart));
  }, [cart]);

  // Add item to cart
  const addToCart = (product, quantity = 1, size = null, color = null) => {
    setCart(prevCart => {
      // Check if item already exists with same size/color
      const existingIndex = prevCart.findIndex(
        item => item.id === product.id && item.size === size && item.color === color
      );

      if (existingIndex > -1) {
        // Update quantity if exists
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      }

      // Add new item
      return [...prevCart, {
        id: product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        image: product.images[0],
        quantity,
        size,
        color,
        category: product.category
      }];
    });
  };

  // Remove item from cart
  const removeFromCart = (productId, size = null, color = null) => {
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item.id === productId && item.size === size && item.color === color)
      )
    );
  };

  // Update item quantity
  const updateQuantity = (productId, quantity, size = null, color = null) => {
    if (quantity < 1) {
      removeFromCart(productId, size, color);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate totals
  const getCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 500 ? 0 : 40;
    const total = subtotal + shipping;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, shipping, total, itemCount };
  };

  // Get cart item count
  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotals,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
