import { NextRequest } from 'next/server';
import type { CheckoutRequest, CheckoutResponse } from '@opennext-shop/shared-types';
import { getCart, clearCart } from '@/lib/cart-store';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();

    // Validate request
    if (!body.cartId) {
      return Response.json(
        createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'cartId is required',
          details: {
            cartId: ['Cart ID is required'],
          },
        }),
        { status: 400 }
      );
    }

    if (!body.customerEmail || !isValidEmail(body.customerEmail)) {
      return Response.json(
        createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'Valid customerEmail is required',
          details: {
            customerEmail: ['Valid email address is required'],
          },
        }),
        { status: 400 }
      );
    }

    if (!body.shippingAddress) {
      return Response.json(
        createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'shippingAddress is required',
          details: {
            shippingAddress: ['Shipping address is required'],
          },
        }),
        { status: 400 }
      );
    }

    const requiredAddressFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'postalCode', 'country'] as const;
    const missingFields = requiredAddressFields.filter((field) => !body.shippingAddress[field]);

    if (missingFields.length > 0) {
      return Response.json(
        createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'Incomplete shipping address',
          details: {
            shippingAddress: missingFields.map((f) => `${f} is required`),
          },
        }),
        { status: 400 }
      );
    }

    // Get cart
    const cart = getCart(body.cartId);
    if (!cart) {
      return Response.json(
        createErrorResponse({
          code: 'NOT_FOUND',
          message: 'Cart not found',
        }),
        { status: 404 }
      );
    }

    if (cart.items.length === 0) {
      return Response.json(
        createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'Cart is empty',
        }),
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Process payment via payment provider (Stripe, PayPal, etc.)
    // 2. Create order in database
    // 3. Update inventory
    // 4. Send confirmation email
    // 5. Clear the cart

    // Simulate order creation
    const orderId = `order-${crypto.randomUUID()}`;

    // Clear the cart after successful checkout
    clearCart(body.cartId);

    const checkoutResponse: CheckoutResponse = {
      orderId,
      status: 'completed',
      total: cart.total,
      redirectUrl: `/checkout/success?orderId=${orderId}`,
    };

    return Response.json(createSuccessResponse(checkoutResponse));
  } catch (error) {
    console.error('Error processing checkout:', error);
    return Response.json(
      createErrorResponse({
        code: 'INTERNAL_ERROR',
        message: 'Failed to process checkout',
      }),
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
