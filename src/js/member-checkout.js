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
        subtotalEl: document.getElementById('mcm-subtotal'),
        deliveryFeeEl: document.getElementById('mcm-delivery-fee'),
        cancelBtn: document.getElementById('mcm-cancel'),
        addressSelect: document.getElementById('mcm-address'),
        newAddressBtn: document.getElementById('mcm-new-address'),
        deliveryDaySelect: document.getElementById('mcm-delivery-day'),
        paymentMethodSelect: document.getElementById('mcm-payment-method'),
        addPaymentBtn: document.getElementById('mcm-add-payment'),
        addPaymentForm: document.getElementById('mcm-add-payment-form'),
        pmType: document.getElementById('mcm-pm-type'),
        cardType: document.getElementById('mcm-card-type'),
        cardLast4: document.getElementById('mcm-card-last4'),
        expMonth: document.getElementById('mcm-exp-month'),
        expYear: document.getElementById('mcm-exp-year'),
        pmDefault: document.getElementById('mcm-pm-default'),
        savePaymentBtn: document.getElementById('mcm-save-payment'),
        cancelPaymentBtn: document.getElementById('mcm-cancel-payment'),
        // New summary elements
        compactSummary: document.getElementById('mcm-compact-summary'),
        addressDisplay: document.getElementById('mcm-address-display'),
        deliveryDisplay: document.getElementById('mcm-delivery-display'),
        feeDisplay: document.getElementById('mcm-fee-display'),
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
    
    let defaultAddressIndex = -1;
    
    // Add user's saved addresses
    if (user.addresses && user.addresses.length > 0) {
      user.addresses.forEach((address, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${address.label || `Address ${index + 1}`} - ${address.street}, ${address.city}`;
        
        // Mark default address
        if (address.isDefault) {
          defaultAddressIndex = index;
          option.textContent += ' (Default)';
        }
        
        elements.addressSelect.appendChild(option);
      });
    }

    // Add "New address" option
    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = '+ Add new address';
    elements.addressSelect.appendChild(newOption);
    
    // Preselect default address
    if (defaultAddressIndex !== -1) {
      elements.addressSelect.value = defaultAddressIndex;
      updateCompactSummary();
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

  function populatePaymentMethods() {
    const elements = getElements();
    if (!elements.paymentMethodSelect) return;
    const user = getUserData();

    // Clear existing options
    elements.paymentMethodSelect.innerHTML = '';

    const methods = (user && user.paymentMethods) ? user.paymentMethods : [];

    if (methods.length > 0) {
      methods.forEach((pm, idx) => {
        let label = 'Payment Method';
        
        if (pm.type === 'card') {
          label = `${pm.cardType || 'Card'} •••• ${pm.lastFour || 'XXXX'}`;
        } else if (pm.type === 'momo') {
          const provider = pm.provider || 'Mobile Money';
          const lastFour = pm.phoneNumber ? pm.phoneNumber.slice(-4) : 'XXXX';
          label = `${provider} •••• ${lastFour}`;
        } else if (pm.type === 'cash') {
          label = 'Cash on Delivery';
        } else if (pm.label) {
          label = pm.label;
        }
        
        const option = document.createElement('option');
        option.value = pm.id || String(idx);
        option.textContent = label;
        elements.paymentMethodSelect.appendChild(option);
      });
    } else {
      // No payment methods → show placeholder and disable select
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No payment methods saved';
      elements.paymentMethodSelect.appendChild(option);
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

    // Update breakdown display
    if (elements.subtotalEl) {
      elements.subtotalEl.textContent = formatCurrency(subtotal);
    }
    if (elements.deliveryFeeEl) {
      elements.deliveryFeeEl.textContent = formatCurrency(deliveryFee);
    }
    if (elements.totalEl) {
      elements.totalEl.textContent = formatCurrency(newTotal);
    }

    // Update compact summary
    updateCompactSummary();
  }

  function updateCompactSummary() {
    const elements = getElements();
    if (!elements.compactSummary) return;

    const addressIndex = elements.addressSelect?.value;
    const deliveryDate = elements.deliveryDaySelect?.value;
    const user = getUserData();

    // Check if we have all required info to show summary
    const hasAddress = addressIndex && addressIndex !== '' && addressIndex !== 'new';
    const hasDelivery = deliveryDate && deliveryDate !== '';

    if (hasAddress && hasDelivery) {
      // Show compact summary
      elements.compactSummary.style.display = 'block';

      // Update address display
      if (user && user.addresses && user.addresses[addressIndex]) {
        const address = user.addresses[addressIndex];
        elements.addressDisplay.textContent = `${address.label || 'Address'} - ${address.street}, ${address.city}`;
      }

      // Update delivery display
      if (deliveryDate) {
        const date = new Date(deliveryDate);
        const today = new Date();
        const daysDiff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        
        let deliveryText = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
        
        if (daysDiff === 0) deliveryText += ' (Today)';
        else if (daysDiff === 1) deliveryText += ' (Tomorrow)';
        
        elements.deliveryDisplay.textContent = deliveryText;
      }

      // Update fee display
      const deliveryFee = calculateDeliveryFee(deliveryDate);
      elements.feeDisplay.textContent = formatCurrency(deliveryFee);
    } else {
      // Hide compact summary
      elements.compactSummary.style.display = 'none';
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
    populatePaymentMethods();
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
    const paymentMethod = elements.paymentMethodSelect?.value || '';

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

    // Address change handler
    if (elements.addressSelect) {
      elements.addressSelect.addEventListener('change', updateCompactSummary);
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

    // Add payment method handler → redirect to profile payments tab
    if (elements.addPaymentBtn) {
      elements.addPaymentBtn.addEventListener('click', () => {
        try {
          // Persist intent so profile can auto-open the Payment Methods tab
          localStorage.setItem('goshop_deeplink', JSON.stringify({ target: 'profile', tab: 'payment' }));
        } catch (_) {}
        window.location.href = 'profile.html#payment';
      });
    }

    // Cancel payment method handler
    if (elements.cancelPaymentBtn) {
      elements.cancelPaymentBtn.addEventListener('click', () => {
        if (elements.addPaymentForm) {
          elements.addPaymentForm.style.display = 'none';
          // Clear form
          if (elements.cardType) elements.cardType.value = '';
          if (elements.cardLast4) elements.cardLast4.value = '';
          if (elements.expMonth) elements.expMonth.value = '';
          if (elements.expYear) elements.expYear.value = '';
          if (elements.pmDefault) elements.pmDefault.checked = false;
        }
      });
    }

    // Save payment method handler
    if (elements.savePaymentBtn) {
      elements.savePaymentBtn.addEventListener('click', () => {
        const pmType = elements.pmType?.value || 'card';
        const cardType = elements.cardType?.value.trim();
        const last4 = elements.cardLast4?.value.trim();
        const expMonth = elements.expMonth?.value.trim();
        const expYear = elements.expYear?.value.trim();
        const isDefault = elements.pmDefault?.checked || false;

        if (!cardType || !last4 || last4.length !== 4) {
          alert('Please provide card type and last 4 digits');
          return;
        }

        // Get current user data
        const user = getUserData();
        if (!user) {
          alert('User not found');
          return;
        }

        // Create new payment method
        const newPaymentMethod = {
          id: `pm_${Date.now()}`,
          type: pmType,
          cardType: cardType,
          lastFour: last4,
          expiryMonth: expMonth,
          expiryYear: expYear,
          isDefault: isDefault
        };

        // Add to user's payment methods
        if (!user.paymentMethods) {
          user.paymentMethods = [];
        }
        user.paymentMethods.push(newPaymentMethod);

        // If this is set as default, unset others
        if (isDefault) {
          user.paymentMethods.forEach(pm => {
            if (pm.id !== newPaymentMethod.id) {
              pm.isDefault = false;
            }
          });
        }

        // Save updated user data
        try {
          localStorage.setItem('goshop_user', JSON.stringify(user));
          
          // Refresh payment method dropdown
          populatePaymentMethods();
          
          // Hide the form
          if (elements.addPaymentForm) {
            elements.addPaymentForm.style.display = 'none';
          }
          
          // Clear form
          if (elements.cardType) elements.cardType.value = '';
          if (elements.cardLast4) elements.cardLast4.value = '';
          if (elements.expMonth) elements.expMonth.value = '';
          if (elements.expYear) elements.expYear.value = '';
          if (elements.pmDefault) elements.pmDefault.checked = false;
          
          alert('Payment method added successfully!');
        } catch (e) {
          console.error('Failed to save payment method', e);
          alert('Failed to save payment method');
        }
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

        // Require saved payment method
        const pmVal = elements.paymentMethodSelect?.value || '';
        const user = getUserData();
        const hasMethods = Array.isArray(user?.paymentMethods) && user.paymentMethods.length > 0;
        if (!hasMethods || !pmVal) {
          alert('Please add a payment method in your profile before checkout.');
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
