export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface RemoveFromCartRequest {
  productId: string;
  variantId?: string;
}

export interface CheckoutRequest {
  cartId: string;
  customerEmail: string;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: PaymentMethod;
}

export interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'stripe';
  token?: string;
  last4?: string;
  brand?: string;
}

export interface CheckoutResponse {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total: number;
  redirectUrl?: string;
}
