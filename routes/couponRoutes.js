// routes/couponRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Coupon = require("../models/couponModel");

router.post("/apply",authMiddleware, async (req, res) => {
    console.log("Coupon apply request received");
  try {
    const { code, cartTotal } = req.body;
    console.log(req.body);
    const userId = req.user.userId;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) return res.status(404).json({ message: "Invalid coupon" });

    if (coupon.expiresAt && new Date() > coupon.expiresAt)
      return res.status(400).json({ message: "Coupon expired" });

    if (coupon.usedBy.includes(userId))
      return res
        .status(400)
        .json({ message: "Coupon already used by this user" });

    if (cartTotal < coupon.minPurchase)
      return res
        .status(400)
        .json({ message: `Minimum purchase should be ₹${coupon.minPurchase}` });

    let discount = 0;
    if (coupon.discountType === "flat") {
      discount = coupon.discountValue;
    } else if (coupon.discountType === "percent") {
      discount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    }

    const finalAmount = Math.max(cartTotal - discount, 0);
    res
      .status(200)
      .json({ success: true, discount, finalAmount, couponId: coupon._id });
  } catch (error) {
    console.error("Coupon apply error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Create Coupon
router.post("/create", async (req, res) => {
    try {
      const {
        code,
        discountType,
        discountValue,
        minPurchase = 0,
        maxDiscount = 0,
        expiresAt,
        isActive = true,
      } = req.body;
  
      // Validate required fields
      if (!code || !discountType || !discountValue || !expiresAt) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
      }
  
      // Validate discountType
      if (!["flat", "percent"].includes(discountType)) {
        return res.status(400).json({ success: false, message: "Invalid discount type." });
      }
  
      // Validate positive numbers
      if (discountValue <= 0 || minPurchase < 0 || maxDiscount < 0) {
        return res.status(400).json({ success: false, message: "Values must be positive." });
      }
  
      // Prevent maxDiscount on flat type
      if (discountType === "flat" && maxDiscount > 0) {
        return res.status(400).json({ success: false, message: "Flat discount should not have maxDiscount." });
      }
  
      // Check for existing coupon code
      const existing = await Coupon.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: "Coupon code already exists." });
      }
  
      // Create coupon
      const coupon = new Coupon({
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minPurchase,
        maxDiscount: discountType === "flat" ? 0 : maxDiscount,
        expiresAt,
        isActive,
      });
  
      await coupon.save();
  
      res.status(201).json({ success: true, message: "Coupon created", coupon });
    } catch (err) {
      console.error("Error creating coupon:", err);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  

// Get All Coupons
router.get("/all", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Coupon
router.put("/:id", async (req, res) => {
  try {
    const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({ success: true, coupon: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete Coupon
router.delete("/:id", async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
