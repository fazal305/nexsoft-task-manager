const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Workspace = require('../models/Workspace');
const authMiddleware = require('../middleware/authMiddleware');
const { rolePower } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

async function getUserRoleInWorkspace(workspaceId, userId) {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return null;
  }

  const member = workspace.members.find((workspaceMember) => {
    return workspaceMember.userId.toString() === userId.toString();
  });

  return member ? member.role : null;
}

function canEdit(role) {
  return rolePower[role] >= rolePower.member;
}

function canManage(role) {
  return rolePower[role] >= rolePower.manager;
}

router.get('/projects/:projectId/tasks', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const role = await getUserRoleInWorkspace(project.workspaceId, req.user._id);

    if (!role) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo', 'name email avatar avatarColor')
      .populate('createdBy', 'name email avatar avatarColor')
      .sort({ order: 1, createdAt: -1 });

    const comments = await Comment.find({
      taskId: { $in: tasks.map((task) => task._id) }
    });

    const groupedTasks = {
      todo: [],
      in_progress: [],
      review: [],
      done: []
    };

    tasks.forEach((task) => {
      const plainTask = task.toObject();
      plainTask.commentCount = comments.filter((comment) => {
        return comment.taskId.toString() === task._id.toString();
      }).length;

      groupedTasks[task.status].push(plainTask);
    });

    res.json({ tasks: groupedTasks });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load tasks', error: error.message });
  }
});

router.post('/projects/:projectId/tasks', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const role = await getUserRoleInWorkspace(project.workspaceId, req.user._id);

    if (!role || !canEdit(role)) {
      return res.status(403).json({ message: 'You do not have permission to create tasks' });
    }

    const { title, description, status, priority, assignedTo, dueDate, tags } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      tags,
      projectId: project._id,
      workspaceId: project.workspaceId,
      createdBy: req.user._id,
      activity: [
        {
          userId: req.user._id,
          action: 'created',
          details: 'created this task'
        }
      ]
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar avatarColor')
      .populate('createdBy', 'name email avatar avatarColor');

    res.status(201).json({
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
});

router.get('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar avatarColor')
      .populate('createdBy', 'name email avatar avatarColor')
      .populate('activity.userId', 'name avatar avatarColor');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const role = await getUserRoleInWorkspace(task.workspaceId, req.user._id);

    if (!role) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    const comments = await Comment.find({ taskId: task._id })
      .populate('authorId', 'name email avatar avatarColor')
      .sort({ createdAt: 1 });

    res.json({ task, comments, role });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load task', error: error.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const role = await getUserRoleInWorkspace(task.workspaceId, req.user._id);

    if (!role || !canEdit(role)) {
      return res.status(403).json({ message: 'You do not have permission to update tasks' });
    }

    const { title, description, status, priority, assignedTo, dueDate, tags } = req.body;

    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.status = status ?? task.status;
    task.priority = priority ?? task.priority;
    task.assignedTo = assignedTo ?? task.assignedTo;
    task.dueDate = dueDate ?? task.dueDate;
    task.tags = tags ?? task.tags;
    task.completedAt = task.status === 'done' ? new Date() : null;

    task.activity.push({
      userId: req.user._id,
      action: 'updated',
      details: 'updated task details'
    });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar avatarColor')
      .populate('createdBy', 'name email avatar avatarColor');

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const role = await getUserRoleInWorkspace(task.workspaceId, req.user._id);
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!role || (!canManage(role) && !isCreator)) {
      return res.status(403).json({ message: 'Only managers, owners, or task creators can delete this task' });
    }

    await Comment.deleteMany({ taskId: task._id });
    await Task.findByIdAndDelete(task._id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
});

router.patch('/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const role = await getUserRoleInWorkspace(task.workspaceId, req.user._id);

    if (!role || !canEdit(role)) {
      return res.status(403).json({ message: 'You do not have permission to move tasks' });
    }

    task.status = status;
    task.completedAt = status === 'done' ? new Date() : null;

    task.activity.push({
      userId: req.user._id,
      action: 'status_changed',
      details: `moved task to ${status}`
    });

    await task.save();

    res.json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
});

router.patch('/tasks/:id/assign', async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const role = await getUserRoleInWorkspace(task.workspaceId, req.user._id);

    if (!role || !canEdit(role)) {
      return res.status(403).json({ message: 'You do not have permission to assign tasks' });
    }

    task.assignedTo = assignedTo || [];

    task.activity.push({
      userId: req.user._id,
      action: 'assigned',
      details: 'updated task assignees'
    });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar avatarColor');

    res.json({
      message: 'Task assignees updated successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update assignees', error: error.message });
  }
});

router.patch('/tasks/:id/order', async (req, res) => {
  try {
    const { order } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const role = await getUserRoleInWorkspace(task.workspaceId, req.user._id);

    if (!role || !canEdit(role)) {
      return res.status(403).json({ message: 'You do not have permission to reorder tasks' });
    }

    task.order = order;
    await task.save();

    res.json({
      message: 'Task order updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
});

router.post('/tasks/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const role = await getUserRoleInWorkspace(task.workspaceId, req.user._id);

    if (!role || !canEdit(role)) {
      return res.status(403).json({ message: 'You do not have permission to comment' });
    }

    const comment = await Comment.create({
      taskId: task._id,
      authorId: req.user._id,
      content
    });

    task.activity.push({
      userId: req.user._id,
      action: 'commented',
      details: 'added a comment'
    });

    await task.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('authorId', 'name email avatar avatarColor');

    res.status(201).json({
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

router.put('/tasks/:taskId/comments/:commentId', async (req, res) => {
  try {
    const { content } = req.body;

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    comment.content = content;
    comment.isEdited = true;

    await comment.save();

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update comment', error: error.message });
  }
});

router.delete('/tasks/:taskId/comments/:commentId', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await Comment.findByIdAndDelete(comment._id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
});

module.exports = router;