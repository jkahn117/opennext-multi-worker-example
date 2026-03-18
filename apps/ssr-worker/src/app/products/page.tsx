import { Suspense } from 'react';
import Link from 'next/link';
import { getProducts } from '@/lib/api-client';
import { Header } from '@/components/Header';
import type { Product } from '@opennext-shop/shared-types';

export const revalidate = 60; // Revalidate every 60 seconds

async function ProductList({ category }: { category?: string }) {
  try {
    const data = await getProducts({ category, page: 1, pageSize: 20 });

    if (data.products.length === 0) {
      return (
        <div className="empty-state">
          <h2>No products found</h2>
          <p>Check back later for new arrivals!</p>
        </div>
      );
    }

    return (
      <div className="product-grid">
        {data.products.map((product: Product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="product-card"
          >
            <div className="product-image">Image: {product.name}</div>
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-price">
                ${product.price.toFixed(2)}
              </p>
              <p className="product-description">
                {product.description.slice(0, 100)}...
              </p>
              <span className={`badge ${!product.inStock ? 'badge-out-of-stock' : ''}`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  } catch (error) {
    return (
      <div className="error">
        <h2>Error loading products</h2>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category;

  return (
    <>
      <Header />
      <main className="container">
        <h1 className="page-title">
          {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Products` : 'All Products'}
        </h1>
        <Suspense fallback={<div className="loading">Loading products...</div>}>
          <ProductList category={category} />
        </Suspense>
      </main>
    </>
  );
}
