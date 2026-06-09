const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Comment = require('./models/Comment');

dotenv.config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await User.deleteMany();
    await Workspace.deleteMany();
    await Project.deleteMany();
    await Task.deleteMany();
    await Comment.deleteMany();

    const owner = await User.create({
      name: 'Admin Owner',
      email: 'owner@nexsoft.com',
      password: '123456',
      avatar: 'AO',
      avatarColor: '#f5a623'
    });

    const manager = await User.create({
      name: 'Project Manager',
      email: 'manager@nexsoft.com',
      password: '123456',
      avatar: 'PM',
      avatarColor: '#bf5fff'
    });

    const member = await User.create({
      name: 'Team Member',
      email: 'member@nexsoft.com',
      password: '123456',
      avatar: 'TM',
      avatarColor: '#00f5ff'
    });

    const workspace = await Workspace.create({
      name: 'Nexsoft Team',
      description: 'Demo workspace for internship task manager',
      owner: owner._id,
      members: [
        { userId: owner._id, role: 'owner' },
        { userId: manager._id, role: 'manager' },
        { userId: member._id, role: 'member' }
      ]
    });

    const websiteProject = await Project.create({
      name: 'Website Redesign',
      description: 'Main website redesign project',
      workspaceId: workspace._id,
      color: '#00f5ff',
      status: 'active',
      createdBy: owner._id
    });

    const mobileProject = await Project.create({
      name: 'Mobile App',
      description: 'Mobile product planning board',
      workspaceId: workspace._id,
      color: '#bf5fff',
      status: 'active',
      createdBy: manager._id
    });

    const taskOne = await Task.create({
      title: 'Design landing page layout',
      description: 'Create hero, features, pricing, and footer sections.',
      projectId: websiteProject._id,
      workspaceId: workspace._id,
      assignedTo: [member._id],
      createdBy: owner._id,
      status: 'todo',
      priority: 'high',
      tags: ['frontend', 'design'],
      activity: [{ userId: owner._id, action: 'created', details: 'created this task' }]
    });

    const taskTwo = await Task.create({
      title: 'Build authentication screens',
      description: 'Create login and register UI.',
      projectId: websiteProject._id,
      workspaceId: workspace._id,
      assignedTo: [manager._id, member._id],
      createdBy: manager._id,
      status: 'in_progress',
      priority: 'urgent',
      tags: ['auth', 'ui'],
      activity: [{ userId: manager._id, action: 'created', details: 'created this task' }]
    });

    await Task.create([
      {
        title: 'Review color system',
        projectId: websiteProject._id,
        workspaceId: workspace._id,
        assignedTo: [owner._id],
        createdBy: owner._id,
        status: 'review',
        priority: 'medium',
        tags: ['design']
      },
      {
        title: 'Deploy frontend',
        projectId: websiteProject._id,
        workspaceId: workspace._id,
        assignedTo: [manager._id],
        createdBy: owner._id,
        status: 'done',
        priority: 'low',
        completedAt: new Date(),
        tags: ['deployment']
      },
      {
        title: 'Create mobile wireframes',
        projectId: mobileProject._id,
        workspaceId: workspace._id,
        assignedTo: [member._id],
        createdBy: manager._id,
        status: 'todo',
        priority: 'medium',
        tags: ['mobile']
      },
      {
        title: 'Plan notification system',
        projectId: mobileProject._id,
        workspaceId: workspace._id,
        assignedTo: [manager._id],
        createdBy: owner._id,
        status: 'in_progress',
        priority: 'high',
        tags: ['planning']
      },
      {
        title: 'Test dashboard flow',
        projectId: mobileProject._id,
        workspaceId: workspace._id,
        assignedTo: [owner._id, member._id],
        createdBy: manager._id,
        status: 'review',
        priority: 'urgent',
        tags: ['testing']
      },
      {
        title: 'Finalize demo checklist',
        projectId: mobileProject._id,
        workspaceId: workspace._id,
        assignedTo: [owner._id],
        createdBy: owner._id,
        status: 'done',
        priority: 'medium',
        completedAt: new Date(),
        tags: ['demo']
      }
    ]);

    await Comment.create([
      {
        taskId: taskOne._id,
        authorId: owner._id,
        content: 'Start with a clean responsive layout.'
      },
      {
        taskId: taskOne._id,
        authorId: member._id,
        content: 'I will prepare the first version today.'
      },
      {
        taskId: taskTwo._id,
        authorId: manager._id,
        content: 'Auth screens are in progress.'
      }
    ]);

    console.log('Seed data created successfully');
    console.log('Owner: owner@nexsoft.com / 123456');
    console.log('Manager: manager@nexsoft.com / 123456');
    console.log('Member: member@nexsoft.com / 123456');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();