/**
 * Go-Shop Cart Management System
 * Handles all cart functionality including adding items, calculations, persistence
 */

class CartManager {
    constructor() {
        this.cart = this.loadCart();
        this.deliveryFee = 10.00;
        this.freeDeliveryThreshold = 100.00;
        this.taxRate = 0.125; // 12.5% VAT
        this.defaultCurrency = '₵';

        // Initialize cart system
        this.initializeCart();
        this.bindEvents();
        this.updateCartDisplay();
        this.updateCartBadge();
    }

    /**
     * Initialize cart system
     */
    initializeCart() {
        console.log('Cart Manager Initialized');
        console.log('Current cart:', this.cart);

        // Ensure cart structure
        if (!this.cart.items) this.cart.items = [];
        if (!this.cart.coupons) this.cart.coupons = [];
        if (!this.cart.giftWrap) this.cart.giftWrap = false;
        if (!this.cart.giftMessage) this.cart.giftMessage = '';
    }

    /**
     * Load cart from localStorage
     */
    loadCart() {
        try {
            const savedCart = localStorage.getItem('go-shop-cart');
            return savedCart ? JSON.parse(savedCart) : {
                items: [],
                coupons: [],
                giftWrap: false,
                giftMessage: '',
                lastUpdated: Date.now()
            };
        } catch (error) {
            console.error('Error loading cart:', error);
            return {
                items: [],
                coupons: [],
                giftWrap: false,
                giftMessage: '',
                lastUpdated: Date.now()
            };
        }
    }

    /**
     * Save cart to localStorage
     */
    saveCart() {
        try {
            this.cart.lastUpdated = Date.now();
            localStorage.setItem('go-shop-cart', JSON.stringify(this.cart));
            console.log('Cart saved successfully');
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    /**
     * Add item to cart
     */
    addToCart(item) {
        const {
            id,
            name,
            price,
            image,
            market = 'Unknown Market',
            description = '',
            category = 'Groceries'
        } = item;

        // Validate required fields
        if (!id || !name || !price) {
            console.error('Invalid item data:', item);
            return false;
        }

        // Check if item already exists
        const existingItemIndex = this.cart.items.findIndex(cartItem => cartItem.id === id);

        if (existingItemIndex !== -1) {
            // Update quantity if item exists
            this.cart.items[existingItemIndex].quantity += 1;
            console.log(`Updated quantity for ${name}`);
        } else {
            // Add new item
            const cartItem = {
                id,
                name,
                price: parseFloat(price),
                image,
                market,
                description,
                category,
                quantity: 1,
                selected: true,
                addedAt: Date.now()
            };

            this.cart.items.push(cartItem);
            console.log(`Added new item to cart: ${name}`);
        }

        this.saveCart();
        this.updateCartDisplay();
        this.updateCartBadge();
        this.showAddToCartFeedback(name);

        return true;
    }

    /**
     * Remove item from cart
     */
    removeFromCart(itemId) {
        const itemIndex = this.cart.items.findIndex(item => item.id === itemId);

        if (itemIndex !== -1) {
            const removedItem = this.cart.items.splice(itemIndex, 1)[0];
            console.log(`Removed ${removedItem.name} from cart`);

            this.saveCart();
            this.updateCartDisplay();
            this.updateCartBadge();

            return true;
        }

        return false;
    }

    /**
     * Update item quantity
     */
    updateQuantity(itemId, newQuantity) {
        const item = this.cart.items.find(item => item.id === itemId);

        if (item && newQuantity > 0) {
            item.quantity = parseInt(newQuantity);
            console.log(`Updated ${item.name} quantity to ${newQuantity}`);

            this.saveCart();
            this.updateCartDisplay();
            this.updateCartBadge();

            return true;
        } else if (item && newQuantity <= 0) {
            // Remove item if quantity is 0 or less
            return this.removeFromCart(itemId);
        }

        return false;
    }

    /**
     * Toggle item selection
     */
    toggleItemSelection(itemId) {
        const item = this.cart.items.find(item => item.id === itemId);

        if (item) {
            item.selected = !item.selected;
            console.log(`Toggled selection for ${item.name}: ${item.selected}`);

            this.saveCart();
            this.updateCartDisplay();

            return true;
        }

        return false;
    }

    /**
     * Select all items
     */
    selectAllItems(selected = true) {
        this.cart.items.forEach(item => {
            item.selected = selected;
        });

        console.log(`${selected ? 'Selected' : 'Deselected'} all items`);

        this.saveCart();
        this.updateCartDisplay();
    }

    /**
     * Add coupon
     */
    addCoupon(couponCode) {
        const coupon = this.validateCoupon(couponCode);

        if (coupon && !this.cart.coupons.find(c => c.code === couponCode)) {
            this.cart.coupons.push(coupon);
            console.log(`Applied coupon: ${couponCode}`);

            this.saveCart();
            this.updateCartDisplay();

            return true;
        }

        return false;
    }

    /**
     * Remove coupon
     */
    removeCoupon(couponCode) {
        const couponIndex = this.cart.coupons.findIndex(c => c.code === couponCode);

        if (couponIndex !== -1) {
            this.cart.coupons.splice(couponIndex, 1);
            console.log(`Removed coupon: ${couponCode}`);

            this.saveCart();
            this.updateCartDisplay();

            return true;
        }

        return false;
    }

    /**
     * Validate coupon code
     */
    validateCoupon(code) {
        const coupons = {
            'FRESH15': { code: 'FRESH15', discount: 0.15, type: 'percentage', minOrder: 50 },
            'MAX500': { code: 'MAX500', discount: 5.00, type: 'fixed', minOrder: 30 },
            'NEWUSER': { code: 'NEWUSER', discount: 0.20, type: 'percentage', minOrder: 25 },
            'SAVE10': { code: 'SAVE10', discount: 10.00, type: 'fixed', minOrder: 60 }
        };

        return coupons[code.toUpperCase()] || null;
    }

    /**
     * Toggle gift wrap
     */
    toggleGiftWrap() {
        this.cart.giftWrap = !this.cart.giftWrap;
        console.log(`Gift wrap ${this.cart.giftWrap ? 'enabled' : 'disabled'}`);

        this.saveCart();
        this.updateCartDisplay();
    }

    /**
     * Calculate cart totals
     */
    calculateTotals() {
        const selectedItems = this.cart.items.filter(item => item.selected);

        // Subtotal
        const subtotal = selectedItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        // Coupon discounts
        let totalDiscount = 0;
        this.cart.coupons.forEach(coupon => {
            if (subtotal >= coupon.minOrder) {
                if (coupon.type === 'percentage') {
                    totalDiscount += subtotal * coupon.discount;
                } else {
                    totalDiscount += coupon.discount;
                }
            }
        });

        // Delivery fee
        const deliveryFee = subtotal >= this.freeDeliveryThreshold ? 0 : this.deliveryFee;

        // Gift wrap fee
        const giftWrapFee = this.cart.giftWrap ? 20.00 : 0;

        // Tax calculation (on subtotal after discount but before delivery)
        const taxableAmount = Math.max(0, subtotal - totalDiscount + giftWrapFee);
        const tax = taxableAmount * this.taxRate;

        // Total
        const total = subtotal - totalDiscount + deliveryFee + giftWrapFee + tax;

        return {
            subtotal: Math.max(0, subtotal),
            discount: totalDiscount,
            deliveryFee,
            giftWrapFee,
            tax,
            total: Math.max(0, total),
            itemCount: selectedItems.reduce((count, item) => count + item.quantity, 0),
            selectedItemsCount: selectedItems.length
        };
    }

    /**
     * Get cart summary
     */
    getCartSummary() {
        return {
            items: this.cart.items,
            coupons: this.cart.coupons,
            giftWrap: this.cart.giftWrap,
            giftMessage: this.cart.giftMessage,
            totals: this.calculateTotals(),
            itemCount: this.cart.items.reduce((count, item) => count + item.quantity, 0)
        };
    }

    /**
     * Clear cart
     */
    clearCart() {
        this.cart = {
            items: [],
            coupons: [],
            giftWrap: false,
            giftMessage: '',
            lastUpdated: Date.now()
        };

        this.saveCart();
        this.updateCartDisplay();
        this.updateCartBadge();

        console.log('Cart cleared');
    }

    /**
     * Update cart badge in navigation
     */
    updateCartBadge() {
        const cartBadges = document.querySelectorAll('.c-nav-shop_num');
        const itemCount = this.cart.items.reduce((count, item) => count + item.quantity, 0);

        cartBadges.forEach(badge => {
            if (itemCount > 0) {
                badge.textContent = itemCount;
                badge.classList.remove('hide');
                badge.style.display = 'flex';
            } else {
                badge.classList.add('hide');
                badge.style.display = 'none';
            }
        });
    }

    /**
     * Show add to cart feedback
     */
    showAddToCartFeedback(itemName) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <div class="cart-notification-content">
                <div class="cart-notification-icon">✓</div>
                <div class="cart-notification-text">
                    <strong>Added to cart!</strong><br>
                    ${itemName}
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Update cart display on cart page
     */
    updateCartDisplay() {
        // Only update if we're on the cart page
        if (!document.querySelector('.cart-section')) return;

        const summary = this.getCartSummary();

        // Update cart items
        this.renderCartItems(summary.items);

        // Update cart summary
        this.renderCartSummary(summary.totals);

        // Update select all checkbox
        this.updateSelectAllCheckbox();
    }

    /**
     * Render cart items
     */
    renderCartItems(items) {
        const cartList = document.querySelector('.cart-list');
        if (!cartList) return;

        if (items.length === 0) {
            cartList.innerHTML = `
                <li class="cart-empty">
                    <div class="cart-empty-content">
                        <div class="cart-empty-icon">🛒</div>
                        <h3>Your cart is empty</h3>
                        <p>Add some fresh groceries to get started!</p>
                        <a href="recipes-hub.html" class="cart-empty-btn">Start Shopping</a>
                    </div>
                </li>
            `;
            return;
        }

        cartList.innerHTML = items.map(item => `
            <li class="cart-item" data-item-id="${item.id}">
                <div class="ci-left">
                    <input class="ci-check" type="checkbox" ${item.selected ? 'checked' : ''} 
                           aria-label="Select ${item.name}" data-action="toggle-selection" />
                    <div class="ci-thumb">
                        <img src="${item.image}" alt="${item.name}" />
                    </div>
                    <div class="ci-info">
                        <div class="ci-title">${item.name}</div>
                        <div class="ci-meta">
                            <span>${item.market}</span>
                            <span>${item.category}</span>
                            <span>Express delivery in <strong>2-3 days</strong></span>
                        </div>
                        <button class="ci-remove" type="button" aria-label="Remove ${item.name}" 
                                data-action="remove-item">×</button>
                    </div>
                </div>
                <div class="ci-right">
                    <div class="ci-price">${this.defaultCurrency}${item.price.toFixed(2)}</div>
                    <div class="ci-qty" aria-label="Quantity selector">
                        <button type="button" class="qty-btn" aria-label="Decrease quantity" 
                                data-action="decrease-qty">−</button>
                        <input type="text" value="${item.quantity}" inputmode="numeric" 
                               aria-label="Quantity" data-action="update-qty" />
                        <button type="button" class="qty-btn" aria-label="Increase quantity" 
                                data-action="increase-qty">+</button>
                    </div>
                </div>
            </li>
        `).join('');
    }

    /**
     * Render cart summary
     */
    renderCartSummary(totals) {
        const priceCard = document.querySelector('.cs-card.cs-price');
        if (!priceCard) return;

        const selectedItems = this.cart.items.filter(item => item.selected);

        priceCard.innerHTML = `
            <div class="cs-title">Price Details</div>
            <div class="cs-line">
                <span>${totals.selectedItemsCount} item${totals.selectedItemsCount !== 1 ? 's' : ''}</span>
                <span>${this.defaultCurrency}${totals.subtotal.toFixed(2)}</span>
            </div>
            ${selectedItems.map(item => `
                <div class="cs-line sub">
                    <span>${item.quantity} × ${item.name}</span>
                    <span>${this.defaultCurrency}${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
            ${totals.discount > 0 ? `
                <div class="cs-line green">
                    <span>Coupon discount</span>
                    <span>−${this.defaultCurrency}${totals.discount.toFixed(2)}</span>
                </div>
            ` : ''}
            ${totals.giftWrapFee > 0 ? `
                <div class="cs-line">
                    <span>Gift wrap</span>
                    <span>${this.defaultCurrency}${totals.giftWrapFee.toFixed(2)}</span>
                </div>
            ` : ''}
            <div class="cs-line">
                <span>Delivery Charges</span>
                <span class="${totals.deliveryFee === 0 ? 'free' : ''}">${totals.deliveryFee === 0 ? 'Free Delivery' : this.defaultCurrency + totals.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="cs-line">
                <span>Tax (12.5%)</span>
                <span>${this.defaultCurrency}${totals.tax.toFixed(2)}</span>
            </div>
            <div class="cs-total">
                <span>Total Amount</span>
                <span>${this.defaultCurrency}${totals.total.toFixed(2)}</span>
            </div>
            <button class="cs-place" type="button" ${totals.selectedItemsCount === 0 ? 'disabled' : ''}>
                Place order →
            </button>
        `;
    }

    /**
     * Update select all checkbox
     */
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.querySelector('#select-all');
        const selectAllLabel = document.querySelector('label[for="select-all"]');

        if (!selectAllCheckbox || !selectAllLabel) return;

        const selectedItems = this.cart.items.filter(item => item.selected);
        const totalItems = this.cart.items.length;

        selectAllCheckbox.checked = totalItems > 0 && selectedItems.length === totalItems;
        selectAllCheckbox.indeterminate = selectedItems.length > 0 && selectedItems.length < totalItems;

        selectAllLabel.textContent = `${selectedItems.length}/${totalItems} items selected`;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Cart page events
        document.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            const cartItem = e.target.closest('.cart-item');
            const itemId = cartItem?.getAttribute('data-item-id');

            switch (action) {
                case 'toggle-selection':
                    if (itemId) this.toggleItemSelection(itemId);
                    break;

                case 'remove-item':
                    if (itemId) this.removeFromCart(itemId);
                    break;

                case 'decrease-qty':
                    if (itemId) {
                        const currentQty = parseInt(cartItem.querySelector('[data-action="update-qty"]').value);
                        this.updateQuantity(itemId, currentQty - 1);
                    }
                    break;

                case 'increase-qty':
                    if (itemId) {
                        const currentQty = parseInt(cartItem.querySelector('[data-action="update-qty"]').value);
                        this.updateQuantity(itemId, currentQty + 1);
                    }
                    break;
            }
        });

        // Quantity input changes
        document.addEventListener('change', (e) => {
            if (e.target.getAttribute('data-action') === 'update-qty') {
                const cartItem = e.target.closest('.cart-item');
                const itemId = cartItem?.getAttribute('data-item-id');
                const newQty = parseInt(e.target.value);

                if (itemId && !isNaN(newQty)) {
                    this.updateQuantity(itemId, newQty);
                }
            }
        });

        // Select all checkbox
        document.addEventListener('change', (e) => {
            if (e.target.id === 'select-all') {
                this.selectAllItems(e.target.checked);
            }
        });

        // Cart actions in header
        document.addEventListener('click', (e) => {
            if (e.target.closest('.link-btn')) {
                const buttonText = e.target.textContent.trim();

                if (buttonText === 'Remove') {
                    const selectedItems = this.cart.items.filter(item => item.selected);
                    selectedItems.forEach(item => this.removeFromCart(item.id));
                }
            }
        });
    }

    /**
     * Format price with currency
     */
    formatPrice(price) {
        return `${this.defaultCurrency}${parseFloat(price).toFixed(2)}`;
    }
}

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();

    // Add CSS for cart notifications
    if (!document.querySelector('#cart-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'cart-notification-styles';
        style.textContent = `
            .cart-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #4caf50, #45a049);
                color: white;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                max-width: 300px;
                font-family: Sofiapro, sans-serif;
            }
            
            .cart-notification.show {
                transform: translateX(0);
            }
            
            .cart-notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .cart-notification-icon {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                flex-shrink: 0;
            }
            
            .cart-notification-text {
                font-size: 14px;
                line-height: 1.4;
            }
            
            .cart-empty {
                padding: 60px 20px;
                text-align: center;
                color: #666;
            }
            
            .cart-empty-content {
                max-width: 300px;
                margin: 0 auto;
            }
            
            .cart-empty-icon {
                font-size: 48px;
                margin-bottom: 20px;
                opacity: 0.5;
            }
            
            .cart-empty h3 {
                margin: 0 0 12px;
                font-size: 24px;
                color: #333;
            }
            
            .cart-empty p {
                margin: 0 0 24px;
                font-size: 16px;
                line-height: 1.5;
            }
            
            .cart-empty-btn {
                display: inline-block;
                padding: 12px 24px;
                background: var(--clr-yellow-01, #FED141);
                color: var(--clr-charcoal-01, #303A4D);
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .cart-empty-btn:hover {
                background: #e6c236;
                transform: translateY(-2px);
            }
            
            @media (max-width: 768px) {
                .cart-notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                    transform: translateY(-100px);
                }
                
                .cart-notification.show {
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManager;
}
