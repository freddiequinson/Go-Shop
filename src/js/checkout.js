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
        phoneInput: document.getElementById('gcm-phone')
      };
      console.log('Checkout elements found:', {
        modal: !!elementsCache.modal,
        form: !!elementsCache.form,
        totalEl: !!elementsCache.totalEl,
        cancelBtn: !!elementsCache.cancelBtn,
        emailInput: !!elementsCache.emailInput,
        phoneInput: !!elementsCache.phoneInput
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

  function createGuestOrder(email, phone) {
    const id = `G-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const items = (currentCheckout?.items || []).map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));
    const totals = currentCheckout?.totals || { subtotal: 0, total: 0 };
    return { id, createdAt, email, phone, items, totals, status: 'paid' };
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

        // Build order
        const order = createGuestOrder(email, phone);
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


