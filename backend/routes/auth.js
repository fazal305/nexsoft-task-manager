const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const avatarColors = ['#00f5ff', '#bf5fff', '#00ff88', '#f5a623', '#ff3860', '#ff6b35'];

function createAvatar(name) {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getRandomAvatarColor() {
  return avatarColors[Math.floor(Math.random() * avatarColors.length)];
}

function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      avatar: createAvatar(name),
      avatarColor: getRandomAvatarColor()
    });

    const token = createToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        avatarColor: user.avatarColor
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        avatarColor: user.avatarColor
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      avatarColor: req.user.avatarColor
    }
  });
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatarColor } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name, avatar: createAvatar(name) }),
        ...(avatarColor && { avatarColor })
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
});

module.exports = router;