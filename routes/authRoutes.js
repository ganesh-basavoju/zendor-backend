const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.post('/forgot-password', authController.forgotPassword);
router.post("/verify-otp", authController.verifyOTP)
// router.post('/reset-password', authController.resetPassword);

router.post("/google-login", authController.googleAuth);

router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});


module.exports = router;