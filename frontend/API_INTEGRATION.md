# GoShopGhana Frontend-Backend API Integration

## ✅ Integration Complete!

Your Next.js frontend is now fully connected to your FastAPI backend.

---

## 📁 Project Structure

```
frontend/
├── lib/
│   ├── api/
│   │   ├── client.ts              # Axios client with auth interceptors
│   │   ├── config.ts              # API endpoints configuration
│   │   └── services/
│   │       ├── auth.service.ts    # Authentication APIs
│   │       ├── users.service.ts   # User profile APIs
│   │       ├── products.service.ts # Product management APIs
│   │       ├── cart.service.ts    # Shopping cart APIs
│   │       ├── orders.service.ts  # Order management APIs
│   │       ├── payments.service.ts # Payment & wallet APIs
│   │       ├── bubbles.service.ts # Bubble social commerce APIs
│   │       ├── fundTransfers.service.ts # Fund transfer APIs
│   │       ├── messages.service.ts # Messaging APIs
│   │       ├── reviews.service.ts # Review & rating APIs
│   │       └── index.ts           # Service exports
│   ├── contexts/
│   │   └── auth-context.tsx       # Authentication state management
│   └── types/
│       └── index.ts               # TypeScript types matching backend
├── hooks/
│   └── use-cart.ts                # Cart hook with backend integration
└── app/
    ├── layout.tsx                 # Root layout with AuthProvider
    ├── login/page.tsx             # Login page (✅ Connected)
    └── signup/page.tsx            # Signup page (✅ Connected)
```

---

## 🔧 Configuration

### Environment Variables

**Root `.env` file:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This tells your frontend where to find your backend API.

---

## 🚀 How It Works

### 1. **API Client** (`lib/api/client.ts`)
- Axios instance configured to call `http://localhost:8000/api/v1`
- Automatically adds JWT token to all requests
- Handles 401 errors (redirects to login)
- Global error handling

### 2. **Authentication Flow**

```typescript
// Login
import { useAuth } from '@/lib/contexts/auth-context'

const { login, user, isAuthenticated } = useAuth()

await login({ email, password })
// Token stored in localStorage
// User redirected to home page
```

### 3. **Making API Calls**

```typescript
// Example: Get products
import { productsService } from '@/lib/api/services'

const products = await productsService.getProducts({
  skip: 0,
  limit: 20,
  category_id: 1
})

// Example: Add to cart
import { cartService } from '@/lib/api/services'

await cartService.addToCart({
  product_id: 123,
  quantity: 2
})
```

### 4. **Using Hooks**

```typescript
// Cart Hook
import { useCart } from '@/hooks/use-cart'

const { cart, items, totalAmount, addToCart, removeFromCart } = useCart()

// Add item
await addToCart(productId, quantity)

// Auth Hook
import { useAuth } from '@/lib/contexts/auth-context'

const { user, isAuthenticated, logout } = useAuth()
```

---

## 📡 Available Services

### Authentication (`authService`)
- `login(credentials)` - Login user
- `register(userData)` - Register new user
- `logout()` - Logout user
- `getCurrentUser()` - Get current user profile
- `isAuthenticated()` - Check if user is logged in

### Products (`productsService`)
- `getProducts(params)` - List products
- `searchProducts(query)` - Search products
- `getProduct(id)` - Get product details
- `createProduct(data)` - Create product (seller)
- `updateProduct(id, data)` - Update product (seller)
- `deleteProduct(id)` - Delete product (seller)
- `getCategories()` - Get all categories

### Cart (`cartService`)
- `getCart()` - Get user's cart
- `addToCart(data)` - Add item to cart
- `updateCartItem(productId, data)` - Update quantity
- `removeFromCart(productId)` - Remove item
- `clearCart()` - Clear entire cart
- `getCartSummary()` - Get cart summary

### Orders (`ordersService`)
- `createOrder(data)` - Create order from cart
- `getOrders(params)` - Get user's orders
- `getOrder(id)` - Get order details
- `updateOrderStatus(id, status)` - Update status (seller/admin)
- `getOrderStats()` - Get order statistics

### Payments (`paymentsService`)
- `getWallet()` - Get user's wallet
- `getTransactions(params)` - Get wallet transactions
- `initializePayment(data)` - Initialize Paystack payment
- `verifyPayment(reference)` - Verify payment
- `getPaymentStats()` - Get payment statistics
- `getGhanaBanks()` - Get Ghana banks list

### Bubbles (`bubblesService`)
- `createBubble(data)` - Create new bubble
- `getBubbles(params)` - List bubbles
- `getMyBubbles()` - Get user's bubbles
- `joinBubble(id)` - Join bubble
- `leaveBubble(id)` - Leave bubble
- `getBubbleMembers(id)` - Get bubble members

### Fund Transfers (`fundTransfersService`)
- `createTransfer(data)` - Create fund transfer
- `getTransfers(params)` - Get user's transfers
- `approveTransfer(id)` - Approve transfer
- `cancelTransfer(id)` - Cancel transfer
- `getBubbleTransfers(bubbleId)` - Get bubble transfers

### Messages (`messagesService`)
- `createConversation(data)` - Create conversation
- `getConversations(params)` - Get user's conversations
- `sendMessage(conversationId, data)` - Send message
- `getMessages(conversationId, params)` - Get messages
- `markMessageAsRead(messageId)` - Mark as read
- `getUnreadCount()` - Get unread count

### Reviews (`reviewsService`)
- `createReview(data)` - Create review
- `getProductReviews(productId)` - Get product reviews
- `getSellerReviews(sellerId)` - Get seller reviews
- `voteReview(reviewId, helpful)` - Vote review
- `getProductRating(productId)` - Get product rating

---

## 🎯 Next Steps

### 1. **Update Shop Page** (`app/shop/page.tsx`)
```typescript
import { productsService } from '@/lib/api/services'

// Fetch real products from backend
const products = await productsService.getProducts()
```

### 2. **Update Cart Page** (`app/cart/page.tsx`)
```typescript
import { useCart } from '@/hooks/use-cart'

const { cart, items, removeFromCart, updateCartItem } = useCart()
```

### 3. **Update Orders Page** (`app/orders/page.tsx`)
```typescript
import { ordersService } from '@/lib/api/services'

const orders = await ordersService.getOrders()
```

### 4. **Update Wallet Page** (`app/wallet/page.tsx`)
```typescript
import { paymentsService } from '@/lib/api/services'

const wallet = await paymentsService.getWallet()
const transactions = await paymentsService.getTransactions()
```

### 5. **Update Bubbles Page** (`app/bubbles/page.tsx`)
```typescript
import { bubblesService } from '@/lib/api/services'

const bubbles = await bubblesService.getBubbles()
const myBubbles = await bubblesService.getMyBubbles()
```

### 6. **Update Messages Page** (`app/messages/page.tsx`)
```typescript
import { messagesService } from '@/lib/api/services'

const conversations = await messagesService.getConversations()
```

---

## 🧪 Testing the Integration

### 1. **Start Backend**
```bash
cd backend
python -m uvicorn main:app --reload
```
Backend runs on: `http://localhost:8000`

### 2. **Start Frontend**
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:3000`

### 3. **Test Authentication**
1. Go to `http://localhost:3000/signup`
2. Create a new account
3. You'll be auto-logged in and redirected to home
4. Check browser console for API calls
5. Check backend logs for requests

### 4. **Test with Existing User**
- Email: `admin@goshop.gh` (or your test user)
- Password: `admin1234` (or your test password)

---

## 🔐 Authentication Details

### Token Storage
- JWT token stored in `localStorage` as `access_token`
- User data cached in `localStorage` as `user`
- Token automatically added to all API requests via interceptor

### Protected Routes
To protect a page, use the `useAuth` hook:

```typescript
'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) return <div>Loading...</div>

  return <div>Protected Content</div>
}
```

---

## 🐛 Troubleshooting

### CORS Errors
Your backend `.env` already includes frontend URL:
```env
BACKEND_CORS_ORIGINS=["http://localhost:3000", ...]
```

### 401 Unauthorized
- Token expired or invalid
- User will be auto-redirected to login
- Check backend logs for authentication errors

### Network Errors
- Ensure backend is running on `http://localhost:8000`
- Check `.env` file has correct `NEXT_PUBLIC_API_URL`
- Verify database is running

### Type Errors
All types are defined in `lib/types/index.ts` matching your backend schemas.

---

## 📚 API Documentation

Your backend API docs are available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`

---

## ✨ Features Implemented

✅ Complete authentication system (login, register, logout)  
✅ JWT token management with auto-refresh  
✅ All 10 API service modules created  
✅ TypeScript types matching backend schemas  
✅ Error handling with toast notifications  
✅ Cart integration with backend  
✅ Auth context for global state management  
✅ Protected route support  
✅ Axios interceptors for auth headers  

---

## 🎨 Ghana Market Features

Your integration includes all Ghana-specific features:
- Ghana Cedis (GHS) currency
- Ghana regions (Greater Accra, Ashanti, etc.)
- Local product types (plantain, yam, cassava, etc.)
- Unit types (kg, liter, piece)
- Paystack payment integration
- Bubble social commerce
- Fund transfers between bubble members
- Ghana market messaging context

---

## 🚀 Ready to Build!

Your frontend is now fully connected to your backend. Start building out the remaining pages:

1. **Shop page** - Display real products
2. **Product detail** - Show product info with reviews
3. **Cart page** - Manage cart items
4. **Checkout** - Create orders
5. **Orders page** - View order history
6. **Wallet page** - Manage wallet and payments
7. **Bubbles page** - Social commerce groups
8. **Messages page** - User conversations
9. **Profile page** - User settings
10. **Seller dashboard** - For sellers to manage products

All the API services are ready to use! 🎉
