import express from 'express';
import { db, seedProductsOnce } from './store.js';

export const productsRouter = express.Router();

productsRouter.get('/', (req, res) => {
  seedProductsOnce();
  const { market } = req.query;
  let items = db.products;
  if (market) items = items.filter((p) => (p.marketSlug || '').toLowerCase() === String(market).toLowerCase());
  res.json(items);
});


