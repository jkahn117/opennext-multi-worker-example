import Link from 'next/link';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { CartItems } from '@/components/CartItems';

export default async function CartPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get('cartId')?.value;

  try {
    const cart = await getCart(cartId);

    // Update cookie with new cart ID if it was created
    if (!cartId) {
      cookieStore.set('cartId', cart.id, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    return (
      <>
        <Header cartItemCount={cart.itemCount} />
        <main className="container">
          <h1 className="page-title">Shopping Cart</h1>

          {cart.items.length === 0 ? (
            <div className="card empty-state">
              <h2>Your cart is empty</h2>
              <p>Add some products to get started!</p>
              <Link href="/products" className="button" style={{ marginTop: '1rem' }}>
                Browse Products
              </Link>
            </div>
          ) : (
            <>
              <CartItems cart={cart} />
              
              <div className="card" style={{ marginTop: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Order Summary</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Subtotal:</span>
                  <span>${cart.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Tax:</span>
                  <span>${cart.tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Shipping:</span>
                  <span>{cart.shipping === 0 ? 'FREE' : `$${cart.shipping.toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                  <span>Total:</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
                <Link href="/checkout" className="button" style={{ marginTop: '1.5rem', width: '100%', textAlign: 'center' }}>
                  Proceed to Checkout
                </Link>
              </div>
            </>
          )}
        </main>
      </>
    );
  } catch (error) {
    console.error('Error loading cart:', error);
    return (
      <>
        <Header />
        <main className="container">
          <h1 className="page-title">Shopping Cart</h1>
          <div className="card error">
            <h2>Error loading cart</h2>
            <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
            <Link href="/products" className="button" style={{ marginTop: '1rem' }}>
              Browse Products
            </Link>
          </div>
        </main>
      </>
    );
  }
}
