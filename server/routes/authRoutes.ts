import express from 'express';
import { login, register, logout, refreshToken } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// Login route
router.post('/login', login);

// Register route (if you allow new user registration)
router.post('/register', register);

// Logout route (requires authentication)
router.post('/logout', authenticateJWT, logout);

// Refresh token route
router.post('/refresh-token', refreshToken);

export default router;
