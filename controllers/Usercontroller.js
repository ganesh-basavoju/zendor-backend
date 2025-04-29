const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const WoodenFloor = require("../models/woodenFloorModel");
const Wallpaper = require("../models/wallpaperModel");

exports.FetchUserProfile = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ msg: "User ID is required" });
  }

  try {
    const user = await User.findById(userId)
      .select("-google_id -password -passwordResetToken -passwordResetExpires")
      .populate(["cart", "orders"]);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    console.log(user, "user");

    return res.status(200).json({
      msg: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      msg: "Internal server error",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!userId) {
    return res.status(400).json({ msg: "User ID is missing." });
  }

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ msg: "All fields are required." });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ msg: "New passwords do not match." });
  }

  try {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ msg: "Password changed successfully." });
  } catch (error) {
    console.error("Password change error:", error);
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
};

exports.EditProfile = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ msg: "User ID is missing." });
  }

  const { userName, profilePicture } = req.body;

  try {
    const updatedFields = {};

    if (userName) updatedFields.userName = userName;
    if (profilePicture) updatedFields.profilePicture = profilePicture;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true, runValidators: true }
    ).select("-password -google_id -passwordResetToken -passwordResetExpires");

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found." });
    }

    res.status(200).json({
      msg: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("EditProfile Error:", error);
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
};

exports.EditBillingAddress = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ msg: "User ID is missing." });
  }

  const {
    firstName,
    lastName,
    companyName,
    phone,
    email,
    Street,
    City,
    State,
    PinCode,
    Landmark,
  } = req.body;

  try {
    const updatedBillingAddress = {
      isFilled: true,
      firstName: firstName || "None",
      lastName: lastName || "None",
      companyName: companyName || "None",
      country: "India", // Default to India
      City: City || "None",
      State: State || "None",
      PinCode: PinCode || "None",
      Street: Street || "None",
      Landmark: Landmark || "None",
      email: email || "None",
      phone: phone || "None",
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { billingAddress: updatedBillingAddress },
      { new: true, runValidators: true }
    ).select("-password -google_id -passwordResetToken -passwordResetExpires");

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found." });
    }

    res.status(200).json({
      msg: "Billing address updated successfully.",
      billingAddress: updatedUser.billingAddress,
    });
  } catch (error) {
    console.error("EditBillingAddress Error:", error);
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
};

exports.EditShippingAddress = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ msg: "User ID is missing." });
  }

  const {
    firstName,
    lastName,
    companyName,
    phone,
    email,
    Street,
    City,
    State,
    PinCode,
    Landmark,
  } = req.body;

  try {
    const updatedShippingAddress = {
      isFilled: true,
      firstName: firstName || "None",
      lastName: lastName || "None",
      companyName: companyName || "None",
      country: "India", // Default to India
      City: City || "None",
      State: State || "None",
      PinCode: PinCode || "None",
      Street: Street || "None",
      Landmark: Landmark || "None",
      email: email || "None",
      phone: phone || "None",
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { shippingAddress: updatedShippingAddress },
      { new: true, runValidators: true }
    ).select("-password -google_id -passwordResetToken -passwordResetExpires");

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found." });
    }

    res.status(200).json({
      msg: "Shipping address updated successfully.",
      shippingAddress: updatedUser.shippingAddress,
    });
  } catch (error) {
    console.error("EditShippingAddress Error:", error);
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
};

exports.addRecentActivity = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { activityType, message, icon } = req.body;

    if (!userId || !activityType || !message) {
      return res.status(400).json({ msg: "Missing required fields." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          recentActivity: {
            $each: [
              {
                activityType,
                message,
                icon: icon || "info",
                createdAt: new Date(),
              },
            ],
            $position: 0,
            $slice: 2,
          },
        },
      },
      { new: true }
    );

    return res.status(200).json({
      msg: "Activity added successfully.",
      recentActivity: updatedUser.recentActivity,
    });
  } catch (error) {
    console.error("Error adding activity:", error);
    return res.status(500).json({ msg: "Server error." });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ msg: "User ID is missing." });
    }

    const user = await User.findById(userId).select("recentActivity");

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    const recent = user.recentActivity.slice(0, 2); // Ensure only 2 are sent
    return res.status(200).json({ recentActivity: recent });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return res.status(500).json({ msg: "Server error." });
  }
};

exports.FetchResults = async (req, res) => {
  try {
    const search = req.query.search?.trim();

    // If no search term, return empty results
    if (!search) {
      return res.status(200).json([]);
    }

    // Create search query with text index
    const query = {
      $and: [
        { isActive: true }, // Only search active products
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { subCategory: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { brand: { $regex: search, $options: "i" } },
            { tags: { $regex: search, $options: "i" } },
            { finish: { $regex: search, $options: "i" } },
            { surface: { $regex: search, $options: "i" } },
          ],
        },
      ],
    };

    // Execute search with projection and limit
    const results = await WoodenFloor.find(query)
      .select("_id name subCategory images") // Only select needed fields
      .limit(6)
      .lean(); // Use lean() for better performance

    // Transform results for frontend
    const transformedResults = results.map((item, index) => ({
      id: item._id,
      name: item.name,
      category: item.subCategory,
      image: item.images?.[0] || null, // Include first image if available
    }));

    res.status(200).json(transformedResults);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Error while searching products",
      error: error.message,
    });
  }
};

exports.getUserAddress = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ msg: "User ID is missing." });
    }

    const user = await User.findById(userId).select(
      "billingAddress shippingAddress"
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }
    return res.status(200).json({
      billingAddress: user.billingAddress,
      shippingAddress: user.shippingAddress,
    });
  } catch (error) {
    console.error("Error fetching user address:", error);
    return res.status(500).json({ msg: "Server error." });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users excluding sensitive information
    const users = await User.find({})
      .select("userName email role isActive")
      .lean();

    // Format users to match frontend UI requirements
    const formattedUsers = users.map((user) => ({
      name: user.userName || "Unknown",
      email: user.email,
      role: user.role || "Customer", // Default role if not specified
      id: user._id, // Keep the ID for action buttons
    }));

    // Get total count for the header
    const totalUsers = users.length;

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users: formattedUsers,
        totalUsers,
      },
    });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({
      success: false,
      message: "Error retrieving users",
      error: err.message,
    });
  }
};

exports.addRole = async (req, res) => {
  try {
    const { userName, email, password, role } = req.body;
    console.log(req.body);
    // Validate required fields
    if (!userName || !email || !password || !role || password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: userName, email, password, and role",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with role
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      role: role.toLowerCase(), // Ensure consistent casing
    });

    // Save the user
    const savedUser = await newUser.save();

    // Remove password from response
    const userResponse = {
      _id: savedUser._id,
      userName: savedUser.userName,
      email: savedUser.email,
      role: savedUser.role,
    };

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error("Add user error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;

    // Check if the requesting user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can update user roles",
      });
    }

    // Validate the new role
    if (!["customer", "admin"].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true, runValidators: true }
    ).select("-password -google_id -passwordResetToken -passwordResetExpires");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("UpdateRole Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if the requesting user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can delete users",
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Administrators cannot delete their own account",
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DeleteRole Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.createMoodBoard = async (req, res) => {
  try {
    const thumbnails = [
      "https://150751433.v2.pressablecdn.com/wp-content/uploads/2024/08/WP4008-1024x1536.jpg",
      "https://150751433.v2.pressablecdn.com/wp-content/uploads/2024/08/WP4023-683x1024.jpg",
    ];
    const { name, address } = req.body;
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    user.MoodBoard.push({
      name,
      address,
      thumbnail: thumbnails[Math.floor(Math.random() * thumbnails.length)],
    });
    await user.save();
    res.status(200).json({
      success: true,
      message: "MoodBoard created successfully",
      data: user.MoodBoard.map((moodBoard) => {
        return {
          name: moodBoard.name,
          address: moodBoard.address,
          thumbnail: moodBoard.thumbnail,
        };
      }),
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getMoodBoard = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "MoodBoard fetched successfully",
      data: user.MoodBoard.map((moodBoard) => {
        return {
          name: moodBoard.name,
          address: moodBoard.address,
        };
      }),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteMoodBoard = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    user.MoodBoard = user.MoodBoard.filter((moodBoard) => {
      return moodBoard.name !== name;
    });
    await user.save();
    res.status(200).json({
      success: true,
      message: "MoodBoard deleted successfully",
      data: user.MoodBoard.map((moodBoard) => {
        return {
          name: moodBoard.name,
          address: moodBoard.address,
        };
      }),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateMoodBoard = async (req, res) => {
  try {
    const { name, address, formData } = req.body;
    console.log(req.body);
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const index = user.MoodBoard.findIndex((moodBoard) => {
      return moodBoard.name === name;
    });
    user.MoodBoard[index] = {
      ...formData,
      thumbnail: user.MoodBoard[index].thumbnail,
    };
    await user.save();
    res.status(200).json({
      success: true,
      message: "MoodBoard updated successfully",
      data: user.MoodBoard.map((moodBoard) => {
        return {
          name: moodBoard.name,
          address: moodBoard.address,
          thumbnail: moodBoard.thumbnail,
        };
      }),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getCollectionOfMoodBoard = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    // First find the user with the specific MoodBoard
    const user = await User.findOne({
      _id: userId,
      "MoodBoard.name": name,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const moodBoard = user.MoodBoard.find((mb) => mb.name === name);

    if (!moodBoard) {
      return res.status(404).json({
        success: false,
        message: "MoodBoard not found",
      });
    }

    // Separate Wallpaper and WoodenFloor items
    const wallpaperItems = moodBoard.collections.filter(
      (item) => item.productType === "Wallpaper"
    );
    const woodenFloorItems = moodBoard.collections.filter(
      (item) => item.productType === "WoodenFloor"
    );

    // Function to populate items
    const populateItems = async (items, model) => {
      const productIds = items.map((item) => item.productId);
      const products = await model.find({ _id: { $in: productIds } });

      return items.map((item) => {
        const product = products.find((p) => p._id.equals(item.productId));
        return {
          ...item.toObject(),
          product, // attach populated product
        };
      });
    };

    // Populate both types
    const populatedWallpapers =
      wallpaperItems.length > 0
        ? await populateItems(wallpaperItems, Wallpaper)
        : [];

    const populatedWoodenFloors =
      woodenFloorItems.length > 0
        ? await populateItems(woodenFloorItems, WoodenFloor)
        : [];

    // Combine results
    const populatedCollections = [
      ...populatedWallpapers,
      ...populatedWoodenFloors,
    ];

    res.status(200).json({
      success: true,
      message: "MoodBoard fetched successfully",
      data: populatedCollections,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.addCollectionToMoodBoard = async (req, res) => {
  try {
    const { name, productId, productType } = req.body;
    console.log(req.body);
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const moodBoard = await user.MoodBoard.find((moodBoard) => {
      return moodBoard.name === name;
    });
    if (!moodBoard) {
      return res.status(404).json({
        success: false,
        message: "MoodBoard not found",
      });
    }
    user.MoodBoard.forEach((moodBoard) => {
      if (moodBoard.name === name) {
        moodBoard.collections.push({
          productId,
          productType,
        });
      }
    });
    await user.save();
    res.status(200).json({
      success: true,
      message: "MoodBoard updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteFromMoodBoardCollections = async (req, res) => {
  try {
    const { name, productId } = req.body;

    if (!name || !productId) {
      return res.status(400).json({
        success: false,
        message: "Name and productId are required",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const moodBoardIndex = user.MoodBoard.findIndex(
      (moodBoard) => moodBoard.name === name
    );

    if (moodBoardIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "MoodBoard not found",
      });
    }

    // Filter out the item and reassign the filtered array
    user.MoodBoard[moodBoardIndex].collections = user.MoodBoard[
      moodBoardIndex
    ].collections.filter((item) => item.productId.toString() !== productId);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Item removed from MoodBoard successfully",
      data: user.MoodBoard[moodBoardIndex],
    });
  } catch (error) {
    console.error("Error in deleteFromMoodBoardCollections:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
