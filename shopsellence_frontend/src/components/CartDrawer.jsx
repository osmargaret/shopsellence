import React from 'react';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const {
    cart,
    cartTotalValue,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeCartItem,
    proceedToCheckout
  } = useCart();

  const handleClose = () => {
    setIsCartOpen(false);
  };

  return (
    <>
      <div
        className={`cart-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={handleClose}
      ></div>
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>Your Cart</h3>
          <button className="btn-close-cart" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '40px' }}>
              🛒 Your cart is empty.
            </div>
          ) : (
            cart.map((item, index) => {
              const imgUrl = item.image.startsWith('http') || item.image.startsWith('data:')
                ? item.image
                : `/${item.image}`;
              return (
                <div className="cart-item" key={`${item.id}-${item.size}-${item.color}`}>
                  <img
                    src={imgUrl}
                    className="cart-item-img"
                    onError={(e) => {
                      e.target.src = '/shopsellence_images/logo.png';
                    }}
                    alt={item.name}
                  />
                  <div className="cart-item-details">
                    <div>
                      <div className="cart-item-title">{item.name}</div>
                      <div className="cart-item-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>Size: {item.size}</span>
                        <span>|</span>
                        <span>Color:</span>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                          }}
                        ></span>
                      </div>
                    </div>
                    <div>
                      <div className="cart-item-price">{item.price}</div>
                      <div className="cart-item-qty">
                        <button className="cart-qty-btn" onClick={() => updateQuantity(index, -1)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button className="cart-qty-btn" onClick={() => updateQuantity(index, 1)}>
                          +
                        </button>
                        <button
                          className="cart-item-remove"
                          onClick={() => removeCartItem(index)}
                          style={{ marginLeft: 'auto' }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span>₦{cartTotalValue.toLocaleString()}</span>
            </div>
            <button className="btn-checkout" onClick={proceedToCheckout}>
              Checkout via WhatsApp →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
