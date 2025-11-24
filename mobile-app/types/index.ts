/**
 * Type Definitions
 * Matches backend API schemas
 */

// User Types
export type UserType = 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPPLIER' | 'RIDER';

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  user_type: UserType;
  verification_status: string;
  is_active: boolean;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  full_name: string;
  phone?: string;
  user_type?: UserType;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: UserResponse;
  supplier_id?: string;
  redirect_to?: string;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description?: string;
  price_per_unit_cedis: number;
  unit_type: string;
  category_id?: number;
  category?: Category;
  primary_image_url?: string;
  image_url?: string;
  stock_quantity?: number;
  is_available: boolean;
  seller_id?: string;
  seller?: UserResponse;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  created_at: string;
}

// Cart Types
export interface CartItem {
  product_id: number;
  product?: Product;
  product_name?: string;
  quantity: number;
  price_per_unit_cedis: number;
  price_per_unit?: number;
  subtotal_cedis: number;
}

export interface Cart {
  user_id: string;
  items: CartItem[];
  total_items: number;
  total_price_cedis: number;
  created_at: string;
  updated_at: string;
}

// Order Types
export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PROCESSING' 
  | 'READY_FOR_PICKUP' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED';

export interface Order {
  id: number;
  user_id: string;
  status: OrderStatus;
  total_amount_cedis: number;
  delivery_address?: string;
  delivery_fee_cedis?: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  delivery_date?: string;
  delivery_time_slot?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  price_per_unit_cedis: number;
  subtotal_cedis: number;
}

// Address Types
export interface Address {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  region: string;
  postal_code?: string;
  country: string;
  phone?: string;
  is_default: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

// Payment Types
export interface Wallet {
  user_id: string;
  balance_cedis: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  user_id: string;
  amount_cedis: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  description: string;
  reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

// Bubble Types
export interface Bubble {
  id: number;
  name: string;
  description?: string;
  bubble_type: string;
  location?: string;
  region?: string;
  creator_id: string;
  creator?: UserResponse;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BubbleMember {
  id: number;
  bubble_id: number;
  user_id: string;
  user?: UserResponse;
  role: 'ADMIN' | 'MEMBER';
  joined_at: string;
}

// Review Types
export interface Review {
  id: number;
  product_id?: number;
  seller_id?: string;
  user_id: string;
  user?: UserResponse;
  rating: number;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

// Message Types
export interface Conversation {
  id: number;
  title?: string;
  conversation_type: 'DIRECT' | 'GROUP' | 'BUBBLE';
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  sender?: UserResponse;
  content: string;
  message_type: 'TEXT' | 'IMAGE' | 'FILE';
  is_read: boolean;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Error Types
export interface ApiError {
  detail: string;
  status_code: number;
}
