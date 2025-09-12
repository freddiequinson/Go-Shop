import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { authRouter } from './modules/auth.js';
import { productsRouter } from './modules/products.js';
import { cartRouter } from './modules/cart.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cookieParser());

// Routers
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Serve static front-end from project root (one level up)
const publicRoot = path.join(__dirname, '..');
app.use(express.static(publicRoot));

// Fallback to index.html if needed
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const ext = path.extname(req.path);
  if (ext) return next();
  res.sendFile(path.join(publicRoot, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Go-Shop showcase backend running on http://localhost:${PORT}`);
});


