import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { AddToCartButton } from '@/components/AddToCartButton';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  try {
    const product = await getProduct(slug);

    return (
      <>
        <Header />
        <main className="container">
          <div style={{ marginBottom: '1rem' }}>
            <Link href="/products" className="button button-secondary">
              ← Back to Products
            </Link>
          </div>

          <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div
              style={{
                height: '400px',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#999',
                fontSize: '1.2rem',
              }}
            >
              Image: {product.name}
            </div>

            <div>
              <h1 className="page-title" style={{ marginBottom: '1rem' }}>
                {product.name}
              </h1>

              <p
                className="product-price"
                style={{ fontSize: '2rem', marginBottom: '1rem' }}
              >
                ${product.price.toFixed(2)}
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <span
                  className={`badge ${
                    !product.inStock ? 'badge-out-of-stock' : ''
                  }`}
                >
                  {product.inStock
                    ? `In Stock (${product.inventory} available)`
                    : 'Out of Stock'}
                </span>
              </div>

              <p
                style={{
                  color: '#666',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                }}
              >
                {product.description}
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <strong>Category:</strong>{' '}
                {product.category.charAt(0).toUpperCase() +
                  product.category.slice(1)}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <strong>Tags:</strong>{' '}
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      background: '#f0f0f0',
                      borderRadius: '4px',
                      marginRight: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <AddToCartButton
                productId={product.id}
                inStock={product.inStock}
              />
            </div>
          </div>
        </main>
      </>
    );
  } catch {
    notFound();
  }
}
