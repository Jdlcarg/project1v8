export interface FilterState {
  ageRange: string;
  type: string;
  category: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
}
