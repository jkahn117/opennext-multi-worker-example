import { NextRequest } from 'next/server';
import type { Product, ProductListResponse, ProductSearchParams } from '@opennext-shop/shared-types';
import { products, searchProducts, filterProducts } from '@/lib/mock-data';
import { createSuccessResponse, createErrorResponse, parseQueryParams } from '@/lib/api-utils';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = parseQueryParams(url);

    // Build search parameters
    const searchParams: ProductSearchParams = {
      query: params.query as string | undefined,
      category: params.category as string | undefined,
      minPrice: params.minPrice ? parseFloat(params.minPrice as string) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice as string) : undefined,
      inStock: params.inStock === 'true' ? true : params.inStock === 'false' ? false : undefined,
      page: params.page ? parseInt(params.page as string, 10) : 1,
      pageSize: params.pageSize ? parseInt(params.pageSize as string, 10) : 20,
      sortBy: (params.sortBy as 'price' | 'name' | 'createdAt') || 'createdAt',
      sortOrder: (params.sortOrder as 'asc' | 'desc') || 'desc',
    };

    let filteredProducts: Product[] = [...products];

    // Apply search
    if (searchParams.query) {
      filteredProducts = searchProducts(searchParams.query);
    }

    // Apply filters
    filteredProducts = filterProducts({
      category: searchParams.category,
      minPrice: searchParams.minPrice,
      maxPrice: searchParams.maxPrice,
      inStock: searchParams.inStock,
    });

    // Apply sorting
    filteredProducts.sort((a, b) => {
      let comparison = 0;
      switch (searchParams.sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return searchParams.sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const total = filteredProducts.length;
    const page = searchParams.page || 1;
    const pageSize = searchParams.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

    const response: ProductListResponse = {
      products: paginatedProducts,
      total,
      page,
      pageSize,
    };

    return Response.json(createSuccessResponse(response, { page, pageSize, total }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return Response.json(
      createErrorResponse({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch products',
      }),
      { status: 500 }
    );
  }
}

// Get categories endpoint
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
