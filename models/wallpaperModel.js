const { Schema, model } = require("mongoose");

const wallpaperSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    features: [{}],
    size: {
      type: String,
      default: "None",
    },
    thickness: {
      type: String,
      required: [true, "Product thickness is required"],
    },
    dp: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    bp: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    gst: {
      type: Number,
      default: 0,
      required: [true, "Product GST is required"],
      min: [0, "GST cannot be negative"],
    },

    sampleCost: {
      type: Number,
      required: [true, "Sample cost is required"],
      min: [0, "Sample cost cannot be negative"],
    },
    //     type: Number,
    //     required: [true, "Cost of running profile is required"],
    //     min: [0, "Cost of running profile cannot be negative"],
    //   },
    //   costPerSqFtPerBox: {
    //     box: {
    //       type: Number,
    //       required: [true, "Cost per sq ft per box is required"],
    //       min: [0, "Cost per sq ft per box cannot be negative"],
    //     },
    //   },

    subCategory: {
      type: String,
      trim: true,
      required: [true, "Subcategory is required"],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    sampleInventory: {
      type: String,
      required: [true, "Sample inventory is required"],
    },
    shade: {
      type: String,
      default: "None",
      // required: [false, "Shade is required"],
    },
    finish: {
      type: String,
      default: "None",
    },
    core: {
      type: String,
    },
    images: [
      {
        color: { type: String, required: true },
        pic: { type: String, required: true },
      },
    ],
    surface: {
      type: String,
      default: "None",
      // required: [true, "Surface is required"],
    },
    perSquareCost: {
      type: Number,
      default: 0,
    },
    texture: [
      {
        name: {
          type: String,
          required: true,
        },
        cost: {
          type: Number,
          required: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Update timestamp before saving
wallpaperSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Wallpaper = model("Wallpaper", wallpaperSchema);

module.exports = Wallpaper;
