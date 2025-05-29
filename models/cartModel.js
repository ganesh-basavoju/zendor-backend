const { Schema, model, Types } = require("mongoose");

const cartItemSchema = new Schema(
  {
    productId: {
      type: Types.ObjectId,
      required: true,
      refPath: "productType", // Dynamically reference correct model
    },
    productType: {
      type: String,
      required: true,
      enum: ["Wallpaper", "WoodenFloor"], // Add more as needed
    },
    isSample: { type: Boolean, default: false },
    quantity: {
      type: Number,
      min: [1, "Quantity must be at least 1"],
    },
    size: {
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ["inches", "feet"],
        default: "feet",
      },
    },
    area: Number,
    floorArea: {
      wallA: {
        width: Number,
        height: Number,
        area: Number,
        price: Number,
        texture: String,
        color: String,
      },
      wallB: {
        width: Number,
        height: Number,
        area: Number,
        price: Number,
        texture: String,
        color: String,
      },
      wallC: {
        width: Number,
        height: Number,
        area: Number,
        price: Number,
        texture: String,
        color: String,
      },
      wallD: {
        width: Number,
        height: Number,
        area: Number,
        price: Number,
        texture: String,
        color: String,
      },
    }, 
    pricePerUnit: Number, // Useful for historical accuracy (in case price changes later)
    totalPrice: Number,
    color:String,
    texture:String
  },
  { _id: false }
);

const cartSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: "User", // Assuming you have a User model
    required: false,
  },
  items: [cartItemSchema],
  totalQuantity: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp before save
cartSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Cart = model("Cart", cartSchema);

module.exports = Cart;
