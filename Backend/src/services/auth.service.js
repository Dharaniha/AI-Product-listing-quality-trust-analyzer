import bcrypt from 'bcrypt';
import * as repo from '../repositories/data.repository.js';
import { signToken } from '../middleware/auth.middleware.js';
import { ApiError } from '../utils/apiError.js';
import { deriveNameFromEmail } from '../utils/trustLevels.js';

export async function signup({ name, email, password }) {
  const existing = await repo.findUserByEmail(email);
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await repo.createUser({ name, email, password });
  const token = signToken({ email: user.email, name: user.name, plan: user.plan });
  return {
    token,
    user: { name: user.name, email: user.email, plan: user.plan },
  };
}

export async function login({ email, password }) {
  const user = await repo.findUserByEmail(email);

  if (!user) throw new ApiError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  const token = signToken({ email: user.email, name: user.name, plan: user.plan });
  return {
    token,
    user: { name: user.name, email: user.email, plan: user.plan },
  };
}

export async function logout() {
  return { message: 'Logged out' };
}
