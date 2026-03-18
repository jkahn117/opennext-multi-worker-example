import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCart } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { CheckoutForm } from '@/components/CheckoutForm';

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get('cartId')?.value;

  try {
    const cart = await getCart(cartId);

    if (cart.items.length === 0) {
      redirect('/cart');
    }

    return (
      <>
        <Header cartItemCount={cart.itemCount} />
        <main className="container">
          <h1 className="page-title">Checkout</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <CheckoutForm cartId={cart.id} />

            <div>
              <div className="card">
                <h2 style={{ marginBottom: '1rem' }}>Order Summary</h2>
                {cart.items.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div
                  style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '2px solid #e0e0e0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span>Subtotal:</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span>Tax:</span>
                    <span>${cart.tax.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span>Shipping:</span>
                    <span>
                      {cart.shipping === 0
                        ? 'FREE'
                        : `$${cart.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      marginTop: '1rem',
                    }}
                  >
                    <span>Total:</span>
                    <span>${cart.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error loading checkout:', error);
    redirect('/cart');
  }
}
