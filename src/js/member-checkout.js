/*
 * Member Checkout (Frontend-only Showcase)
 * - Enhanced checkout for signed-in users with saved addresses, delivery options, and more
 */
(function () {
  'use strict';

  // Use lazy element selection
  let elementsCache = null;
  let handlersInitialized = false;
  
  function getElements() {
    if (!elementsCache) {
      elementsCache = {
        modal: document.getElementById('member-checkout-modal'),
        form: document.getElementById('member-checkout-form'),
        totalEl: document.getElementById('mcm-total'),
        cancelBtn: document.getElementById('mcm-cancel'),
        addressSelect: document.getElementById('mcm-address'),
        newAddressBtn: document.getElementById('mcm-new-address'),
        deliveryDaySelect: document.getElementById('mcm-delivery-day'),
        deliveryFeeEl: document.getElementById('mcm-delivery-fee'),
        paymentMethodSelect: document.getElementById('mcm-payment-method'),
      };
    }
    return elementsCache;
  }

  let currentCheckout = null;

  function formatCurrency(amount) {
    try {
      return `${window.cartManager?.defaultCurrency || '₵'}${parseFloat(amount || 0).toFixed(2)}`;
    } catch (_) {
      return `${amount}`;
    }
  }

  function getUserData() {
    try {
      if (window.GoShopAuth && window.GoShopAuth.getCurrentUser) {
        return window.GoShopAuth.getCurrentUser();
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function populateSavedAddresses() {
    const elements = getElements();
    const user = getUserData();
    
    if (!elements.addressSelect || !user) return;

    // Clear existing options
    elements.addressSelect.innerHTML = '<option value="">Select an address...</option>';
    
    // Add user's saved addresses
    if (user.addresses && user.addresses.length > 0) {
      user.addresses.forEach((address, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${address.label || `Address ${index + 1}`} - ${address.street}, ${address.city}`;
        elements.addressSelect.appendChild(option);
      });
    }

    // Add "New address" option
    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = '+ Add new address';
    elements.addressSelect.appendChild(newOption);
  }

  function populateDeliveryDays() {
    const elements = getElements();
    if (!elements.deliveryDaySelect) return;

    // Clear existing options
    elements.deliveryDaySelect.innerHTML = '<option value="">Select delivery day...</option>';

    // Generate next 7 days with cutoff validation
    const today = new Date();
    const cutoffHour = 15; // 3 PM cutoff for same-day delivery

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const isToday = i === 0;
      const currentHour = new Date().getHours();
      const isPastCutoff = isToday && currentHour >= cutoffHour;
      
      if (isPastCutoff && isToday) continue; // Skip today if past cutoff

      const option = document.createElement('option');
      option.value = date.toISOString().split('T')[0];
      
      let label = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (isToday) label += ' (Today)';
      if (i === 1) label += ' (Tomorrow)';
      
      option.textContent = label;
      elements.deliveryDaySelect.appendChild(option);
    }
  }

  function calculateDeliveryFee(deliveryDate) {
    if (!deliveryDate) return 0;
    
    const selectedDate = new Date(deliveryDate);
    const today = new Date();
    const daysDiff = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
    
    // Same day delivery: ₵15, Next day: ₵8, 2+ days: ₵5
    if (daysDiff === 0) return 15.00;
    if (daysDiff === 1) return 8.00;
    return 5.00;
  }

  function updateTotals() {
    const elements = getElements();
    if (!elements.totalEl || !currentCheckout) return;

    const deliveryFee = calculateDeliveryFee(elements.deliveryDaySelect?.value);
    const subtotal = currentCheckout.totals.subtotal || 0;
    const tax = currentCheckout.totals.tax || 0;
    const newTotal = subtotal + tax + deliveryFee;

    elements.totalEl.innerHTML = `
      <div>Subtotal: ${formatCurrency(subtotal)}</div>
      <div>Tax: ${formatCurrency(tax)}</div>
      <div>Delivery: ${formatCurrency(deliveryFee)}</div>
      <div style="font-weight: bold; border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px;">
        Total: ${formatCurrency(newTotal)}
      </div>
    `;

    if (elements.deliveryFeeEl) {
      elements.deliveryFeeEl.textContent = formatCurrency(deliveryFee);
    }
  }

  function openModal({ totals, items }) {
    currentCheckout = { totals, items };
    const elements = getElements();
    
    if (!elements.modal) {
      console.error('Member checkout modal not found');
      return;
    }

    // Initialize event handlers on first open
    initializeEventHandlers();
    
    // Populate form data
    populateSavedAddresses();
    populateDeliveryDays();
    updateTotals();
    
    // Show modal
    elements.modal.style.display = 'block';
    document.body.classList.add('no-scroll');
  }

  function closeModal() {
    const elements = getElements();
    if (elements.modal) elements.modal.style.display = 'none';
    document.body.classList.remove('no-scroll');
  }

  function saveMemberOrder(orderData) {
    try {
      const user = getUserData();
      if (!user) return null;

      const order = {
        id: `M-${Date.now()}`,
        userId: user.email,
        createdAt: new Date().toISOString(),
        ...orderData,
        status: 'confirmed',
        notifications: {
          placed: true,
          confirmed: false,
          outForDelivery: false,
          delivered: false
        }
      };

      // Save to user's order history
      const key = 'goshop_member_orders';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(order);
      localStorage.setItem(key, JSON.stringify(existing));

      // Also save last receipt for success page
      localStorage.setItem('goshop_last_receipt', JSON.stringify(order));

      return order;
    } catch (e) {
      console.error('Failed to persist member order', e);
      return null;
    }
  }

  function createMemberOrder() {
    const elements = getElements();
    const user = getUserData();
    
    if (!user || !currentCheckout) return null;

    const selectedAddressIndex = elements.addressSelect?.value;
    let address = null;
    
    if (selectedAddressIndex && selectedAddressIndex !== 'new') {
      address = user.addresses?.[parseInt(selectedAddressIndex)];
    }

    const deliveryDate = elements.deliveryDaySelect?.value;
    const deliveryFee = calculateDeliveryFee(deliveryDate);
    const paymentMethod = elements.paymentMethodSelect?.value || 'card';

    const items = (currentCheckout.items || []).map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    const totals = {
      ...currentCheckout.totals,
      deliveryFee,
      total: (currentCheckout.totals.subtotal || 0) + (currentCheckout.totals.tax || 0) + deliveryFee
    };

    return {
      items,
      totals,
      address,
      deliveryDate,
      paymentMethod,
      userEmail: user.email,
      userPhone: user.phone || ''
    };
  }

  // Initialize event handlers when needed
  function initializeEventHandlers() {
    if (handlersInitialized) return;
    handlersInitialized = true;
    
    const elements = getElements();
    
    // Close handlers
    if (elements.cancelBtn) {
      elements.cancelBtn.addEventListener('click', closeModal);
    }
    if (elements.modal) {
      elements.modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('mcm-backdrop')) closeModal();
      });
    }

    // Delivery day change handler
    if (elements.deliveryDaySelect) {
      elements.deliveryDaySelect.addEventListener('change', updateTotals);
    }

    // New address handler
    if (elements.newAddressBtn) {
      elements.newAddressBtn.addEventListener('click', () => {
        alert('Address management would open here in a full implementation');
      });
    }


    // Submit handler
    if (elements.form) {
      elements.form.addEventListener('submit', function (e) {
        e.preventDefault();
        
        const selectedAddress = elements.addressSelect?.value;
        const deliveryDate = elements.deliveryDaySelect?.value;
        
        if (!selectedAddress || selectedAddress === '') {
          alert('Please select a delivery address');
          return;
        }
        if (!deliveryDate) {
          alert('Please select a delivery day');
          return;
        }

        // Build and save order
        const orderData = createMemberOrder();
        if (!orderData) {
          alert('Failed to create order');
          return;
        }

        const order = saveMemberOrder(orderData);
        if (!order) {
          alert('Failed to save order');
          return;
        }

        // Clear selected items from cart
        try {
          if (window.cartManager) {
            const selected = window.cartManager.cart.items.filter(i => i.selected).map(i => i.id);
            selected.forEach(id => window.cartManager.removeFromCart(id));
          }
        } catch (e) {
          console.warn('Failed to trim cart after checkout', e);
        }

        // Dispatch order placed event for notifications
        document.dispatchEvent(new CustomEvent('orderPlaced', {
          detail: { orderId: order.id, order: order }
        }));

        // Close and redirect to success
        closeModal();
        window.location.href = 'order-success.html';
      });
    }
  }

  // Expose API
  window.MemberCheckout = { openModal, closeModal };
  
  // Debug log
  console.log('MemberCheckout module loaded successfully');
})();
