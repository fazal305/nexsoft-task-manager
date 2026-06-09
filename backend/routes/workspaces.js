const express = require('express');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.userId': req.user._id
    }).populate('members.userId', 'name email avatar avatarColor');

    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load workspaces', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [
        {
          userId: req.user._id,
          role: 'owner'
        }
      ]
    });

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create workspace', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('members.userId', 'name email avatar avatarColor');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspace.members.some((member) => {
      return member.userId._id.toString() === req.user._id.toString();
    });

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load workspace', error: error.message });
  }
});

router.put('/:id', requireRole('manager'), async (req, res) => {
  try {
    const { name, description } = req.body;

    const workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );

    res.json({
      message: 'Workspace updated successfully',
      workspace
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update workspace', error: error.message });
  }
});

router.delete('/:id', requireRole('owner'), async (req, res) => {
  try {
    await Workspace.findByIdAndDelete(req.params.id);

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete workspace', error: error.message });
  }
});

router.post('/:id/invite', requireRole('manager'), async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    const invitedUser = await User.findOne({ email });

    if (!invitedUser) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const workspace = req.workspace;

    const alreadyMember = workspace.members.some((member) => {
      return member.userId.toString() === invitedUser._id.toString();
    });

    if (alreadyMember) {
      return res.status(409).json({ message: 'User is already a workspace member' });
    }

    workspace.members.push({
      userId: invitedUser._id,
      role
    });

    await workspace.save();

    res.json({
      message: 'Member invited successfully',
      workspace
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to invite member', error: error.message });
  }
});

router.put('/:id/members/:userId/role', requireRole('owner'), async (req, res) => {
  try {
    const { role } = req.body;
    const workspace = req.workspace;

    if (workspace.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Owner role cannot be changed' });
    }

    const member = workspace.members.find((workspaceMember) => {
      return workspaceMember.userId.toString() === req.params.userId;
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.role = role;
    await workspace.save();

    res.json({
      message: 'Member role updated successfully',
      workspace
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role', error: error.message });
  }
});

router.delete('/:id/members/:userId', requireRole('manager'), async (req, res) => {
  try {
    const workspace = req.workspace;

    if (workspace.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Owner cannot be removed' });
    }

    workspace.members = workspace.members.filter((member) => {
      return member.userId.toString() !== req.params.userId;
    });

    await workspace.save();

    res.json({
      message: 'Member removed successfully',
      workspace
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove member', error: error.message });
  }
});

module.exports = router;