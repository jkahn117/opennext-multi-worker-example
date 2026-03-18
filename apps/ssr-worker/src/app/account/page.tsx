import Link from 'next/link';
import { Header } from '@/components/Header';

export default function AccountPage() {
  return (
    <>
      <Header />
      <main className="container">
        <h1 className="page-title">My Account</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Profile</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Manage your personal information and preferences.
            </p>
            <button className="button button-secondary" disabled>
              Edit Profile (Coming Soon)
            </button>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Orders</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              View your order history and track shipments.
            </p>
            <Link href="/account/orders" className="button button-secondary">
              View Orders
            </Link>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Addresses</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Manage your shipping and billing addresses.
            </p>
            <button className="button button-secondary" disabled>
              Manage Addresses (Coming Soon)
            </button>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Payment Methods</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Add or remove payment methods for faster checkout.
            </p>
            <button className="button button-secondary" disabled>
              Manage Payments (Coming Soon)
            </button>
          </div>
        </div>

        <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            This is a demo account page. In a production application, this would show real user data.
          </p>
          <Link href="/products" className="button">
            Continue Shopping
          </Link>
        </div>
      </main>
    </>
  );
}
