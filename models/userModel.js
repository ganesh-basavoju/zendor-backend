const mongoose = require("mongoose");
const validator = require("validator");
const { Schema, model, Types } = require("mongoose");


const MoodBoardSchema = new Schema({
  productId: {
    type: Types.ObjectId,
    required: true,
    refPath: 'collections.productType' // Correct refPath
  },
  productType: {
    type: String,
    required: true,
    enum: ['Wallpaper', 'WoodenFloor'], 
  }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    google_id: { type: String, unique: true },
    userName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    billingAddress: {
      isFilled: {
        type: Boolean,
        default: false,
      },
      firstName: {
        type: String,
        default: "None",
      },
      lastName: {
        type: String,
        default: "None",
      },
      companyName: {
        type: String,
        default: "None",
      },
      country: {
        type: String,
        default: "None",
      },
      City: {
        type: String,
        default: "None",
      },
      State: {
        type: String,
        default: "None",
      },
      PinCode: {
        type: String,
        default: "None",
      },
      Street: {
        type: String,
        default: "None",
      },
      Landmark: {
        type: String,
        default: "None",
      },
      email: {
        type: String,
        default: "None",
      },
      phone: {
        type: String,
        default: "None",
      },
      isHome: {
        type: Boolean,
        default: true,
      },
    },
    shippingAddress: {
      isFilled: {
        type: Boolean,
        default: false,
      },
      firstName: {
        type: String,
        default: "None",
      },
      lastName: {
        type: String,
        default: "None",
      },
      companyName: {
        type: String,
        default: "None",
      },
      country: {
        type: String,
        default: "None",
      },
      City: {
        type: String,
        default: "None",
      },
      State: {
        type: String,
        default: "None",
      },
      PinCode: {
        type: String,
        default: "None",
      },
      Street: {
        type: String,
        default: "None",
      },
      Landmark: {
        type: String,
        default: "None",
      },
      email: {
        type: String,
        default: "None",
      },
      phone: {
        type: String,
        default: "None",
      },
      isHome: {
        type: Boolean,
        default: true,
      },
    },
    phone: {
      type: String,
      default: "None",
    },

    profilePicture: {
      type: String,
      default: "None",
    },
    MoodBoard: [
      {
        name: {
          type: String,
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
        thumbnail: {
          type: String,
          required: true,
        },
        collections:{
         type: [MoodBoardSchema],
         default: [],
        }
      }
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
      },
    ],
    recentActivity: [
      {
        activityType: {
          type: String,
          enum: ["order", "wishlist", "review", "login", "cart"], // extend as needed
        },
        message: {
          type: String,
          required: true,
        },
        icon: {
          type: String, // optional: for frontend icon reference
          default: "info",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    passwordResetToken:{type: String,default:null},
    passwordResetExpires:{type: Date,default:null},
  },
  { timestamps: true }
);



const User = mongoose.model("User", userSchema);

module.exports = User;
