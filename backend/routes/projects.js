const express = require('express');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/workspaces/:workspaceId/projects', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: 'Workspace not found'
      });
    }

    const isMember = workspace.members.some((member) => {
      return member.userId.toString() === req.user._id.toString();
    });

    if (!isMember) {
      return res.status(403).json({
        message: 'You are not a member of this workspace'
      });
    }

    const projects = await Project.find({
      workspaceId: req.params.workspaceId
    }).sort({
      createdAt: -1
    });

    res.json({
      projects
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to load projects',
      error: error.message
    });
  }
});

router.post('/workspaces/:workspaceId/projects', requireRole('manager'), async (req, res) => {
  try {
    const {
      name,
      description,
      color,
      status,
      deadline
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Project name is required'
      });
    }

    const project = await Project.create({
      name,
      description,
      color,
      status,
      deadline,
      workspaceId: req.params.workspaceId,
      createdBy: req.user._id
    });

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create project',
      error: error.message
    });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    req.params.workspaceId = project.workspaceId.toString();

    requireRole('manager')(req, res, async () => {
      const {
        name,
        description,
        color,
        status,
        deadline
      } = req.body;

      const updatedProject = await Project.findByIdAndUpdate(
        req.params.id,
        {
          name,
          description,
          color,
          status,
          deadline
        },
        {
          new: true
        }
      );

      res.json({
        message: 'Project updated successfully',
        project: updatedProject
      });
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update project',
      error: error.message
    });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    req.params.workspaceId = project.workspaceId.toString();

    requireRole('manager')(req, res, async () => {
      await Project.findByIdAndDelete(req.params.id);

      res.json({
        message: 'Project deleted successfully'
      });
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

module.exports = router;