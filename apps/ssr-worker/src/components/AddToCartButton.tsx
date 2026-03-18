'use client';

import { useState } from 'react';

interface AddToCartButtonProps {
  productId: string;
  inStock: boolean;
}

export function AddToCartButton({ productId, inStock }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAddToCart() {
    if (!inStock) return;

    setIsAdding(true);
    setMessage(null);

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (response.ok) {
        setMessage('Added to cart!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error adding to cart');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <label htmlFor="quantity">Quantity:</label>
        <input
          id="quantity"
          type="number"
          min="1"
          max="10"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
          style={{
            width: '60px',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!inStock || isAdding}
        className="button"
        style={{
          opacity: !inStock || isAdding ? 0.6 : 1,
          cursor: !inStock || isAdding ? 'not-allowed' : 'pointer',
        }}
      >
        {isAdding ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>

      {message && (
        <p
          style={{
            marginTop: '0.5rem',
            color: message.includes('Error') ? '#c33' : '#2e7d32',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
