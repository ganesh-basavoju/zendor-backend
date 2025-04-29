const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity
} = require("../controllers/cartController");



router.post("/add-to-cart",authMiddleware, addToCart);
router.get("/get-cart",authMiddleware, getCart);
router.post("/remove-from-cart",authMiddleware, removeFromCart);
router.put("/update-quantity",authMiddleware, updateCartItemQuantity);

module.exports = router;
