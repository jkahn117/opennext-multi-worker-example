import { NextRequest } from 'next/server';
import { getProductById, getProductBySlug } from '@/lib/mock-data';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

export const runtime = 'edge';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Try to find by ID first, then by slug
    let product = getProductById(id);
    if (!product) {
      product = getProductBySlug(id);
    }

    if (!product) {
      return Response.json(
        createErrorResponse({
          code: 'NOT_FOUND',
          message: `Product with ID or slug "${id}" not found`,
        }),
        { status: 404 }
      );
    }

    return Response.json(createSuccessResponse(product));
  } catch (error) {
    console.error('Error fetching product:', error);
    return Response.json(
      createErrorResponse({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch product',
      }),
      { status: 500 }
    );
  }
}

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
