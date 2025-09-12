import { nanoid } from 'nanoid';

// In-memory stores (showcase mode)
export const db = {
  users: [],
  products: [],
  carts: [],
};

export function seedProductsOnce() {
  if (db.products.length) return;
  const now = Date.now();
  const items = [
    // Kaneshie
    { name: 'Fresh Bananas', priceCents: 1500, imageUrl: 'src/images/products/banana.png', stock: 100, marketSlug: 'kaneshie' },
    { name: 'Fresh Herbs', priceCents: 800, imageUrl: 'src/images/products/herbs.png', stock: 100, marketSlug: 'kaneshie' },
    { name: 'Fresh Tomatoes', priceCents: 1200, imageUrl: 'src/images/tomato.png', stock: 100, marketSlug: 'kaneshie' },
    // Accra
    { name: 'Roma Tomatoes', priceCents: 1000, imageUrl: 'src/images/tomato.png', stock: 100, marketSlug: 'accra' },
    { name: 'Imported Rice', priceCents: 3000, imageUrl: 'src/images/rice.png', stock: 100, marketSlug: 'accra' },
    { name: 'Green Apples', priceCents: 2200, imageUrl: 'src/images/apple-inhand.png', stock: 100, marketSlug: 'accra' },
    // Kumasi
    { name: 'Garden Eggs', priceCents: 900, imageUrl: 'src/images/farmers/shop1.jpg', stock: 100, marketSlug: 'kumasi' },
    { name: 'Kontomire Leaves', priceCents: 500, imageUrl: 'src/images/products/herbs.png', stock: 100, marketSlug: 'kumasi' },
    { name: 'Local Red Rice', priceCents: 2800, imageUrl: 'src/images/rice.png', stock: 100, marketSlug: 'kumasi' },
  ];
  db.products = items.map((p) => ({ id: nanoid(), createdAt: now, updatedAt: now, vendorName: '', description: '', ...p }));
}

export function getOrCreateAnonCart(cartId) {
  let cart = db.carts.find((c) => c.id === cartId);
  if (cart) return cart;
  cart = { id: nanoid(), userId: null, items: [], createdAt: Date.now(), updatedAt: Date.now() };
  db.carts.push(cart);
  return cart;
}

export function getOrCreateUserCart(userId) {
  let cart = db.carts.find((c) => c.userId === userId);
  if (cart) return cart;
  cart = { id: nanoid(), userId, items: [], createdAt: Date.now(), updatedAt: Date.now() };
  db.carts.push(cart);
  return cart;
}

export function mergeCarts(sourceCart, targetCart) {
  for (const item of sourceCart.items) {
    const existing = targetCart.items.find((i) => i.productId === item.productId);
    if (existing) existing.quantity += item.quantity;
    else targetCart.items.push({ ...item, id: nanoid() });
  }
  targetCart.updatedAt = Date.now();
  sourceCart.items = [];
}


