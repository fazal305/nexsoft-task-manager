const mongoose = require('mongoose');

const workspaceMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'manager', 'member', 'viewer'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [workspaceMemberSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Workspace', workspaceSchema);