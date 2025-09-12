import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from './store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const COOKIE_NAME = process.env.COOKIE_NAME || 'SESSION';

export const authRouter = express.Router();

function setSession(res, userId) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function getUserFromReq(req) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return db.users.find((u) => u.id === payload.sub) || null;
  } catch {
    return null;
  }
}

authRouter.post('/signup', async (req, res) => {
  const { name = '', username = '', email = '', location = '', password = '' } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const exists = db.users.find((u) => u.username === username || u.email === email);
  if (exists) return res.status(409).json({ error: 'User exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: nanoid(),
    name,
    username,
    email,
    location,
    passwordHash: hash,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  db.users.push(user);
  setSession(res, user.id);
  res.status(201).json({ user: { id: user.id, name, username, email } });
});

authRouter.post('/signin', async (req, res) => {
  const { usernameOrEmail = '', password = '' } = req.body || {};
  const user = db.users.find((u) => u.username === usernameOrEmail || u.email === usernameOrEmail);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  setSession(res, user.id);
  res.json({ user: { id: user.id, name: user.name, username: user.username, email: user.email } });
});

authRouter.post('/signout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.status(204).end();
});

authRouter.get('/me', (req, res) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  res.json({ user: { id: user.id, name: user.name, username: user.username, email: user.email } });
});

export function requireUser(req, res, next) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  req.user = user;
  next();
}


