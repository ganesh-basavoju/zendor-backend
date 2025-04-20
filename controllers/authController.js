const User = require('../models/userModel');
const { OAuth2Client } = require("google-auth-library");
const crypto = require('crypto');
const generateToken = require('../utils/generateToken'); // <-- Import the function
const bcrypt = require('bcryptjs');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to find user by email or phone
const findUserByEmailOrPhone = async (identifier) => {
  return await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }]
  });
};

exports.signup = async (req, res) => {
  const { email, password, fullName } = req.body;
  try {
    if (!email ) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }
    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    // Check if user exists
    const existingUser = await User.findOne({email});
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const user = await User.create({ email, password,userName:fullName });
    res.status(201).json({ message: 'User created', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.forgotPassword = async (req, res) => {
  const { identifier } = req.body; // identifier = email or phone
  try {
    const user = await findUserByEmailOrPhone(identifier);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production, send this token via email or SMS
    res.json({ message: 'Reset token generated', resetToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
        userName:name,
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
    });
  } catch (error) {
    console.error("Error verifying Google Token:", error);
    res.status(400).json({ message: "Invalid Google Token" });
  }
};