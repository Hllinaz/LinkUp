import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const saltRounds = 12;

export function sign(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function asInt(n) {
  return typeof n?.toInt === 'function' ? n.toInt() : n;
}

