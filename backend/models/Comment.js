const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);