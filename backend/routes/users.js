const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/search', async (req, res) => {
  try {
    const searchQuery = req.query.q || '';

    if (!searchQuery) {
      return res.status(400).json({
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      email: {
        $regex: searchQuery,
        $options: 'i'
      }
    })
      .select('name email avatar avatarColor')
      .limit(10);

    res.json({
      users
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to search users',
      error: error.message
    });
  }
});

router.get('/my-tasks', async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user._id
    })
      .populate('projectId', 'name color status')
      .populate('workspaceId', 'name')
      .populate('createdBy', 'name email avatar avatarColor')
      .sort({
        dueDate: 1,
        createdAt: -1
      });

    res.json({
      tasks
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to load your tasks',
      error: error.message
    });
  }
});

module.exports = router;