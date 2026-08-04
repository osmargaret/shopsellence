import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Load initial cart on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('shopsellence_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        setCart([]);
      }
    }
  }, []);

  // Sync cart to localStorage whenever it changes
  const saveCartState = (newCart) => {
    setCart(newCart);
    localStorage.setItem('shopsellence_cart', JSON.stringify(newCart));
  };

  const addToCart = (item, size, color) => {
    const existing = cart.find(
      (x) => x.id === item.id && x.size === size && x.color === color
    );

    let newCart = [];
    if (existing) {
      newCart = cart.map((x) =>
        x.id === item.id && x.size === size && x.color === color
          ? { ...x, quantity: x.quantity + 1 }
          : x
      );
    } else {
      newCart = [
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          size,
          color,
          quantity: 1
        }
      ];
    }

    saveCartState(newCart);

    // Track cart addition
    try {
      fetch(`${API_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cart_add',
          data: { outfitId: item.id, outfitName: item.name, size, color }
        })
      }).catch(() => {});
    } catch (e) {}

    // Open drawer automatically
    setIsCartOpen(true);
  };

  const updateQuantity = (index, diff) => {
    const newCart = [...cart];
    newCart[index].quantity += diff;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    saveCartState(newCart);
  };

  const removeCartItem = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    saveCartState(newCart);
  };

  const clearCart = () => {
    saveCartState([]);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) return;

    let messageText = 'Hi Shopsellence! ✦\nI would like to place an order for the following bespoke pieces:\n\n';
    let grandTotal = 0;

    cart.forEach((item, index) => {
      const priceNum = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
      const subtotal = priceNum * item.quantity;
      grandTotal += subtotal;

      messageText += `${index + 1}. *${item.name}*\n   - Size: ${item.size}\n   - Color: ${item.color}\n   - Qty: ${item.quantity}\n   - Price: ${item.price}\n\n`;
    });

    messageText += `*Grand Total: ₦${grandTotal.toLocaleString()}*\n\n`;

    // Track checkout analytics
    try {
      fetch(`${API_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'checkout',
          data: { items: cart.length, total: grandTotal }
        })
      }).catch(() => {});
    } catch (e) {}

    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/2347032550563?text=${encodedText}`, '_blank');
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartTotalValue = cart.reduce((total, item) => {
    const priceNum = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
    return total + priceNum * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotalValue,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeCartItem,
        clearCart,
        proceedToCheckout
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
