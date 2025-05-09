const { Schema, model } = require("mongoose");

const woodenFloorSchema = new Schema({
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
  features: [String],
  size: {
    type: String,
    required: [true, "Product size is required"],
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
    required: [true, "Product GST is required"],
    min: [0, "GST cannot be negative"],
  },

  sampleCost: {
    type: Number,
    required: [true, "Sample cost is required"],
    min: [0, "Sample cost cannot be negative"],
  },
  profileCost: {
    type: Number,
    required: [true, "Cost of running profile is required"],
    min: [0, "Cost of running profile cannot be negative"],
  },
  costPerSqFtPerBox: {
    box: {
      type: Number,
      required: [true, "Cost per sq ft per box is required"],
      min: [0, "Cost per sq ft per box cannot be negative"],
    },
  },
//   installationCost: {
//     type: Number,
//     required: [true, "Installation cost is required"],
//     min: [0, "Installation cost cannot be negative"],
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
  images:{type:String,required:true},

  //   dimensions: {
  //     width: {
  //       type: Number,
  //       required: [true, "Width is required"],
  //       min: [0, "Width cannot be negative"],
  //     },
  //     length: {
  //       type: Number,
  //       required: [true, "Length is required"],
  //       min: [0, "Length cannot be negative"],
  //     },
  //     thickness: {
  //       type: Number,
  //       required: [true, "Thickness is required"],
  //       min: [0, "Thickness cannot be negative"],
  //     },
  //   },
  sampleInventory: {
    type: Number,
    required: [true, "Sample inventory is required"],
  },
  shade: {
    type: String,
    default:"None"
    // required: [false, "Shade is required"],
  },
  finish: {
    type: String,
    required: [true, "Finish is required"],
  },
  core: {
    type: String,
    required: [true, "Core is required"],
  },
  surface: {
    type: String,
    default:"None"
    // required: [true, "Surface is required"],
  },
  tags: { type: [String], index: true },
  isActive: {
    type: Boolean,
    default: true,
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

// Update timestamp before saving
woodenFloorSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const WoodenFloor = model("WoodenFloor", woodenFloorSchema);

module.exports = WoodenFloor;
