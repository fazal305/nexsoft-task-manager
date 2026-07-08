# Nexsoft Task Manager

A full-stack task management system with workspaces, projects, Kanban tasks, comments, role-based collaboration, JWT authentication, and MongoDB persistence.

## Live Links

- GitHub Repository: https://github.com/fazal305/nexsoft-task-manager
- Frontend Demo: https://nexsoft-task-manager.netlify.app/
- Backend API: https://nexsoft-task-manager.onrender.com/

## Overview

Nexsoft Task Manager is a full-stack productivity app built for the Nexsoft Solutions internship.

The project allows users to register, log in, create workspaces, manage projects, create tasks, move tasks through a Kanban board, assign users, add comments, and view activity updates.

## Features

- User registration and login
- JWT authentication
- MongoDB Atlas database
- Workspace management
- Project management
- Task CRUD operations
- Kanban board
- Drag-and-drop task status updates
- Task priority system
- Task assignment
- Task comments
- Activity timeline
- Role-based workspace system
- Responsive dark UI
- Backend health endpoint
- Deployed frontend and backend

## Tech Stack

### Frontend

- HTML5
- CSS3
- Bootstrap 5
- jQuery
- Vanilla JavaScript
- Netlify

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcryptjs
- CORS
- dotenv
- Render

## Demo Accounts

```text
Owner: owner@nexsoft.com / 123456
Manager: manager@nexsoft.com / 123456
Member: member@nexsoft.com / 123456
```

Folder Structure
nexsoft-task-manager/
backend/
middleware/
authMiddleware.js
roleMiddleware.js
models/
Comment.js
Project.js
Task.js
User.js
Workspace.js
routes/
auth.js
projects.js
tasks.js
users.js
workspaces.js
.env.example
package.json
seed.js
server.js
frontend/
app.js
dashboard.html
index.html
login.html
register.html
script.js
styles.css
task.html
workspace.html
.gitignore
LICENSE
README.md
Getting Started
git clone https://github.com/fazal305/nexsoft-task-manager.git
cd nexsoft-task-manager
cd backend
npm install

Create backend/.env:

PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:8080

Start backend:

npm start

Open frontend files using VS Code Live Server.

API Endpoints
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

GET /api/workspaces
POST /api/workspaces
GET /api/workspaces/:id
GET /api/workspaces/:workspaceId/projects
POST /api/workspaces/:workspaceId/projects

GET /api/projects/:projectId/tasks
POST /api/projects/:projectId/tasks
GET /api/tasks/:taskId
PUT /api/tasks/:taskId
DELETE /api/tasks/:taskId
PATCH /api/tasks/:taskId/status
POST /api/tasks/:taskId/comments

GET /api/users/my-tasks
GET /api/health
Architecture Notes

The app uses a separated frontend and backend structure.

The frontend handles authentication pages, dashboard UI, workspace UI, Kanban board, task detail page, drag-and-drop behavior, comments, and API calls.
The backend handles authentication, JWT verification, role middleware, workspace/project/task/comment models, and protected API routes.
MongoDB stores users, workspaces, projects, tasks, and comments.
Accessibility
Semantic page structure
Form labels
Button-based actions
Responsive dashboard layout
Toast feedback messages
Safer escaped frontend rendering for dynamic API data
Performance
Static frontend
Lightweight JavaScript
No frontend build step
MongoDB-backed persistence
Separate frontend/backend deployment
Testing Checklist
cd backend
npm run check
node --check routes/auth.js
node --check routes/workspaces.js
node --check routes/projects.js
node --check routes/tasks.js
node --check routes/users.js
node --check middleware/authMiddleware.js
node --check middleware/roleMiddleware.js

Manual testing:

Register user
Login user
Create workspace
Create project
Create task
Move task between columns
Open task details
Assign user
Add comment
Delete task
Logout
Test backend health route
Test mobile responsiveness
Lessons Learned
Building full-stack task management workflows
Creating JWT authentication
Designing MongoDB schemas for collaborative apps
Handling workspace/project/task relationships
Building Kanban drag-and-drop UI
Creating comments and activity tracking
Preparing full-stack internship work for portfolio presentation
Future Improvements
Add real-time updates with Socket.io
Add project invite system
Add due date reminders
Add file attachments
Add task labels
Add notification center
Add analytics dashboard
Add automated API tests
Add React version later
