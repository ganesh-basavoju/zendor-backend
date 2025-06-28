const { Schema, model, Types } = require("mongoose");

// Order Item Schema (based on cart item)
const orderItemSchema = new Schema(
  {
    productId: {
      type: Types.ObjectId,
      required: true,
      refPath: "items.productType",
    },
    productType: {
      type: String,
      required: true,
      enum: ["Wallpaper", "WoodenFloor"],
    },
    productName: {
      type: String,
      required: true,
    },
    productThumbnail: {
      type: String,
      required: true,
    },
    isSample: {
      type: Boolean,
      default: false,
      required: true,
    },
    quantity: {
      type: Number,
      min: [1, "Quantity must be at least 1"],
      required: function () {
        return this.isSample; // Quantity only required for samples
      },
    },
    texture: String,
    color: String,
    floorArea: {
      wallA: {
        width: Number,
        height: Number,
        area: Number,
        price: Number,
        color: String,
        texture: String,
      },
      wallB: {
        width: Number,
        height: Number,
        area: Number,
        price: Number,
        color: String,
        texture: String,
      },
      wallC: {
        width: Number,
        height: Number,
        area: Number,
        price: Number,
        color: String,
        texture: String,
      },
      wallD: {
        width: Number,
        height: Number,
        area: Number,
        price: Number,
        color: String,
        texture: String,
      },
    },
    color: { type: String },
    texture: { type: String },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    trackingNumber: String,
    returnReason: {
      type: String,
      required: function () {
        return this.status === "returned";
      },
    },
  },
  { _id: false }
);

// Shipping Address Schema
const shippingAddressSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    companyName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    Street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
    },
    Landmark: {
      type: String,
      default: "",
    },
    City: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    State: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    PinCode: {
      type: String,
      required: [true, "PIN code is required"],
      validate: {
        validator: function (v) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid PIN code!`,
      },
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      default: "India",
    },
    isHome: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

// Payment Result Schema
const paymentResultSchema = new Schema(
  {
    razorpay_payment_id: {
      type: String,
      required: function () {
        return this.paymentMethod === "Prepaid";
      },
    },
    razorpay_order_id: {
      type: String,
      required: function () {
        return this.paymentMethod === "Prepaid";
      },
    },
    razorpay_signature: {
      type: String,
      required: function () {
        return this.paymentMethod === "Prepaid";
      },
    },
    status: {
      type: String,
      enum: ["created", "attempted", "paid", "failed", "refunded"],
      default: "created",
    },
    update_time: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Main Order Schema
const orderSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "Order must have at least one item",
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },
    billingAddress: {
      type: shippingAddressSchema,
      default: function () {
        return this.shippingAddress; // Default to shipping address if not provided
      },
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["COD", "Prepaid"],
      default: "COD",
    },
    paymentResult: {
      type: paymentResultSchema,
    },
    itemsPrice: {
      type: Number,
      required: [true, "Items price is required"],
      min: [0, "Items price cannot be negative"],
    },
    taxPrice: {
      type: Number,
      required: [true, "Tax price is required"],
      min: [0, "Tax price cannot be negative"],
    },
    shippingPrice: {
      type: Number,
      required: [true, "Shipping price is required"],
      min: [0, "Shipping price cannot be negative"],
      default: 0,
    },
    discount: {
      type: Number,
      min: [0, "Discount cannot be negative"],
      default: 0,
    },
    coupon: {
      type: String,
    },
    isCouponApplied: {
      type: Boolean,
      default: false,
    },

    totalAfterCoupon: {
      type: Number,
      min: [0, "Total after coupon cannot be negative"],
    },
    couponId:{
      type: Types.ObjectId,
      ref: "Coupon",
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      required: function () {
        return this.isPaid;
      },
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      required: function () {
        return this.isDelivered;
      },
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
      required: function () {
        return this.isCancelled;
      },
    },
    cancellationReason: {
      type: String,
      required: function () {
        return this.isCancelled;
      },
    },
    order_id: {
      type: String,
      index: true,
    },
    shipment_id: {
      type: String,
      index: true,
    },
    shippingProvider: {
      type: String,
      default: "ShipCorrect",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
    awb_code: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add indexes for better query performance
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "items.productId": 1 });

// Virtual for formatted order number
orderSchema.virtual("orderNumber").get(function () {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

const Order = model("Order", orderSchema);
module.exports = Order;
