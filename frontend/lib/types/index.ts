/**
 * TypeScript Types for GoShopGhana API
 * Matching backend schemas
 */

// ============= ENUMS =============

export enum UserType {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
  SUPPLIER = 'SUPPLIER',
  RIDER = 'RIDER',
}

export enum PremiumTier {
  BASIC = 'basic',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum UnitType {
  KG = 'kg',
  LITER = 'liter',
  PIECE = 'piece',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  PAYSTACK = 'paystack',
  CASH = 'cash',
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum BubbleType {
  FAMILY = 'family',
  FRIENDS = 'friends',
  COMMUNITY = 'community',
  BUSINESS = 'business',
}

export enum BubbleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REMOVED = 'removed',
}

export enum TransferType {
  CONTRIBUTION = 'contribution',
  LOAN = 'loan',
  GIFT = 'gift',
  PAYMENT = 'payment',
}

export enum TransferStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ApprovalLevel {
  NONE = 'none',
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  BUBBLE = 'bubble',
  ORDER = 'order',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  PRODUCT = 'product',
  ORDER = 'order',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export enum ReviewType {
  PRODUCT = 'product',
  SELLER = 'seller',
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ReviewHelpfulness {
  HELPFUL = 'helpful',
  NOT_HELPFUL = 'not_helpful',
}

// ============= USER TYPES =============

export interface UserCreate {
  email: string
  username: string
  password: string
  full_name: string
  phone_number?: string
  user_type: UserType
  location?: string
  latitude?: string
  longitude?: string
  phone?: string
  referral_source?: string
  profile_picture_url?: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface UserResponse {
  id: number
  email: string
  username: string
  full_name: string
  phone_number?: string
  phone?: string
  user_type: UserType
  premium_tier: PremiumTier
  location?: string
  verification_status: VerificationStatus
  is_active: boolean
  profile_picture_url?: string
  created_at: string
  updated_at: string
}

export interface UserUpdate {
  full_name?: string
  location?: string
  bio?: string
  phone?: string
  profile_picture_url?: string
}

export interface Token {
  access_token: string
  token_type: string
  user?: UserResponse
  supplier_id?: string
  redirect_to?: string
}

// ============= PRODUCT TYPES =============

export interface ProductCreate {
  name: string
  description: string
  price_per_unit: number
  unit_type: UnitType
  available_quantity: number
  category_id: number
  image_url?: string
  ghana_region?: string
  is_organic?: boolean
}

export interface ProductResponse {
  id: number
  name: string
  description: string
  price_per_unit: number
  unit_type: UnitType
  available_quantity: number
  category_id: number
  seller_id: number
  image_url?: string
  ghana_region?: string
  is_organic: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  seller?: UserResponse
  category?: CategoryResponse
  average_rating?: number
  total_reviews?: number
}

export interface ProductUpdate {
  name?: string
  description?: string
  price_per_unit?: number
  unit_type?: UnitType
  available_quantity?: number
  category_id?: number
  image_url?: string
  ghana_region?: string
  is_organic?: boolean
  is_active?: boolean
}

export interface CategoryCreate {
  name: string
  description?: string
  image_url?: string
}

export interface CategoryResponse {
  id: number
  name: string
  description?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface CategoryUpdate {
  name?: string
  description?: string
  image_url?: string
}

export interface ProductListResponse {
  products: ProductResponse[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ============= CART TYPES =============

export interface AddToCartRequest {
  product_id: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CartProductDetails {
  id: string
  name: string
  price_per_unit_cedis: number
  unit_type: string
  image_url?: string
  primary_image_url?: string
}

export interface CartItemResponse {
  id: string
  product_id: string
  quantity: number
  product: CartProductDetails
  subtotal: number
}

export interface CartResponse {
  id: string
  user_id: string
  items: CartItemResponse[]
  total_items: number
  total_amount: number
  created_at: string
  updated_at: string
}

export interface CartSummary {
  total_items: number
  total_amount: number
  items_by_seller: Record<number, number>
}

// ============= ORDER TYPES =============

export interface OrderCreate {
  delivery_address?: {
    street: string
    area: string
    city: string
    region: string
    phone: string
    additional_info?: string
    latitude?: string
    longitude?: string
  }
  delivery_notes?: string
  payment_method?: PaymentMethod
  delivery_date?: string
}

export interface OrderItemResponse {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image_url?: string
  price_per_unit_cedis: number
  unit_type: string
  quantity: number
  line_total_cedis: number
  price_per_unit?: number
  line_total?: number
}

export interface OrderResponse {
  id: string
  user_id: string
  status: OrderStatus
  subtotal_cedis: number
  delivery_fee_cedis: number
  tax_cedis: number
  total_cedis: number
  delivery_address?: {
    street: string
    area: string
    city: string
    region: string
    phone: string
    additional_info?: string
    latitude?: string
    longitude?: string
  }
  delivery_notes?: string
  estimated_delivery_time?: string
  items: OrderItemResponse[]
  created_at: string
  updated_at: string
  delivered_at?: string
  subtotal?: number
  delivery_fee?: number
  tax?: number
  total?: number
}

export interface OrderStatusUpdate {
  status: OrderStatus
}

export interface OrderStats {
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_revenue: number
}

// ============= PAYMENT TYPES =============

export interface WalletResponse {
  id: number
  user_id: number
  balance: number
  created_at: string
  updated_at: string
}

export interface TransactionResponse {
  id: number
  wallet_id: number
  amount: number
  transaction_type: TransactionType
  status: TransactionStatus
  reference: string
  description?: string
  created_at: string
}

export interface PaymentInitRequest {
  amount: number
  email: string
  callback_url?: string
}

export interface PaymentInitResponse {
  authorization_url: string
  access_code: string
  reference: string
}

export interface PaymentVerificationResponse {
  status: string
  reference: string
  amount: number
  message: string
}

export interface WalletCreditRequest {
  amount: number
  description?: string
}

export interface WalletDebitRequest {
  amount: number
  description?: string
}

export interface PaymentStats {
  total_transactions: number
  total_credited: number
  total_debited: number
  wallet_balance: number
}

// ============= BUBBLE TYPES =============

export interface BubbleCreate {
  name: string
  description?: string
  bubble_type: BubbleType
  location?: string
  max_members?: number
}

export interface BubbleResponse {
  id: number
  name: string
  description?: string
  bubble_type: BubbleType
  creator_id: number
  location?: string
  max_members: number
  current_members: number
  status: BubbleStatus
  created_at: string
  updated_at: string
  creator?: UserResponse
}

export interface BubbleUpdate {
  name?: string
  description?: string
  location?: string
  max_members?: number
  status?: BubbleStatus
}

export interface BubbleMemberResponse {
  id: number
  bubble_id: number
  user_id: number
  role: MemberRole
  status: MemberStatus
  joined_at: string
  user?: UserResponse
}

export interface BubbleStats {
  total_bubbles: number
  active_bubbles: number
  total_members: number
  bubbles_by_type: Record<string, number>
}

// ============= FUND TRANSFER TYPES =============

export interface FundTransferCreate {
  bubble_id: number
  recipient_id: number
  amount: number
  transfer_type: TransferType
  description?: string
  requires_approval: boolean
}

export interface FundTransferResponse {
  id: number
  bubble_id: number
  sender_id: number
  recipient_id: number
  amount: number
  transfer_type: TransferType
  status: TransferStatus
  description?: string
  requires_approval: boolean
  approved_by?: number
  created_at: string
  updated_at: string
  sender?: UserResponse
  recipient?: UserResponse
  bubble?: BubbleResponse
}

export interface TransferStats {
  total_transfers: number
  total_amount: number
  pending_transfers: number
  completed_transfers: number
}

// ============= MESSAGING TYPES =============

export interface ConversationCreate {
  conversation_type: ConversationType
  title?: string
  participant_ids: number[]
  bubble_id?: number
  order_id?: number
}

export interface ConversationResponse {
  id: number
  conversation_type: ConversationType
  title?: string
  bubble_id?: number
  order_id?: number
  created_at: string
  updated_at: string
  participants: ConversationParticipantResponse[]
  last_message?: MessageResponse
  unread_count?: number
}

export interface ConversationParticipantResponse {
  id: number
  conversation_id: number
  user_id: number
  joined_at: string
  user?: UserResponse
}

export interface MessageCreate {
  content: string
  message_type: MessageType
  product_id?: number
  order_id?: number
}

export interface MessageResponse {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  message_type: MessageType
  status: MessageStatus
  product_id?: number
  order_id?: number
  created_at: string
  sender?: UserResponse
  is_read: boolean
}

export interface MessageListResponse {
  messages: MessageResponse[]
  total: number
  page: number
  page_size: number
}

export interface ConversationListResponse {
  conversations: ConversationResponse[]
  total: number
  page: number
  page_size: number
}

// ============= REVIEW TYPES =============

export interface ReviewCreate {
  product_id: number
  rating: number
  comment?: string
  review_type: ReviewType
}

export interface ReviewResponse {
  id: number
  product_id: number
  user_id: number
  order_id?: number
  rating: number
  comment?: string
  review_type: ReviewType
  status: ReviewStatus
  helpful_count: number
  not_helpful_count: number
  created_at: string
  updated_at: string
  user?: UserResponse
  product?: ProductResponse
  response?: ReviewResponseResponse
}

export interface ReviewResponseResponse {
  id: number
  review_id: number
  seller_id: number
  response_text: string
  created_at: string
  seller?: UserResponse
}

// ============= USER ADDRESS TYPES =============

export interface UserAddressBase {
  label: string
  street: string
  area: string
  city: string
  region: string
  phone: string
  latitude?: string
  longitude?: string
  additional_info?: string
  is_default: boolean
}

export interface UserAddressCreate extends UserAddressBase {}

export interface UserAddressUpdate {
  label?: string
  street?: string
  area?: string
  city?: string
  region?: string
  phone?: string
  latitude?: string
  longitude?: string
  additional_info?: string
  is_default?: boolean
}

export interface UserAddressResponse extends UserAddressBase {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface UserAddressListResponse {
  addresses: UserAddressResponse[]
  total: number
  default_address_id?: string
}

export interface ReviewUpdate {
  rating?: number
  comment?: string
}

export interface ReviewListResponse {
  reviews: ReviewResponse[]
  total: number
  page: number
  page_size: number
  average_rating: number
}

export interface ProductRatingResponse {
  product_id: number
  average_rating: number
  total_reviews: number
  rating_distribution: Record<number, number>
}

export interface SellerRatingResponse {
  seller_id: number
  average_rating: number
  total_reviews: number
  rating_distribution: Record<number, number>
}
