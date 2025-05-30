const express = require("express");
const { verifyPayment, createOrder } = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/verify-payment",authMiddleware, verifyPayment )
router.post('/create-order', authMiddleware,createOrder);
  


module.exports = router;