// Wire up auth.html forms without changing markup
(function() {
  function qs(sel) { return document.querySelector(sel); }
  function on(el, ev, fn) { el && el.addEventListener(ev, fn); }

  document.addEventListener('DOMContentLoaded', () => {
    const signinForm = qs('#signin-form form');
    const signupForm = qs('#signup-form form');

    on(signinForm, 'submit', async (e) => {
      e.preventDefault();
      try {
        const email = signinForm.querySelector('input[name="email"]').value.trim();
        const username = signinForm.querySelector('input[name="username"]').value.trim();
        const password = signinForm.querySelector('input[name="password"]').value;
        const usernameOrEmail = username || email;
        await window.GoShopAPI.signin({ usernameOrEmail, password });
        // Merge anonymous cart, if any
        try { await window.GoShopAPI.mergeCart(); } catch {}
        showMessage('success', "Welcome back! You're now signed in.");
        // Update navbar cart count
        refreshCartCount();
      } catch (err) {
        showMessage('error', 'Sign in failed');
      }
    });

    on(signupForm, 'submit', async (e) => {
      e.preventDefault();
      try {
        const name = signupForm.querySelector('input[name="fullname"]').value.trim();
        const username = signupForm.querySelector('input[name="username"]').value.trim();
        const email = signupForm.querySelector('input[name="email"]').value.trim();
        const location = signupForm.querySelector('input[name="location"]').value.trim();
        const password = signupForm.querySelector('input[name="password"]').value;
        const confirm = signupForm.querySelector('input[name="confirm_password"]').value;
        if (password !== confirm) throw new Error('Password mismatch');
        await window.GoShopAPI.signup({ name, username, email, location, password });
        showMessage('success', 'Account created successfully! Welcome to Go-Shop!');
        try { await window.GoShopAPI.mergeCart(); } catch {}
        refreshCartCount();
      } catch (err) {
        showMessage('error', 'Signup failed');
      }
    });

    // Initialize cart count and auth state
    refreshCartCount();
  });

  function showMessage(type, text) {
    const successEl = document.querySelector('.success_message .thank_you');
    const errorEl = document.querySelector('.error_message .error');
    const successWrap = document.querySelector('.success_message');
    const errorWrap = document.querySelector('.error_message');
    if (type === 'success') {
      if (successEl) successEl.textContent = text;
      if (successWrap) successWrap.style.display = 'block';
      if (errorWrap) errorWrap.style.display = 'none';
    } else {
      if (errorEl) errorEl.textContent = text;
      if (errorWrap) errorWrap.style.display = 'block';
      if (successWrap) successWrap.style.display = 'none';
    }
  }

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


