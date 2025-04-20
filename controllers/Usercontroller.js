const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

exports.FetchUserProfile = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(400).json({ msg: "User ID is required" });
    }

    try {
        const user = await User.findById(userId)
            .select("-google_id -password -passwordResetToken -passwordResetExpires")
            .populate(["cart", "orders", "wishlist"]);

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        return res.status(200).json({
            msg: "User profile fetched successfully",
            data: user
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({
            msg: "Internal server error",
            error: error.message
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
        res.status(500).json({ msg: "Internal server error", error: error.message });
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
            data: updatedUser
        });
    } catch (error) {
        console.error("EditProfile Error:", error);
        res.status(500).json({ msg: "Internal server error", error: error.message });
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
        country,
        City,
        State,
        Pincode,
        Street,
        Landmark,
        email,
        phone
    } = req.body;

    try {
        const updatedBillingAddress = {
            isFilled: true,
            firstName: firstName || "None",
            lastName: lastName || "None",
            companyName: companyName || "None",
            country: country || "None",
            City: City || "None",
            State: State || "None",
            Pincode: Pincode || "None",
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
            billingAddress: updatedUser.billingAddress
        });

    } catch (error) {
        console.error("EditBillingAddress Error:", error);
        res.status(500).json({ msg: "Internal server error", error: error.message });
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
        country,
        City,
        State,
        Pincode,
        Street,
        Landmark,
        email,
        phone
    } = req.body;

    try {
        const updatedShippingAddress = {
            isFilled: true,
            firstName: firstName || "None",
            lastName: lastName || "None",
            companyName: companyName || "None",
            country: country || "None",
            City: City || "None",
            State: State || "None",
            Pincode: Pincode || "None",
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
            shippingAddress: updatedUser.shippingAddress
        });

    } catch (error) {
        console.error("EditShippingAddress Error:", error);
        res.status(500).json({ msg: "Internal server error", error: error.message });
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


