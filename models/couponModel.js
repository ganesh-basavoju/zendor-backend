// models/Coupon.js
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discountType: { type: String, enum: ["flat", "percent"], required: true },
    discountValue: { type: Number, required: true }, // flat amount or percentage
    minPurchase: { type: Number, default: 0 }, // min cart value to apply
    maxDiscount: { type: Number }, // cap for percent coupons
    expiresAt: { type: Date }, // expiry date
    isActive: { type: Boolean, default: true },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // track users
  },
  { timestamps: true }
);

const Coupons = mongoose.model("Coupon", couponSchema);
module.exports = Coupons;
