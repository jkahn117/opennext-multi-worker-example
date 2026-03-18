import { NextRequest } from 'next/server';
import type { AddToCartRequest, UpdateCartItemRequest, RemoveFromCartRequest } from '@opennext-shop/shared-types';
import { getCart, createCart, addToCart, updateCartItem, removeFromCart, clearCart } from '@/lib/cart-store';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

export const runtime = 'edge';

// Get or create cart
export async function GET(request: NextRequest) {
  try {
    const cartId = request.headers.get('x-cart-id');

    if (!cartId) {
      // Create new cart
      const cart = createCart();
      return Response.json(createSuccessResponse(cart), {
        headers: {
          'x-cart-id': cart.id,
        },
      });
    }

    const cart = getCart(cartId);
    if (!cart) {
      // Cart not found, create new one
      const newCart = createCart();
      return Response.json(createSuccessResponse(newCart), {
        headers: {
          'x-cart-id': newCart.id,
        },
      });
    }

    return Response.json(createSuccessResponse(cart), {
      headers: {
        'x-cart-id': cart.id,
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return Response.json(
      createErrorResponse({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch cart',
      }),
      { status: 500 }
    );
  }
}

// Add item to cart
export async function POST(request: NextRequest) {
  try {
    const cartId = request.headers.get('x-cart-id');
    const body: AddToCartRequest = await request.json();

    if (!body.productId || !body.quantity || body.quantity < 1) {
      return Response.json(
        createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request. productId and quantity (>= 1) are required.',
        }),
        { status: 400 }
      );
    }

    let cart;
    if (!cartId || !getCart(cartId)) {
      cart = createCart();
    } else {
      cart = getCart(cartId)!;
    }

    const updatedCart = addToCart(cart.id, body);

    return Response.json(createSuccessResponse(updatedCart), {
      headers: {
        'x-cart-id': updatedCart!.id,
      },
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return Response.json(
      createErrorResponse({
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to add item to cart',
      }),
      { status: 500 }
    );
  }
}

// Update cart item
export async function PUT(request: NextRequest) {
  try {
    const cartId = request.headers.get('x-cart-id');
    const body: UpdateCartItemRequest = await request.json();

    if (!cartId) {
      return Response.json(
        createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'Cart ID is required',
        }),
        { status: 400 }
      );
    }

    if (!body.productId) {
      return Response.json(
        createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'productId is required',
        }),
        { status: 400 }
      );
    }

    const updatedCart = updateCartItem(cartId, body);

    if (!updatedCart) {
      return Response.json(
        createErrorResponse({
          code: 'NOT_FOUND',
          message: 'Cart not found',
        }),
        { status: 404 }
      );
    }

    return Response.json(createSuccessResponse(updatedCart), {
      headers: {
        'x-cart-id': updatedCart.id,
      },
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    return Response.json(
      createErrorResponse({
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update cart',
      }),
      { status: 500 }
    );
  }
}

// Remove item from cart or clear cart
export async function DELETE(request: NextRequest) {
  try {
    const cartId = request.headers.get('x-cart-id');
    const url = new URL(request.url);
    const clear = url.searchParams.get('clear') === 'true';

    if (!cartId) {
      return Response.json(
        createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'Cart ID is required',
        }),
        { status: 400 }
      );
    }

    if (clear) {
      const cart = clearCart(cartId);
      if (!cart) {
        return Response.json(
          createErrorResponse({
            code: 'NOT_FOUND',
            message: 'Cart not found',
          }),
          { status: 404 }
        );
      }
      return Response.json(createSuccessResponse(cart), {
        headers: {
          'x-cart-id': cart.id,
        },
      });
    }

    const body: RemoveFromCartRequest = await request.json();

    if (!body.productId) {
      return Response.json(
        createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'productId is required',
        }),
        { status: 400 }
      );
    }

    const updatedCart = removeFromCart(cartId, body);

    if (!updatedCart) {
      return Response.json(
        createErrorResponse({
          code: 'NOT_FOUND',
          message: 'Cart not found',
        }),
        { status: 404 }
      );
    }

    return Response.json(createSuccessResponse(updatedCart), {
      headers: {
        'x-cart-id': updatedCart.id,
      },
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return Response.json(
      createErrorResponse({
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove item from cart',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-cart-id',
    },
  });
}
