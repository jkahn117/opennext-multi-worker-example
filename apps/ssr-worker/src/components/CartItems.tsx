'use client';

import { useState } from 'react';
import type { Cart, ApiResponse } from '@opennext-shop/shared-types';

interface CartItemsProps {
  cart: Cart;
}

export function CartItems({ cart: initialCart }: CartItemsProps) {
  const [cart, setCart] = useState(initialCart);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateQuantity(productId: string, quantity: number) {
    setUpdating(productId);
    
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-id': cart.id,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (response.ok) {
        const data = await response.json() as ApiResponse<Cart>;
        if (data.success && data.data) {
          setCart(data.data);
        }
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(productId: string) {
    setUpdating(productId);
    
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-id': cart.id,
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        const data = await response.json() as ApiResponse<Cart>;
        if (data.success && data.data) {
          setCart(data.data);
        }
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="card">
      {cart.items.map((item) => (
        <div
          key={item.productId}
          style={{
            display: 'flex',
            gap: '1rem',
            padding: '1rem 0',
            borderBottom: '1px solid #e0e0e0',
            opacity: updating === item.productId ? 0.6 : 1,
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#f0f0f0',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              color: '#999',
            }}
          >
            {item.name}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              {item.name}
            </h3>
            <p style={{ color: '#0070f3', fontWeight: 600 }}>
              ${item.price.toFixed(2)}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={updating === item.productId}
              style={{
                padding: '0.25rem 0.5rem',
                border: '1px solid #ddd',
                background: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              -
            </button>
            <span style={{ minWidth: '2rem', textAlign: 'center' }}>
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={updating === item.productId}
              style={{
                padding: '0.25rem 0.5rem',
                border: '1px solid #ddd',
                background: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              +
            </button>
          </div>

          <div style={{ textAlign: 'right', minWidth: '80px' }}>
            <p style={{ fontWeight: 600 }}>
              ${(item.price * item.quantity).toFixed(2)}
            </p>
            <button
              onClick={() => removeItem(item.productId)}
              disabled={updating === item.productId}
              style={{
                color: '#c33',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                marginTop: '0.25rem',
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
