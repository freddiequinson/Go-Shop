# Go-Shop Cart Management System

A comprehensive shopping cart system for the Go-Shop grocery delivery platform, featuring real-time updates, persistent storage, cost calculations, and coupon management.

## 🚀 Features

### Core Functionality
- ✅ **Add to Cart** - Products from recipes-hub.html sidebar
- ✅ **Cart Persistence** - localStorage saves cart between sessions
- ✅ **Real-time Updates** - Cart badge updates automatically
- ✅ **Dynamic Calculations** - Subtotal, tax, delivery, and total calculations
- ✅ **Item Management** - Quantity updates, item removal, selection

### Advanced Features
- ✅ **Coupon System** - Apply/remove discount coupons
- ✅ **Gift Wrapping** - Optional gift wrap with custom message
- ✅ **Tax Calculation** - 12.5% VAT automatically calculated
- ✅ **Free Delivery** - Automatic free delivery over ₵100
- ✅ **Empty Cart State** - Helpful messaging when cart is empty
- ✅ **Mobile Responsive** - Works on all device sizes

## 📁 Files Structure

```
src/js/cart-manager.js          # Main cart management system
src/css/cart.css               # Enhanced cart page styles
recipes-hub.html               # Updated with cart integration
cart.html                      # Enhanced cart page
cart-demo.html                 # Demo page for testing
```

## 🛠 Implementation Details

### Cart Manager Class
The `CartManager` class handles all cart operations:

```javascript
// Initialize cart manager
const cartManager = new CartManager();

// Add item to cart
cartManager.addToCart({
    id: 'unique-product-id',
    name: 'Product Name',
    price: 15.00,
    image: 'product-image.jpg',
    market: 'Market Name',
    description: 'Product description',
    category: 'Fresh Produce'
});
```

### Available Coupons
- `FRESH15` - 15% off orders over ₵50
- `MAX500` - ₵5 off orders over ₵30
- `NEWUSER` - 20% off orders over ₵25
- `SAVE10` - ₵10 off orders over ₵60

### Cost Calculation Formula
```
Subtotal = Sum of (item.price × item.quantity)
Discount = Applied coupon discounts
Tax = (Subtotal - Discount + Gift Wrap) × 12.5%
Delivery = ₵10 (free if subtotal ≥ ₵100)
Gift Wrap = ₵20 (if enabled)
Total = Subtotal - Discount + Tax + Delivery + Gift Wrap
```

## 🔧 Usage

### Adding Products from Recipes Hub
1. Visit `recipes-hub.html`
2. Click "View Products" on any market card
3. Browse products in the sidebar
4. Click "Add to Cart" on any product
5. See instant feedback and cart badge update

### Managing Cart
1. Visit `cart.html`
2. Select/deselect items using checkboxes
3. Update quantities using +/- buttons
4. Apply coupons in the coupon section
5. Add gift wrap and message if needed
6. Place order when ready

### Testing the System
1. Open `cart-demo.html` in your browser
2. Use the demo buttons to test all features
3. Check cart persistence by refreshing the page

## 🎨 UI Features

### Visual Feedback
- ✅ Success notifications when adding items
- ✅ Animated buttons with ripple effects
- ✅ Real-time cart badge updates
- ✅ Color-coded messages (success/error)

### Responsive Design
- ✅ Mobile-first approach
- ✅ Touch-friendly interfaces
- ✅ Optimized for all screen sizes
- ✅ Accessible form controls

## 🔄 Data Persistence

The cart system automatically saves to localStorage:
- Cart items and quantities
- Selected items
- Applied coupons
- Gift wrap preferences
- Gift messages

Data persists across:
- Page refreshes
- Browser sessions
- Navigation between pages

## 🧪 Testing

### Manual Testing
1. Add products from different markets
2. Test quantity updates and item removal
3. Apply various coupons
4. Enable/disable gift wrap
5. Check calculations are correct
6. Verify persistence after refresh

### Coupon Testing
```javascript
// Test coupon application
cartManager.addCoupon('FRESH15');  // Should work with ₵50+ order
cartManager.addCoupon('INVALID');  // Should fail gracefully
```

## 📱 Mobile Support

The cart system is fully responsive:
- Touch-friendly quantity controls
- Swipe-friendly notifications
- Optimized layouts for small screens
- Accessible form inputs

## 🚀 Future Enhancements

Potential improvements:
- Order tracking integration
- Multiple delivery addresses
- Scheduled delivery options
- Wishlist functionality
- Product recommendations
- Social sharing

## 💡 Key Technical Features

### Performance
- Efficient localStorage usage
- Minimal DOM manipulations
- Optimized event handling
- Lazy loading where appropriate

### Security
- Input validation for all user data
- XSS protection in dynamic content
- Safe JSON parsing
- Error boundary handling

### Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast support
- Focus management

---

**Note**: This cart system is designed to work seamlessly with the existing Go-Shop theme and components. All styling follows the established design system using CSS custom properties for consistent theming.
