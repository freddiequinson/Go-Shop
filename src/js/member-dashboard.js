/*
 * Member Dashboard (Frontend-only Showcase)
 * - Order history, receipt downloads, saved items, and address management
 */
(function () {
  'use strict';

  function formatCurrency(amount) {
    try {
      return `₵${parseFloat(amount || 0).toFixed(2)}`;
    } catch (_) {
      return `₵0.00`;
    }
  }

  function formatDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return 'Unknown date';
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

  function getMemberOrders() {
    try {
      const orders = localStorage.getItem('goshop_member_orders');
      return orders ? JSON.parse(orders) : [];
    } catch (e) {
      return [];
    }
  }

  function getOrderStatusBadge(status) {
    const badges = {
      'confirmed': { color: '#22c55e', text: 'Confirmed' },
      'preparing': { color: '#f59e0b', text: 'Preparing' },
      'out_for_delivery': { color: '#3b82f6', text: 'Out for Delivery' },
      'delivered': { color: '#10b981', text: 'Delivered' },
      'cancelled': { color: '#ef4444', text: 'Cancelled' }
    };
    
    const badge = badges[status] || { color: '#6b7280', text: 'Unknown' };
    return `<span style="background: ${badge.color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75em; font-weight: 600;">${badge.text}</span>`;
  }

  function renderOrderHistory() {
    const container = document.getElementById('order-history-container');
    if (!container) return;

    const orders = getMemberOrders();
    const user = getUserData();

    if (!user) {
      container.innerHTML = '<div class="t-body-2" style="text-align: center; padding: 2rem; opacity: 0.7;">Please sign in to view your orders.</div>';
      return;
    }

    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem;">
          <div style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;">📦</div>
          <div class="t-body-2" style="opacity: 0.7; margin-bottom: 1rem;">No orders yet</div>
          <a href="shop.html" class="c-btn" style="padding: 8px 16px; border-radius: 8px;">Start Shopping</a>
        </div>
      `;
      return;
    }

    const ordersHtml = orders.map(order => `
      <div class="order-item" style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div>
            <div class="t-body-2" style="font-weight: 600;">Order #${order.id}</div>
            <div class="t-body-3" style="opacity: 0.7;">${formatDate(order.createdAt)}</div>
          </div>
          <div style="text-align: right;">
            ${getOrderStatusBadge(order.status)}
            <div class="t-body-2" style="font-weight: 700; margin-top: 4px;">${formatCurrency(order.totals.total)}</div>
          </div>
        </div>
        
        <div style="border-top: 1px solid #f3f4f6; padding-top: 1rem; margin-top: 1rem;">
          <div class="t-body-3" style="margin-bottom: 8px; font-weight: 600;">${order.items.length} item(s):</div>
          <div style="display: grid; gap: 4px;">
            ${order.items.slice(0, 3).map(item => `
              <div class="t-body-3" style="opacity: 0.8;">${item.quantity}x ${item.name}</div>
            `).join('')}
            ${order.items.length > 3 ? `<div class="t-body-3" style="opacity: 0.6;">+ ${order.items.length - 3} more items</div>` : ''}
          </div>
        </div>
        
        <div style="display: flex; gap: 8px; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f3f4f6;">
          <button onclick="viewOrderDetails('${order.id}')" class="c-btn is-secondary" style="padding: 6px 12px; font-size: 0.875rem; border-radius: 6px;">View Details</button>
          <button onclick="downloadReceipt('${order.id}')" class="c-btn is-secondary" style="padding: 6px 12px; font-size: 0.875rem; border-radius: 6px;">Download Receipt</button>
          ${order.status === 'delivered' ? `<button onclick="reorderItems('${order.id}')" class="c-btn" style="padding: 6px 12px; font-size: 0.875rem; border-radius: 6px; background: var(--clr-yellow-01);">Reorder</button>` : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = ordersHtml;
  }

  function renderSavedAddresses() {
    const container = document.getElementById('saved-addresses-container');
    if (!container) return;

    const user = getUserData();
    if (!user) {
      container.innerHTML = '<div class="t-body-2" style="text-align: center; padding: 2rem; opacity: 0.7;">Please sign in to manage addresses.</div>';
      return;
    }

    const addresses = user.addresses || [];
    
    if (addresses.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <div class="t-body-2" style="opacity: 0.7; margin-bottom: 1rem;">No saved addresses</div>
          <button onclick="addNewAddress()" class="c-btn" style="padding: 8px 16px; border-radius: 8px;">Add Address</button>
        </div>
      `;
      return;
    }

    const addressesHtml = addresses.map(address => `
      <div class="address-item" style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; background: #fff; ${address.isDefault ? 'border-color: var(--clr-yellow-01);' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div class="t-body-2" style="font-weight: 600;">${address.label}</div>
              ${address.isDefault ? '<span style="background: var(--clr-yellow-01); color: #000; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: 600;">Default</span>' : ''}
            </div>
            <div class="t-body-3" style="margin-bottom: 4px;">${address.street}</div>
            <div class="t-body-3" style="opacity: 0.7;">${address.city}, ${address.region}</div>
            <div class="t-body-3" style="opacity: 0.7;">${address.phone}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="editAddress('${address.id}')" class="c-btn is-secondary" style="padding: 4px 8px; font-size: 0.8rem; border-radius: 4px;">Edit</button>
            ${!address.isDefault ? `<button onclick="deleteAddress('${address.id}')" class="c-btn is-secondary" style="padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; color: #ef4444; border-color: #ef4444;">Delete</button>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    const finalHtml = `
      ${addressesHtml}
      <button onclick="addNewAddress()" class="c-btn is-secondary" style="padding: 8px 16px; border-radius: 8px; width: 100%;">+ Add New Address</button>
    `;

    container.innerHTML = finalHtml;
  }

  function renderSavedItems() {
    const container = document.getElementById('saved-items-container');
    if (!container) return;

    const user = getUserData();
    if (!user) {
      container.innerHTML = '<div class="t-body-2" style="text-align: center; padding: 2rem; opacity: 0.7;">Please sign in to view saved items.</div>';
      return;
    }

    const savedItems = user.favorites || [];
    
    if (savedItems.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem;">
          <div style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;">💝</div>
          <div class="t-body-2" style="opacity: 0.7; margin-bottom: 1rem;">No saved items yet</div>
          <a href="shop.html" class="c-btn" style="padding: 8px 16px; border-radius: 8px;">Browse Products</a>
        </div>
      `;
      return;
    }

    const itemsHtml = savedItems.map(item => `
      <div class="saved-item" style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem; background: #fff; display: flex; gap: 1rem; align-items: center;">
        <div style="width: 60px; height: 60px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          🥬
        </div>
        <div style="flex: 1;">
          <div class="t-body-2" style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
          <div class="t-body-3" style="opacity: 0.7;">${formatCurrency(item.price)}</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="addToCart('${item.id}')" class="c-btn" style="padding: 6px 12px; font-size: 0.875rem; border-radius: 6px; background: var(--clr-yellow-01);">Add to Cart</button>
          <button onclick="removeSavedItem('${item.id}')" class="c-btn is-secondary" style="padding: 6px 12px; font-size: 0.875rem; border-radius: 6px;">Remove</button>
        </div>
      </div>
    `).join('');

    container.innerHTML = itemsHtml;
  }

  // Global functions for button actions
  window.viewOrderDetails = function(orderId) {
    const orders = getMemberOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      alert(`Order Details for #${orderId}\\n\\nItems: ${order.items.length}\\nTotal: ${formatCurrency(order.totals.total)}\\nStatus: ${order.status}\\n\\nIn a full app, this would show a detailed modal.`);
    }
  };

  window.downloadReceipt = function(orderId) {
    const orders = getMemberOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Store for receipt page
      localStorage.setItem('goshop_last_receipt', JSON.stringify(order));
      window.open('order-success.html', '_blank');
    }
  };

  window.reorderItems = function(orderId) {
    const orders = getMemberOrders();
    const order = orders.find(o => o.id === orderId);
    if (order && window.cartManager) {
      order.items.forEach(item => {
        window.cartManager.addToCart(item.id, item.quantity);
      });
      alert(`${order.items.length} items added to cart!`);
    }
  };

  window.addNewAddress = function() {
    alert('Address management form would open here in a full implementation');
  };

  window.editAddress = function(addressId) {
    alert(`Edit address ${addressId} form would open here`);
  };

  window.deleteAddress = function(addressId) {
    if (confirm('Are you sure you want to delete this address?')) {
      alert(`Address ${addressId} would be deleted in a full implementation`);
    }
  };

  window.addToCart = function(itemId) {
    if (window.cartManager) {
      window.cartManager.addToCart(itemId);
      alert('Item added to cart!');
    }
  };

  window.removeSavedItem = function(itemId) {
    if (confirm('Remove this item from your saved list?')) {
      alert(`Item ${itemId} would be removed in a full implementation`);
    }
  };

  // Initialize dashboard
  function initializeDashboard() {
    renderOrderHistory();
    renderSavedAddresses();
    renderSavedItems();
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
  } else {
    initializeDashboard();
  }

  // Re-initialize when auth state changes
  document.addEventListener('authStateChanged', initializeDashboard);

  // Expose API
  window.MemberDashboard = {
    renderOrderHistory,
    renderSavedAddresses,
    renderSavedItems,
    initializeDashboard
  };

  console.log('MemberDashboard module loaded successfully');
})();
