// Server-side data access layer
// Since API routes now live in this same Next.js app, server components
// can import the data functions directly instead of making HTTP calls.

import type { Product, ProductListResponse, Cart } from '@opennext-shop/shared-types';
import { products, filterProducts, getProductBySlug, getProductById } from './mock-data';
import { getCart as getCartFromStore, createCart } from './cart-store';

export async function getProducts(params?: {
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<ProductListResponse> {
  let filteredProducts: Product[] = [...products];

  if (params?.category) {
    filteredProducts = filterProducts({ category: params.category });
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const startIndex = (page - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  return {
    products: paginatedProducts,
    total: filteredProducts.length,
    page,
    pageSize,
  };
}

export async function getProduct(idOrSlug: string): Promise<Product> {
  const product = getProductById(idOrSlug) ?? getProductBySlug(idOrSlug);

  if (!product) {
    throw new Error(`Product "${idOrSlug}" not found`);
  }

  return product;
}

export async function getCart(cartId?: string): Promise<Cart> {
  if (cartId) {
    const cart = getCartFromStore(cartId);
    if (cart) return cart;
  }
  return createCart();
}
