import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
  } catch { }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}