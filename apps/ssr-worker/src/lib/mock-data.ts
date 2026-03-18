import type { Product, ProductCategory } from '@opennext-shop/shared-types';

export const categories: ProductCategory[] = [
  {
    id: 'cat-1',
    slug: 'electronics',
    name: 'Electronics',
    description: 'Latest gadgets and devices',
  },
  {
    id: 'cat-2',
    slug: 'clothing',
    name: 'Clothing',
    description: 'Fashion for everyone',
  },
  {
    id: 'cat-3',
    slug: 'home',
    name: 'Home & Garden',
    description: 'Everything for your home',
  },
];

export const products: Product[] = [
  {
    id: 'prod-1',
    slug: 'wireless-headphones',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 299.99,
    currency: 'USD',
    images: ['/images/headphones-1.jpg', '/images/headphones-2.jpg'],
    category: 'electronics',
    tags: ['audio', 'wireless', 'noise-cancelling'],
    inStock: true,
    inventory: 45,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: 'prod-2',
    slug: 'smart-watch',
    name: 'Smart Watch Pro',
    description: 'Advanced fitness tracking, heart rate monitoring, and smartphone notifications.',
    price: 399.99,
    currency: 'USD',
    images: ['/images/watch-1.jpg', '/images/watch-2.jpg'],
    category: 'electronics',
    tags: ['wearable', 'fitness', 'smart'],
    inStock: true,
    inventory: 32,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'prod-3',
    slug: 'cotton-tshirt',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt in multiple colors.',
    price: 29.99,
    currency: 'USD',
    images: ['/images/tshirt-1.jpg'],
    category: 'clothing',
    tags: ['cotton', 'organic', 'casual'],
    inStock: true,
    inventory: 150,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-28'),
  },
  {
    id: 'prod-4',
    slug: 'denim-jacket',
    name: 'Classic Denim Jacket',
    description: 'Timeless denim jacket with modern fit and durable construction.',
    price: 89.99,
    currency: 'USD',
    images: ['/images/jacket-1.jpg', '/images/jacket-2.jpg'],
    category: 'clothing',
    tags: ['denim', 'jacket', 'casual'],
    inStock: true,
    inventory: 28,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: 'prod-5',
    slug: 'smart-speaker',
    name: 'Smart Home Speaker',
    description: 'Voice-controlled smart speaker with premium sound quality.',
    price: 149.99,
    currency: 'USD',
    images: ['/images/speaker-1.jpg'],
    category: 'electronics',
    tags: ['smart-home', 'audio', 'voice-control'],
    inStock: false,
    inventory: 0,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: 'prod-6',
    slug: 'coffee-maker',
    name: 'Programmable Coffee Maker',
    description: '12-cup programmable coffee maker with thermal carafe.',
    price: 129.99,
    currency: 'USD',
    images: ['/images/coffee-1.jpg', '/images/coffee-2.jpg'],
    category: 'home',
    tags: ['kitchen', 'coffee', 'appliance'],
    inStock: true,
    inventory: 18,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-02-20'),
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

export function filterProducts(filters: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}): Product[] {
  return products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (filters.inStock !== undefined && p.inStock !== filters.inStock) return false;
    return true;
  });
}

export function getCategories(): ProductCategory[] {
  return categories;
}
