const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrder,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");


router.post("/create-order", authMiddleware, createOrder);
router.get("/getAllOrders", authMiddleware, getAllOrders);
router.get("/get-orders", authMiddleware, getOrders);
router.get("/getOrderDetails/:orderId", authMiddleware, getOrderDetails);
router.patch("/updateOrderStatus/:orderId", authMiddleware, updateOrderStatus);
router.put("/update/:id", authMiddleware, updateOrder);

module.exports = router;
