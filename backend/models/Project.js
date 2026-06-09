const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  color: {
    type: String,
    default: '#00f5ff'
  },
  status: {
    type: String,
    enum: ['active', 'on_hold', 'completed', 'archived'],
    default: 'active'
  },
  deadline: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);