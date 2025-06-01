const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrder,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const generateToken = require("../utils/generateToken");
const { default: axios } = require("axios");

router.post("/create-order", authMiddleware, createOrder);
router.get("/getAllOrders", authMiddleware, getAllOrders);
router.get("/get-orders", authMiddleware, getOrders);
router.get("/getOrderDetails/:orderId", authMiddleware, getOrderDetails);
router.put("/updateOrderStatus/:orderId", authMiddleware, updateOrderStatus);
router.put("/update/:id", authMiddleware, updateOrder);

module.exports = router;
