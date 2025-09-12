import express from 'express';
import { nanoid } from 'nanoid';
import { db, getOrCreateAnonCart, getOrCreateUserCart, mergeCarts } from './store.js';
import jwt from 'jsonwebtoken';

const CART_COOKIE = 'CART_ID';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const cartRouter = express.Router();

function getUserIdFromReq(req) {
  const token = req.cookies?.SESSION;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub || null;
  } catch {
    return null;
  }
}

function getActiveCart(req, res) {
  const userId = getUserIdFromReq(req);
  if (userId) return getOrCreateUserCart(userId);
  const cid = req.cookies[CART_COOKIE];
  const cart = getOrCreateAnonCart(cid);
  if (!cid) res.cookie(CART_COOKIE, cart.id, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
  return cart;
}

cartRouter.get('/', (req, res) => {
  const cart = getActiveCart(req, res);
  const items = cart.items.map((it) => ({
    id: it.id,
    quantity: it.quantity,
    product: db.products.find((p) => p.id === it.productId) || null,
  }));
  const subtotalCents = items.reduce((sum, it) => sum + (it.product ? it.product.priceCents * it.quantity : 0), 0);
  const deliveryFeeCents = 1000;
  const totalCents = subtotalCents + deliveryFeeCents;
  res.json({ id: cart.id, items, totals: { subtotalCents, deliveryFeeCents, totalCents } });
});

cartRouter.get('/count', (req, res) => {
  const cart = getActiveCart(req, res);
  const count = cart.items.reduce((sum, it) => sum + it.quantity, 0);
  res.json({ count });
});

cartRouter.post('/items', (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  const cart = getActiveCart(req, res);
  const product = db.products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'product_not_found' });
  const existing = cart.items.find((i) => i.productId === productId);
  if (existing) existing.quantity += Number(quantity) || 1;
  else cart.items.push({ id: nanoid(), productId, quantity: Number(quantity) || 1 });
  cart.updatedAt = Date.now();
  const item = cart.items.find((i) => i.productId === productId);
  res.status(201).json({ item });
});

cartRouter.patch('/items/:id', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body || {};
  const cart = getActiveCart(req, res);
  const item = cart.items.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  item.quantity = Math.max(0, Number(quantity) || 0);
  if (item.quantity === 0) cart.items = cart.items.filter((i) => i.id !== id);
  cart.updatedAt = Date.now();
  res.json({ item });
});

cartRouter.delete('/items/:id', (req, res) => {
  const { id } = req.params;
  const cart = getActiveCart(req, res);
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.id !== id);
  if (cart.items.length === before) return res.status(404).json({ error: 'not_found' });
  cart.updatedAt = Date.now();
  res.status(204).end();
});

cartRouter.post('/merge', (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'unauthorized' });
  const anonId = req.cookies[CART_COOKIE];
  if (!anonId) return res.json({ ok: true });
  const anon = db.carts.find((c) => c.id === anonId);
  const userCart = getOrCreateUserCart(userId);
  if (anon && anon !== userCart) mergeCarts(anon, userCart);
  res.json({ cart: userCart });
});


