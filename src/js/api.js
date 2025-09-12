// Minimal api helper using same-origin fetch. No frontend HTML changes required.
window.GoShopAPI = (function() {
  const headers = { 'Content-Type': 'application/json' };

  async function get(path) {
    const res = await fetch(path, { credentials: 'include' });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }

  async function post(path, body) {
    const res = await fetch(path, { method: 'POST', credentials: 'include', headers, body: JSON.stringify(body || {}) });
    if (!res.ok) throw new Error('Request failed');
    return res.json().catch(() => ({}));
  }

  async function patch(path, body) {
    const res = await fetch(path, { method: 'PATCH', credentials: 'include', headers, body: JSON.stringify(body || {}) });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }

  async function del(path) {
    const res = await fetch(path, { method: 'DELETE', credentials: 'include' });
    if (!res.ok && res.status !== 204) throw new Error('Request failed');
    return {};
  }

  return {
    // auth
    signup: (data) => post('/api/auth/signup', data),
    signin: (data) => post('/api/auth/signin', data),
    signout: () => post('/api/auth/signout'),
    me: () => get('/api/auth/me'),
    // products
    products: (market) => get('/api/products' + (market ? `?market=${encodeURIComponent(market)}` : '')),
    // cart
    cart: () => get('/api/cart'),
    cartCount: () => get('/api/cart/count'),
    addToCart: (productId, quantity = 1) => post('/api/cart/items', { productId, quantity }),
    updateCartItem: (id, quantity) => patch(`/api/cart/items/${id}`, { quantity }),
    removeCartItem: (id) => del(`/api/cart/items/${id}`),
    mergeCart: () => post('/api/cart/merge'),
  };
})();


