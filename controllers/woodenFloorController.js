const WoodenFloor = require("../models/woodenFloorModel");

// Get all products with filtering, sorting, and pagination
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      subCategory = "All",
      sortBy = "Featured",
      page = 1,
      limit = 10,
      minPrice,
      maxPrice
    } = req.query;

    const query = { isActive: true };

    // Price range filter
    if (minPrice || maxPrice) {
      query.dp = {};
      if (minPrice) query.dp.$gte = Number(minPrice);
      if (maxPrice) query.dp.$lte = Number(maxPrice);
    }
    
    // Enhanced search functionality
    if (search && search.trim() !== "") {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { finish: { $regex: search, $options: "i" } },
        { surface: { $regex: search, $options: "i" } }
      ];
    }
    
    if (subCategory && subCategory !== "All") {
      query.subCategory = subCategory;
    }

    // Define sort configuration based on sortBy parameter
    let sortConfig = { createdAt: -1 }; // default sort
    switch (sortBy) {
      case "Price: Low to High":
        sortConfig = { dp: 1 };
        break;
      case "Price: High to Low":
        sortConfig = { dp: -1 };
        break;
      case "Newest First":
        sortConfig = { createdAt: -1 };
        break;
      case "Featured":
      default:
        sortConfig = { createdAt: -1 };
        break;
    }

    // Execute query with pagination and sorting
    const products = await WoodenFloor.find(query)
      .sort(sortConfig)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("_id subCategory name description sampleCost images dp bp brand tags finish surface");

    // Get total count for pagination
    const total = await WoodenFloor.countDocuments(query);

    res.status(200).json({
      status: "success",
      results: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: products.map((product) => ({
        id: product._id,
        subCategory: product.subCategory,
        name: product.name,
        description: product.description,
        price: product.dp,
        sampleCost: product.sampleCost,
        image: product.images,
        brand: product.brand,
        finish: product.finish,
        surface: product.surface,
        tags: product.tags
      })),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get single product by ID
exports.getProduct = async (req, res) => {
  try {
    const product = await WoodenFloor.findById(req.params.id).select("-__v");
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const newProduct = await WoodenFloor.create(req.body);
    res.status(201).json({
      status: "success",
      data: newProduct,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await WoodenFloor.findByIdAndUpdate(
      req.params.id,
      req.body,
      // {
      //   new: true,
      //   runValidators: true,
      // }
    );

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete product (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await WoodenFloor.findByIdAndDelete(
      req.params.id
      // { isActive: false },
      // { new: true }
    );

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.pushAll = async (req, res) => {
  try {
    await WoodenFloor.insertMany(req.body);
    res.status(200).json({
      status: "success",
      message: "Products pushed successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const subCategories = await WoodenFloor.distinct("subCategory");
    if (!subCategories || subCategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subcategories found",
      });
    }

    res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories.map((subCategory, ind) => {
        return { id: ind, name: subCategory };
      }),
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
