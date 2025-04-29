const express = require("express");
const { verifyPayment } = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/verify-payment",authMiddleware, verifyPayment )
  


module.exports = router;