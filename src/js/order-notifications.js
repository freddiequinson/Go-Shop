/*
 * Order Notifications System (Frontend-only Showcase)
 * - Shows order status updates to signed-in users
 * - Simulates real-time notifications
 */
(function () {
  'use strict';

  let notifications = [];
  let notificationContainer = null;

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

  function getNotifications() {
    try {
      const user = getUserData();
      if (!user) return [];
      
      const data = localStorage.getItem(`goshop_notifications_${user.email}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveNotifications() {
    try {
      const user = getUserData();
      if (user) {
        localStorage.setItem(`goshop_notifications_${user.email}`, JSON.stringify(notifications));
      }
    } catch (e) {
      console.error('Failed to save notifications');
    }
  }

  function createNotificationContainer() {
    if (notificationContainer) return notificationContainer;

    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(notificationContainer);
    return notificationContainer;
  }

  function getNotificationIcon(type) {
    const icons = {
      'order_placed': '📦',
      'order_confirmed': '✅',
      'preparing': '👨‍🍳',
      'out_for_delivery': '🚚',
      'delivered': '🎉',
      'cancelled': '❌',
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    };
    return icons[type] || icons['info'];
  }

  function getNotificationColor(type) {
    const colors = {
      'order_placed': '#3b82f6',
      'order_confirmed': '#22c55e',
      'preparing': '#f59e0b',
      'out_for_delivery': '#3b82f6',
      'delivered': '#22c55e',
      'cancelled': '#ef4444',
      'info': '#3b82f6',
      'success': '#22c55e',
      'warning': '#f59e0b',
      'error': '#ef4444'
    };
    return colors[type] || colors['info'];
  }

  function showNotification(message, type = 'info', duration = 5000, persistent = false) {
    const container = createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      background: white;
      border: 1px solid #e5e7eb;
      border-left: 4px solid ${getNotificationColor(type)};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      pointer-events: auto;
      cursor: pointer;
      transform: translateX(100%);
      transition: transform 0.3s ease-out;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: 100%;
    `;

    const icon = document.createElement('div');
    icon.style.cssText = `
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 2px;
    `;
    icon.textContent = getNotificationIcon(type);

    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      min-width: 0;
    `;

    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 4px;
    `;
    messageEl.textContent = message;

    const timeEl = document.createElement('div');
    timeEl.style.cssText = `
      font-size: 12px;
      color: #6b7280;
    `;
    timeEl.textContent = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 16px;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      margin-left: 8px;
      flex-shrink: 0;
    `;
    closeBtn.innerHTML = '×';

    content.appendChild(messageEl);
    content.appendChild(timeEl);
    notification.appendChild(icon);
    notification.appendChild(content);
    notification.appendChild(closeBtn);

    container.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove (unless persistent)
    let timeoutId;
    if (!persistent) {
      timeoutId = setTimeout(() => {
        removeNotification(notification);
      }, duration);
    }

    // Click to close
    const closeHandler = () => {
      if (timeoutId) clearTimeout(timeoutId);
      removeNotification(notification);
    };

    notification.addEventListener('click', closeHandler);
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeHandler();
    });

    return notification;
  }

  function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  function addNotification(orderId, message, type, timestamp = null) {
    const user = getUserData();
    if (!user) return;

    const notification = {
      id: Date.now().toString(),
      orderId,
      message,
      type,
      timestamp: timestamp || new Date().toISOString(),
      read: false
    };

    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications = notifications.slice(0, 50);
    }
    
    saveNotifications();
    
    // Show notification if user is on a Go-Shop page
    if (window.location.hostname.includes('go-shop') || window.location.pathname.includes('html')) {
      showNotification(message, type);
    }

    // Dispatch event for other parts of the app
    document.dispatchEvent(new CustomEvent('newOrderNotification', {
      detail: notification
    }));

    return notification;
  }

  function simulateOrderProgress(orderId) {
    const orderSteps = [
      { message: `Order #${orderId} has been confirmed`, type: 'order_confirmed', delay: 2000 },
      { message: `Your order is being prepared`, type: 'preparing', delay: 10000 },
      { message: `Order #${orderId} is out for delivery`, type: 'out_for_delivery', delay: 20000 },
      { message: `Order #${orderId} has been delivered!`, type: 'delivered', delay: 30000 }
    ];

    orderSteps.forEach((step, index) => {
      setTimeout(() => {
        addNotification(orderId, step.message, step.type);
      }, step.delay);
    });
  }

  function getUnreadCount() {
    const user = getUserData();
    if (!user) return 0;
    
    notifications = getNotifications();
    return notifications.filter(n => !n.read).length;
  }

  function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    saveNotifications();
    updateNotificationBadge();
  }

  function updateNotificationBadge() {
    const unreadCount = getUnreadCount();
    const badges = document.querySelectorAll('.notification-badge');
    
    badges.forEach(badge => {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  function createNotificationBell() {
    const bells = document.querySelectorAll('.notification-bell');
    
    bells.forEach(bell => {
      if (bell.dataset.initialized) return;
      bell.dataset.initialized = 'true';

      // Add bell icon if not present
      if (!bell.innerHTML.trim()) {
        bell.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="notification-badge" style="position: absolute; top: -6px; right: -6px; background: #ef4444; color: white; border-radius: 10px; font-size: 10px; font-weight: 600; padding: 2px 6px; min-width: 16px; text-align: center; display: none;">0</span>
        `;
      }

      // Add click handler
      bell.addEventListener('click', () => {
        showNotificationPanel();
      });
    });
  }

  function showNotificationPanel() {
    const user = getUserData();
    if (!user) {
      showNotification('Please sign in to view notifications', 'info');
      return;
    }

    notifications = getNotifications();
    
    const panelHtml = `
      <div id="notification-panel" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10001; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600;">Notifications</h3>
            <button onclick="closeNotificationPanel()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">×</button>
          </div>
          <div style="max-height: 400px; overflow-y: auto; padding: 0;">
            ${notifications.length === 0 ? 
              `<div style="padding: 40px; text-align: center; color: #6b7280;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🔔</div>
                <div>No notifications yet</div>
              </div>` :
              notifications.map(notif => `
                <div style="padding: 16px 20px; border-bottom: 1px solid #f3f4f6; ${!notif.read ? 'background: #f8fafc;' : ''}">
                  <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="font-size: 1.25rem; margin-top: 2px;">${getNotificationIcon(notif.type)}</div>
                    <div style="flex: 1;">
                      <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${notif.message}</div>
                      <div style="font-size: 12px; color: #6b7280;">${new Date(notif.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              `).join('')
            }
          </div>
          ${notifications.length > 0 ? 
            `<div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <button onclick="markAllNotificationsRead()" style="background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 14px;">Mark all as read</button>
            </div>` : ''
          }
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', panelHtml);
  }

  // Global functions for panel
  window.closeNotificationPanel = function() {
    const panel = document.getElementById('notification-panel');
    if (panel) panel.remove();
  };

  window.markAllNotificationsRead = function() {
    markAllAsRead();
    closeNotificationPanel();
  };

  function initializeNotifications() {
    const user = getUserData();
    if (!user) return;

    notifications = getNotifications();
    createNotificationBell();
    updateNotificationBadge();

    // Listen for new orders
    document.addEventListener('orderPlaced', (e) => {
      const orderId = e.detail?.orderId;
      if (orderId) {
        addNotification(orderId, `Order #${orderId} has been placed successfully`, 'order_placed');
        
        // Simulate order progress for demo
        setTimeout(() => {
          simulateOrderProgress(orderId);
        }, 1000);
      }
    });

    // Update notification bell periodically
    setInterval(updateNotificationBadge, 5000);
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNotifications);
  } else {
    initializeNotifications();
  }

  // Re-initialize when auth state changes
  document.addEventListener('authStateChanged', initializeNotifications);

  // Expose API
  window.OrderNotifications = {
    showNotification,
    addNotification,
    simulateOrderProgress,
    getUnreadCount,
    markAllAsRead,
    getNotifications
  };

  console.log('OrderNotifications module loaded successfully');
})();
