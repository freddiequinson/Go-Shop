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
        cancelBtn: document.getElementById('gcm-cancel'),
        emailInput: document.getElementById('gcm-email'),
        phoneInput: document.getElementById('gcm-phone'),
        pmType: document.getElementById('gcm-payment-type'),
        cardFields: document.getElementById('gcm-card-fields'),
        momoFields: document.getElementById('gcm-momo-fields'),
        cardType: document.getElementById('gcm-card-type'),
        last4: document.getElementById('gcm-card-last4'),
        expMonth: document.getElementById('gcm-exp-month'),
        expYear: document.getElementById('gcm-exp-year'),
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

  function openModal({ totals, items }) {
    currentCheckout = { totals, items };
    const elements = getElements();
    if (!elements.modal) {
      console.error('Guest checkout modal not found');
      return;
    }
    
    // Initialize event handlers on first open
    initializeEventHandlers();
    
    if (elements.totalEl && totals) {
      elements.totalEl.textContent = `Total: ${formatCurrency(totals.total)}`;
    }
    if (elements.emailInput) elements.emailInput.value = '';
    if (elements.phoneInput) elements.phoneInput.value = '';
    if (elements.pmType) elements.pmType.value = '';
    if (elements.cardType) elements.cardType.value = '';
    if (elements.last4) elements.last4.value = '';
    if (elements.expMonth) elements.expMonth.value = '';
    if (elements.expYear) elements.expYear.value = '';
    if (elements.momoProvider) elements.momoProvider.value = '';
    if (elements.momoNumber) elements.momoNumber.value = '';
    if (elements.cardFields) elements.cardFields.style.display = 'none';
    if (elements.momoFields) elements.momoFields.style.display = 'none';
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

  function createGuestOrder(email, phone, payment) {
    const id = `G-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const items = (currentCheckout?.items || []).map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));
    const totals = currentCheckout?.totals || { subtotal: 0, total: 0 };
    return { id, createdAt, email, phone, items, totals, payment, status: 'paid' };
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

    // Payment method toggle
    if (elements.pmType) {
      elements.pmType.addEventListener('change', () => {
        const type = elements.pmType.value;
        if (elements.cardFields) {
          elements.cardFields.style.display = type === 'card' ? 'grid' : 'none';
        }
        if (elements.momoFields) {
          elements.momoFields.style.display = type === 'momo' ? 'grid' : 'none';
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

        // Payment validation (guests must select/add payment)
        const pmType = elements.pmType?.value || '';
        if (!pmType) {
          alert('Please select a payment method');
          return;
        }

        let payment = { type: pmType };
        if (pmType === 'card') {
          const cardType = elements.cardType?.value.trim();
          const last4 = elements.last4?.value.trim();
          const expMonth = elements.expMonth?.value.trim();
          const expYear = elements.expYear?.value.trim();
          if (!cardType || !last4 || last4.length !== 4) {
            alert('Please provide card type and last 4 digits');
            return;
          }
          payment = { type: 'card', cardType, lastFour: last4, expiryMonth: expMonth, expiryYear: expYear };
        } else if (pmType === 'momo') {
          const provider = elements.momoProvider?.value.trim();
          const number = elements.momoNumber?.value.trim();
          if (!provider || !number || number.length < 10) {
            alert('Please select a mobile money provider and enter a valid phone number');
            return;
          }
          payment = { type: 'momo', provider, number };
        }

        // Build order
        const order = createGuestOrder(email, phone, payment);
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


