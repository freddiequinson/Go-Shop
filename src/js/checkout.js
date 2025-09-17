/*
 * Guest Checkout (Frontend-only Showcase)
 * - Captures email/phone, creates a local "order", and shows a success receipt
 */
(function () {
  'use strict';

  // Use lazy element selection instead of immediate selection
  let elementsCache = null;
  let handlersInitialized = false;
  
  function getElements() {
    if (!elementsCache) {
      elementsCache = {
        modal: document.getElementById('guest-checkout-modal'),
        form: document.getElementById('guest-checkout-form'),
        totalEl: document.getElementById('gcm-total'),
        subtotalEl: document.getElementById('gcm-subtotal'),
        deliveryFeeEl: document.getElementById('gcm-delivery-fee'),
        cancelBtn: document.getElementById('gcm-cancel'),
        emailInput: document.getElementById('gcm-email'),
        phoneInput: document.getElementById('gcm-phone'),
        deliveryDaySelect: document.getElementById('gcm-delivery-day'),
        pmType: document.getElementById('gcm-payment-type'),
        momoFields: document.getElementById('gcm-momo-fields'),
        momoProvider: document.getElementById('gcm-momo-provider'),
        momoNumber: document.getElementById('gcm-momo-number')
      };
      console.log('Checkout elements found:', {
        modal: !!elementsCache.modal,
        form: !!elementsCache.form,
        totalEl: !!elementsCache.totalEl,
        cancelBtn: !!elementsCache.cancelBtn,
        emailInput: !!elementsCache.emailInput,
        phoneInput: !!elementsCache.phoneInput,
        pmType: !!elementsCache.pmType
      });
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
      const isAfterCutoff = isToday && today.getHours() >= cutoffHour;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
      
      // Skip weekends and today if after cutoff
      if (isWeekend || (isToday && isAfterCutoff)) {
        continue;
      }
      
      const option = document.createElement('option');
      option.value = date.toISOString().split('T')[0];
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (isToday) {
        option.textContent = `Today (${dateStr}) - Same day delivery`;
      } else if (i === 1) {
        option.textContent = `Tomorrow (${dayName}, ${dateStr}) - Next day delivery`;
      } else {
        option.textContent = `${dayName}, ${dateStr} - Standard delivery`;
      }
      
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
    const subtotal = currentCheckout.totals?.subtotal || 0;
    const total = subtotal + deliveryFee;

    if (elements.subtotalEl) {
      elements.subtotalEl.textContent = formatCurrency(subtotal);
    }
    if (elements.deliveryFeeEl) {
      elements.deliveryFeeEl.textContent = formatCurrency(deliveryFee);
    }
    if (elements.totalEl) {
      elements.totalEl.textContent = formatCurrency(total);
    }
  }

  function openModal({ totals, items }) {
    currentCheckout = { totals, items };
    const elements = getElements();
    if (!elements.modal) {
      console.error('Guest checkout modal not found');
      return;
    }
    
    // Initialize event handlers on first open
    initializeEventHandlers();
    
    // Populate delivery days
    populateDeliveryDays();
    
    // Reset form fields
    if (elements.emailInput) elements.emailInput.value = '';
    if (elements.phoneInput) elements.phoneInput.value = '';
    if (elements.deliveryDaySelect) elements.deliveryDaySelect.value = '';
    if (elements.pmType) elements.pmType.value = '';
    if (elements.momoProvider) elements.momoProvider.value = '';
    if (elements.momoNumber) elements.momoNumber.value = '';
    if (elements.momoFields) elements.momoFields.style.display = 'none';
    
    // Update totals display
    updateTotals();
    elements.modal.style.display = 'block';
    document.body.classList.add('no-scroll');
  }

  function closeModal() {
    const elements = getElements();
    if (elements.modal) elements.modal.style.display = 'none';
    document.body.classList.remove('no-scroll');
  }

  function saveGuestOrder(order) {
    try {
      const key = 'goshop_guest_orders';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(order);
      localStorage.setItem(key, JSON.stringify(existing));
      // Also save last receipt for success page
      localStorage.setItem('goshop_last_receipt', JSON.stringify(order));
    } catch (e) {
      console.error('Failed to persist guest order', e);
    }
  }

  function createGuestOrder(email, phone, payment, deliveryDate, deliveryFee) {
    const id = `G-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const items = (currentCheckout?.items || []).map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));
    const subtotal = currentCheckout?.totals?.subtotal || 0;
    const total = subtotal + (deliveryFee || 0);
    const totals = { 
      subtotal, 
      deliveryFee: deliveryFee || 0, 
      total 
    };
    return { 
      id, 
      createdAt, 
      email, 
      phone, 
      items, 
      totals, 
      payment, 
      deliveryDate,
      deliveryFee: deliveryFee || 0,
      status: 'paid' 
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
        if (e.target.classList.contains('gcm-backdrop')) closeModal();
      });
    }

    // Delivery day change handler
    if (elements.deliveryDaySelect) {
      elements.deliveryDaySelect.addEventListener('change', () => {
        updateTotals();
      });
    }

    // Payment method toggle
    if (elements.pmType) {
      elements.pmType.addEventListener('change', () => {
        const type = elements.pmType.value;
        
        if (type === 'card') {
          // Redirect to login for card payments
          alert('Please sign in to use credit/debit cards. You will be redirected to the login page.');
          closeModal();
          window.location.href = 'auth.html';
          return;
        }
        
        if (elements.momoFields) {
          elements.momoFields.style.display = type === 'momo' ? 'flex' : 'none';
        }
      });
    }

    // Submit handler (simulate payment then redirect)
    if (elements.form) {
      elements.form.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = elements.emailInput?.value.trim();
        const phone = elements.phoneInput?.value.trim();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          alert('Please enter a valid email');
          return;
        }
        if (!phone || phone.length < 7) {
          alert('Please enter a valid phone');
          return;
        }

        // Delivery day validation
        const deliveryDate = elements.deliveryDaySelect?.value;
        if (!deliveryDate) {
          alert('Please select a delivery day');
          return;
        }

        // Payment validation (guests can only use mobile money)
        const pmType = elements.pmType?.value || '';
        if (!pmType || pmType !== 'momo') {
          alert('Please select Mobile Money as your payment method');
          return;
        }

        // Validate mobile money fields
        const provider = elements.momoProvider?.value.trim();
        const number = elements.momoNumber?.value.trim();
        if (!provider || !number || number.length < 10) {
          alert('Please select a mobile money provider and enter a valid phone number');
          return;
        }
        
        const payment = { type: 'momo', provider, number };
        const deliveryFee = calculateDeliveryFee(deliveryDate);

        // Build order with delivery info
        const order = createGuestOrder(email, phone, payment, deliveryDate, deliveryFee);
        saveGuestOrder(order);

        // Clear selected items from cart (simulate fulfillment)
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
  window.GuestCheckout = { openModal, closeModal };
  
  // Debug log
  console.log('GuestCheckout module loaded successfully');
})();


