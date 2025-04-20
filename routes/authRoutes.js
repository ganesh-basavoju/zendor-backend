const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Registration: expects email or phone, fullName, password
router.post('/signup', authController.signup);

// Login: expects identifier (email or phone), password
router.post('/login', authController.login);

// Forgot password: expects identifier (email or phone)
router.post('/forgot-password', authController.forgotPassword);

// Reset password: expects resetToken, newPassword
router.post('/reset-password', authController.resetPassword);

router.post("/google-login", authController.googleAuth);

// Example protected route
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

module.exports = router;