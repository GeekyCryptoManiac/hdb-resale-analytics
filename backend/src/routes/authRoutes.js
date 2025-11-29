// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const authMiddleware = require("../middleware/authMiddleware");

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('📝 Registration attempt for:', email);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ name, email, password, comparisonList: [] });
    await user.save();

    console.log('✅ User registered successfully:', email);
    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare hashed password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    console.log('✅ Login successful for:', email, '| User ID:', user._id);

    res.json({
      token,
      user: {
        id: user._id,
        _id: user._id,  // Include both for compatibility
        name: user.name,
        email: user.email,
        comparisonList: user.comparisonList || []  // Include comparison list
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

//Update
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const updateData = { name, email };
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(req.user.id, updateData);

    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ message: "Update error" });
  }
});


module.exports = router;