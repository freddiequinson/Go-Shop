// Client-side helpers for add-to-cart buttons without changing existing HTML
(function() {
  function on(el, ev, fn) { el && el.addEventListener(ev, fn); }

  document.addEventListener('DOMContentLoaded', () => {
    // Delegate clicks for .add-to-cart buttons when productId is available
    document.body.addEventListener('click', async (e) => {
      const btn = e.target.closest('.add-to-cart');
      if (!btn) return;
      let productId = btn.getAttribute('data-product-id');
      e.preventDefault();
      try {
        if (!productId) {
          // Fallback: infer product by name text in the same card
          const card = btn.closest('.product-item');
          const nameEl = card ? card.querySelector('h4') : null;
          const name = nameEl ? nameEl.textContent.trim() : '';
          if (name) {
            const list = await window.GoShopAPI.products();
            const match = list.find(p => (p.name || '').toLowerCase() === name.toLowerCase());
            if (match) productId = match.id;
          }
        }
        if (!productId) return; // could not resolve; keep visual feedback only
        await window.GoShopAPI.addToCart(productId, 1);
        // Update navbar cart count
        refreshCartCount();
      } catch {}
    });

    // Initialize cart count on page load
    refreshCartCount();
  });

  async function refreshCartCount() {
    try {
      const { count } = await window.GoShopAPI.cartCount();
      if (window.navbarComponent && window.navbarComponent.updateCartCount) {
        window.navbarComponent.updateCartCount(count);
      } else {
        const badge = document.querySelector('.c-nav-shop_num');
        if (badge) {
          if (count > 0) { badge.textContent = count; badge.classList.remove('hide'); }
          else { badge.classList.add('hide'); }
        }
      }
    } catch {}
  }
})();


