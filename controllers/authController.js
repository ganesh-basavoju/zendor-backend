const User = require("../models/userModel");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const generateToken = require("../utils/generateToken"); // <-- Import the function
const bcrypt = require("bcryptjs");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to find user by email or phone

exports.signup = async (req, res) => {
  const { email, password, fullName } = req.body;
  
  try {
    // Validate input
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!fullName) {
      return res.status(400).json({ error: "Full name is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password before creating the user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with hashed password
    const user = await User.create({ 
      email, 
      password: hashedPassword, 
      userName: fullName ,
      role: "customer",
    });

    // Generate token if needed
    const token = generateToken(user);

    res.status(201).json({ 
      message: "User created successfully",
      data: {
        userId: user._id,
        name: user.userName,
        email: user.email,
        role: user.role,
        token // Include if using immediate login after signup
      }
    });
    
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ 
      error: "Error creating user",
      details: err.message 
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    console.log(await bcrypt.compare(password, user.password),"crt")
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = generateToken(user);
    res
      .status(200)
      .json({
        token: token,
        name: user.userName,
        email: user.email,
        role: user.role,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with that email address",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    // Save OTP to user document with 2 minutes expiry
    user.passwordResetToken = hashedOTP;
    user.passwordResetExpires = Date.now() + 2 * 60 * 1000; // 2 minutes
    await user.save({ validateBeforeSave: false });

    try {
      const sendEmail = require("../utils/emailService");
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP - Zendor",
        message: `Your OTP for password reset is: ${otp}. Valid for 2 minutes only.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Password Reset OTP</h2>
            <p>Hello ${user.userName},</p>
            <p>We received a request to reset your password. Here is your One Time Password (OTP):</p>
            <div style="text-align: center; margin: 30px 0;">
              <h1 style="color: #4CAF50; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
            </div>
            <p style="color: #f44336;"><strong>Note: This OTP is valid for 2 minutes only!</strong></p>
            <p>If you didn't request this, please ignore this email and make sure your account is secure.</p>
            <p>Regards,<br>The Zendor Team</p>
          </div>
        `,
      });

      res.status(200).json({
        success: true,
        message: "OTP sent to your email",
      });
    } catch (error) {
      // If email sending fails, clean up the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Error sending OTP email",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("ForgotPassword Error:", error);
    res.status(500).json({
      success: false,
      message: "Error in password reset process",
      error: error.message,
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log(req.body);
    
    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, OTP and new password",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    console.log(user,"ksjhdfkj");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if OTP exists and not expired
    if (!user.passwordResetToken || !user.passwordResetExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found. Please request a new OTP",
      });
    }

    // Check if OTP is expired
    if (user.passwordResetExpires < Date.now()) {
      // Clear expired OTP
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one",
      });
    }

    // Hash the provided OTP to compare with stored hash
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    // Verify OTP
    if (hashedOTP !== user.passwordResetToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Hash the new password manually to ensure it's always hashed
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    console.log(user.password);
    
    // Clear reset tokens
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Save user with new password
    await user.save();

    // Generate new login token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: {
        token,
        name: user.userName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("VerifyOTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying OTP and changing password",
      error: error.message,
    });
  }
};

exports.googleAuth = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ google_id }, { email }] });

    if (!user) {
      user = await User.create({
        google_id,
        userName: name,
        email,
        profilePicture: picture,
      });
    }

    const jwtToken = generateToken(user); // <-- Use generateToken here
    res.status(200).json({
      _id: user._id,
      name: user.userName,
      email: user.email,
      token: jwtToken,
      role: user.role,
    });
  } catch (error) {
    console.error("Error verifying Google Token:", error);
    res.status(400).json({ message: "Invalid Google Token" });
  }
};
