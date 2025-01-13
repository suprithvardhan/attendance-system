import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await redisClient.hGetAll(`user:${username}`);

    if (!user || Object.keys(user).length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id, username }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await redisClient.sAdd(`user:${user.id}:refresh_tokens`, refreshToken);

    res.json({ token, refreshToken });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;
    const existingUser = await redisClient.hGetAll(`user:${username}`);

    if (existingUser && Object.keys(existingUser).length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user:${Date.now()}`;

    await redisClient.hSet(userId, {
      username,
      password: hashedPassword,
      role
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const userId = (req as any).user.id;

    await redisClient.sRem(`user:${userId}:refresh_tokens`, refreshToken);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'An error occurred during logout' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string, username: string };
    const isValidToken = await redisClient.sIsMember(`user:${decoded.id}:refresh_tokens`, refreshToken);

    if (!isValidToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newToken = jwt.sign({ id: decoded.id, username: decoded.username }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token: newToken });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};