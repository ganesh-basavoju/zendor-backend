const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    google_id: { type: String, unique: true,default:null },
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
      Pincode: {
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
      Pincode: {
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
    },
    phone: {
      type: String,
      default: "None",
    },
  
    profilePicture: {
      type: String,
      default: "None",
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
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
        ref: "Product",
      },
    ],
    recentActivity: [
  {
    activityType: {
      type: String,
      enum: ['order', 'wishlist', 'review', 'login', 'cart'], // extend as needed
    },
    message: {
      type: String,
      required: true,
    },
    icon: {
      type: String, // optional: for frontend icon reference
      default: 'info',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  }
],
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check if password is correct
userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
