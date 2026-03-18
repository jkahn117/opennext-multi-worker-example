import type { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest, RemoveFromCartRequest } from '@opennext-shop/shared-types';
import { getProductById } from './mock-data';

// In-memory cart store for demo (in production, use KV or Durable Object)
const cartStore = new Map<string, Cart>();

function calculateCartTotals(items: CartItem[]): Pick<Cart, 'subtotal' | 'tax' | 'shipping' | 'total' | 'itemCount'> {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
  const total = subtotal + tax + shipping;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    tax,
    shipping,
    total,
    itemCount,
  };
}

export function getCart(cartId: string): Cart | undefined {
  return cartStore.get(cartId);
}

export function createCart(): Cart {
  const cart: Cart = {
    id: crypto.randomUUID(),
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    currency: 'USD',
    itemCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  cartStore.set(cart.id, cart);
  return cart;
}

export function addToCart(cartId: string, request: AddToCartRequest): Cart | undefined {
  const cart = cartStore.get(cartId);
  if (!cart) return undefined;

  const product = getProductById(request.productId);
  if (!product) {
    throw new Error(`Product ${request.productId} not found`);
  }

  if (!product.inStock || product.inventory < request.quantity) {
    throw new Error(`Product ${product.name} is out of stock or insufficient inventory`);
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId === request.productId && item.variantId === request.variantId
  );

  if (existingItemIndex >= 0) {
    // Update existing item
    cart.items[existingItemIndex].quantity += request.quantity;
  } else {
    // Add new item
    const cartItem: CartItem = {
      productId: request.productId,
      variantId: request.variantId,
      quantity: request.quantity,
      price: product.price,
      name: product.name,
      image: product.images[0],
    };
    cart.items.push(cartItem);
  }

  // Recalculate totals
  const totals = calculateCartTotals(cart.items);
  Object.assign(cart, totals);
  cart.updatedAt = new Date();

  return cart;
}

export function updateCartItem(cartId: string, request: UpdateCartItemRequest): Cart | undefined {
  const cart = cartStore.get(cartId);
  if (!cart) return undefined;

  const itemIndex = cart.items.findIndex(
    (item) => item.productId === request.productId && item.variantId === request.variantId
  );

  if (itemIndex < 0) {
    throw new Error('Item not found in cart');
  }

  if (request.quantity <= 0) {
    // Remove item
    cart.items.splice(itemIndex, 1);
  } else {
    // Update quantity
    cart.items[itemIndex].quantity = request.quantity;
  }

  // Recalculate totals
  const totals = calculateCartTotals(cart.items);
  Object.assign(cart, totals);
  cart.updatedAt = new Date();

  return cart;
}

export function removeFromCart(cartId: string, request: RemoveFromCartRequest): Cart | undefined {
  const cart = cartStore.get(cartId);
  if (!cart) return undefined;

  const itemIndex = cart.items.findIndex(
    (item) => item.productId === request.productId && item.variantId === request.variantId
  );

  if (itemIndex >= 0) {
    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    const totals = calculateCartTotals(cart.items);
    Object.assign(cart, totals);
    cart.updatedAt = new Date();
  }

  return cart;
}

export function clearCart(cartId: string): Cart | undefined {
  const cart = cartStore.get(cartId);
  if (!cart) return undefined;

  cart.items = [];
  cart.subtotal = 0;
  cart.tax = 0;
  cart.shipping = 0;
  cart.total = 0;
  cart.itemCount = 0;
  cart.updatedAt = new Date();

  return cart;
}
