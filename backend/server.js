const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Nexsoft Task Manager API is running',
    status: 'healthy'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    message: 'Backend health check passed',
    database: mongoose.connection.readyState === 1
      ? 'connected'
      : 'not connected'
  });
});

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

connectDatabase();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});