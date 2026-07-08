const API_BASE = 'https://nexsoft-task-manager.onrender.com/api';

let selectedWorkspaceId = null;
let draggedTaskId = null;

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message) {
  $('#toast').text(message || 'Something happened').addClass('show');
  setTimeout(() => $('#toast').removeClass('show'), 2600);
}

function getToken() {
  return localStorage.getItem('taskflowToken');
}

function getUser() {
  try {
    const user = localStorage.getItem('taskflowUser');
    return user ? JSON.parse(user) : null;
  } catch {
    localStorage.removeItem('taskflowUser');
    return null;
  }
}

function saveAuth(token, user) {
  localStorage.setItem('taskflowToken', token);
  localStorage.setItem('taskflowUser', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('taskflowToken');
  localStorage.removeItem('taskflowUser');
  window.location.href = 'index.html';
}

function protectPage() {
  const publicPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

  if (!publicPage && !getToken()) {
    window.location.href = 'index.html';
  }
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const token = getToken();

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Unable to connect to the server.');
  }
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatDate(dateValue) {
  return dateValue ? new Date(dateValue).toLocaleDateString() : 'No Due Date';
}

function formatDateTime(dateValue) {
  return dateValue ? new Date(dateValue).toLocaleString() : 'Unknown time';
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';

  $('#loginTab').toggleClass('active', isLogin);
  $('#registerTab').toggleClass('active', !isLogin);
  $('#loginForm').toggleClass('hidden', !isLogin);
  $('#registerForm').toggleClass('hidden', isLogin);
}

function renderUserPill() {
  const user = getUser();

  if (user && $('#userPill').length) {
    $('#userPill').text(`${user.avatar || '👤'} ${user.name}`);
  }
}

function createAvatarMarkup(users) {
  if (!users || users.length === 0) {
    return '';
  }

  return `
    <div class="avatar-row">
      ${users.map((user) => `
        <div class="avatar-circle" style="background:${escapeHtml(user.avatarColor || '#00f5ff')};" title="${escapeHtml(user.name)}">
          ${escapeHtml(user.avatar || '👤')}
        </div>
      `).join('')}
    </div>
  `;
}

function renderTaskCard(task) {
  return `
    <article class="task-card priority-${escapeHtml(task.priority)}" draggable="true" data-task-id="${escapeHtml(task._id)}">
      <h3>${escapeHtml(task.title)}</h3>
      <div class="task-meta">
        <span class="priority-badge">${escapeHtml(task.priority)}</span>
        <span class="date-badge">${escapeHtml(formatDate(task.dueDate))}</span>
        <span class="comment-badge">💬 ${Number(task.commentCount || 0)}</span>
      </div>
      ${createAvatarMarkup(task.assignedTo)}
    </article>
  `;
}

function populateTaskColumn(selector, tasks) {
  if (!tasks || tasks.length === 0) {
    $(selector).html('<div class="empty-column">No tasks</div>');
    return;
  }

  $(selector).html(tasks.map(renderTaskCard).join(''));
}

function renderComments(comments) {
  if (!comments || comments.length === 0) {
    $('#commentList').html('<p class="muted-text">No comments yet.</p>');
    return;
  }

  $('#commentList').html(comments.map((comment) => `
    <article class="comment-card">
      <strong>${escapeHtml(comment.authorId ? comment.authorId.name : 'Unknown user')}</strong>
      <span class="comment-time">${escapeHtml(formatDateTime(comment.createdAt))}</span>
      <p>${escapeHtml(comment.content)}</p>
    </article>
  `).join(''));
}

function renderActivity(activity) {
  if (!activity || activity.length === 0) {
    $('#activityList').html('<p class="muted-text">No activity yet.</p>');
    return;
  }

  $('#activityList').html(activity.map((item) => `
    <article class="activity-card">
      <span class="activity-time">${escapeHtml(formatDateTime(item.createdAt))}</span>
      <p>${escapeHtml(item.userId ? item.userId.name : 'System')} ${escapeHtml(item.details)}</p>
    </article>
  `).join(''));
}

async function loadProjectsForWorkspace(workspaceId) {
  const projectData = await apiCall(`/workspaces/${workspaceId}/projects`);
  const projects = projectData.projects || [];

  $('#projectCount').text(projects.length);

  $('#projectList').html(projects.length ? projects.map((project) => `
    <article class="project-card" data-project-id="${escapeHtml(project._id)}">
      <h3>${escapeHtml(project.name)}</h3>
      <p class="muted-text">${escapeHtml(project.description || 'No description added.')}</p>
      <span class="role-badge">${escapeHtml(project.status)}</span>
    </article>
  `).join('') : '<p class="muted-text">No projects found.</p>');
}

async function loadDashboard() {
  try {
    const workspaceData = await apiCall('/workspaces');
    const taskData = await apiCall('/users/my-tasks');
    const workspaces = workspaceData.workspaces || [];
    const currentUser = getUser();

    $('#workspaceCount').text(workspaces.length);
    $('#myTaskCount').text((taskData.tasks || []).length);

    $('#projectWorkspaceInput').html(`
      <option value="">Choose workspace</option>
      ${workspaces.map((workspace) => `<option value="${escapeHtml(workspace._id)}">${escapeHtml(workspace.name)}</option>`).join('')}
    `);

    if (!workspaces.length) {
      $('#workspaceList').html('<p class="muted-text">No workspaces found.</p>');
      $('#projectList').html('<p class="muted-text">Create a workspace first.</p>');
      $('#projectCount').text(0);
      return;
    }

    selectedWorkspaceId = selectedWorkspaceId || workspaces[0]._id;
    $('#projectWorkspaceInput').val(selectedWorkspaceId);

    $('#workspaceList').html(workspaces.map((workspace) => {
      const currentMember = workspace.members.find((member) => {
        return currentUser && member.userId && member.userId._id === currentUser.id;
      });

      return `
        <article class="workspace-card" data-workspace-id="${escapeHtml(workspace._id)}">
          <h3>${escapeHtml(workspace.name)}</h3>
          <p class="muted-text">${escapeHtml(workspace.description || 'No description added.')}</p>
          <span class="role-badge">${escapeHtml(currentMember ? currentMember.role : 'member')}</span>
        </article>
      `;
    }).join(''));

    await loadProjectsForWorkspace(selectedWorkspaceId);
  } catch (error) {
    showToast(error.message);
  }
}

async function createWorkspace(event) {
  event.preventDefault();

  try {
    const data = await apiCall('/workspaces', 'POST', {
      name: $('#workspaceNameInput').val().trim(),
      description: $('#workspaceDescriptionInput').val().trim()
    });

    selectedWorkspaceId = data.workspace._id;
    $('#createWorkspaceForm')[0].reset();

    showToast('Workspace created successfully');
    loadDashboard();
  } catch (error) {
    showToast(error.message);
  }
}

async function createProject(event) {
  event.preventDefault();

  try {
    const workspaceId = $('#projectWorkspaceInput').val();

    if (!workspaceId) {
      showToast('Select a workspace first');
      return;
    }

    await apiCall(`/workspaces/${workspaceId}/projects`, 'POST', {
      name: $('#projectNameInput').val().trim(),
      description: $('#projectDescriptionInput').val().trim(),
      color: $('#projectColorInput').val(),
      status: $('#projectStatusInput').val()
    });

    selectedWorkspaceId = workspaceId;
    $('#createProjectForm')[0].reset();
    $('#projectWorkspaceInput').val(workspaceId);

    showToast('Project created successfully');
    loadDashboard();
  } catch (error) {
    showToast(error.message);
  }
}

async function loadWorkspaceBoard() {
  try {
    const projectId = getQueryParam('projectId');

    if (!projectId) {
      showToast('Project not selected.');
      return;
    }

    const taskData = await apiCall(`/projects/${projectId}/tasks`);
    const groups = taskData.tasks || {
      todo: [],
      in_progress: [],
      review: [],
      done: []
    };

    populateTaskColumn('#todoList', groups.todo);
    populateTaskColumn('#progressList', groups.in_progress);
    populateTaskColumn('#reviewList', groups.review);
    populateTaskColumn('#doneList', groups.done);

    $('#todoCount').text(groups.todo.length);
    $('#progressCount').text(groups.in_progress.length);
    $('#reviewCount').text(groups.review.length);
    $('#doneCount').text(groups.done.length);
  } catch (error) {
    showToast(error.message);
  }
}

async function createTask(event) {
  event.preventDefault();

  try {
    const projectId = getQueryParam('projectId');

    if (!projectId) {
      showToast('Project not selected');
      return;
    }

    await apiCall(`/projects/${projectId}/tasks`, 'POST', {
      title: $('#newTaskTitle').val().trim(),
      description: $('#newTaskDescription').val().trim(),
      status: $('#newTaskStatus').val(),
      priority: $('#newTaskPriority').val()
    });

    $('#createTaskForm')[0].reset();
    $('#taskCreatePanel').addClass('hidden');

    showToast('Task created successfully');
    loadWorkspaceBoard();
  } catch (error) {
    showToast(error.message);
  }
}

async function renderAssigneeList(task) {
  try {
    const workspaceId = typeof task.workspaceId === 'object' ? task.workspaceId._id : task.workspaceId;
    const workspaceData = await apiCall(`/workspaces/${workspaceId}`);
    const members = workspaceData.workspace.members || [];
    const assignedIds = (task.assignedTo || []).map((user) => user._id);

    $('#assigneeList').html(members.map((member) => {
      const user = member.userId;
      const isChecked = assignedIds.includes(user._id);

      return `
        <label class="assignee-option">
          <input type="checkbox" class="assignee-checkbox" value="${escapeHtml(user._id)}" ${isChecked ? 'checked' : ''}>
          <span>${escapeHtml(user.avatar || '👤')} ${escapeHtml(user.name)} — ${escapeHtml(member.role)}</span>
        </label>
      `;
    }).join(''));
  } catch {
    $('#assigneeList').html('<p class="muted-text">Could not load workspace members.</p>');
  }
}

function getSelectedAssignees() {
  return $('.assignee-checkbox:checked').map(function () {
    return $(this).val();
  }).get();
}

async function loadTaskDetail() {
  try {
    const taskId = getQueryParam('taskId');

    if (!taskId) {
      showToast('Task not selected.');
      return;
    }

    const data = await apiCall(`/tasks/${taskId}`);
    const task = data.task;

    $('#taskTitle').text(task.title);
    $('#taskTitleInput').val(task.title);
    $('#taskDescriptionInput').val(task.description);
    $('#taskStatusInput').val(task.status);
    $('#taskPriorityInput').val(task.priority);

    await renderAssigneeList(task);
    renderComments(data.comments || []);
    renderActivity(task.activity || []);
  } catch (error) {
    showToast(error.message);
  }
}

async function updateTaskDetail() {
  try {
    const taskId = getQueryParam('taskId');

    await apiCall(`/tasks/${taskId}`, 'PUT', {
      title: $('#taskTitleInput').val().trim(),
      description: $('#taskDescriptionInput').val().trim(),
      status: $('#taskStatusInput').val(),
      priority: $('#taskPriorityInput').val(),
      assignedTo: getSelectedAssignees()
    });

    showToast('Task updated successfully');
    loadTaskDetail();
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteTask() {
  try {
    const confirmed = confirm('Delete this task permanently?');

    if (!confirmed) return;

    const taskId = getQueryParam('taskId');

    await apiCall(`/tasks/${taskId}`, 'DELETE');

    showToast('Task deleted');
    window.location.href = 'dashboard.html';
  } catch (error) {
    showToast(error.message);
  }
}

async function addComment(event) {
  event.preventDefault();

  try {
    const taskId = getQueryParam('taskId');
    const content = $('#commentInput').val().trim();

    if (!content) {
      showToast('Comment cannot be empty');
      return;
    }

    await apiCall(`/tasks/${taskId}/comments`, 'POST', { content });

    $('#commentInput').val('');
    showToast('Comment added');
    loadTaskDetail();
  } catch (error) {
    showToast(error.message);
  }
}

async function updateTaskStatus(taskId, status) {
  try {
    await apiCall(`/tasks/${taskId}/status`, 'PATCH', { status });

    showToast('Task moved');
    loadWorkspaceBoard();
  } catch (error) {
    showToast(error.message);
  }
}

$(document).ready(() => {
  protectPage();
  renderUserPill();

  $('#loginTab').on('click', () => switchAuthTab('login'));
  $('#registerTab').on('click', () => switchAuthTab('register'));
  $('#logoutBtn').on('click', logout);

  $('#createWorkspaceForm').on('submit', createWorkspace);
  $('#createProjectForm').on('submit', createProject);

  $('#projectWorkspaceInput').on('change', function () {
    selectedWorkspaceId = $(this).val();

    if (selectedWorkspaceId) {
      loadProjectsForWorkspace(selectedWorkspaceId);
    }
  });

  $('#openTaskFormBtn').on('click', () => $('#taskCreatePanel').removeClass('hidden'));
  $('#closeTaskFormBtn').on('click', () => $('#taskCreatePanel').addClass('hidden'));
  $('#createTaskForm').on('submit', createTask);

  $('#updateTaskBtn').on('click', updateTaskDetail);
  $('#deleteTaskBtn').on('click', deleteTask);
  $('#commentForm').on('submit', addComment);

  $('#loginForm').on('submit', async function (event) {
    event.preventDefault();

    try {
      const data = await apiCall('/auth/login', 'POST', {
        email: $('#loginEmail').val().trim(),
        password: $('#loginPassword').val()
      });

      saveAuth(data.token, data.user);
      window.location.href = 'dashboard.html';
    } catch (error) {
      showToast(error.message);
    }
  });

  $('#registerForm').on('submit', async function (event) {
    event.preventDefault();

    try {
      const data = await apiCall('/auth/register', 'POST', {
        name: $('#registerName').val().trim(),
        email: $('#registerEmail').val().trim(),
        password: $('#registerPassword').val()
      });

      saveAuth(data.token, data.user);
      window.location.href = 'dashboard.html';
    } catch (error) {
      showToast(error.message);
    }
  });

  if ($('#workspaceList').length) loadDashboard();
  if ($('#todoList').length) loadWorkspaceBoard();
  if ($('#taskTitleInput').length) loadTaskDetail();

  $(document).on('click', '.workspace-card', function () {
    selectedWorkspaceId = $(this).data('workspace-id');
    $('#projectWorkspaceInput').val(selectedWorkspaceId);
    loadProjectsForWorkspace(selectedWorkspaceId);
  });

  $(document).on('click', '.project-card', function () {
    window.location.href = `workspace.html?projectId=${encodeURIComponent($(this).data('project-id'))}`;
  });

  $(document).on('click', '.task-card', function () {
    window.location.href = `task.html?taskId=${encodeURIComponent($(this).data('task-id'))}`;
  });

  $(document).on('dragstart', '.task-card', function () {
    draggedTaskId = $(this).data('task-id');
  });

  $('.kanban-column').on('dragover', function (event) {
    event.preventDefault();
    $(this).addClass('drag-over');
  });

  $('.kanban-column').on('dragleave', function () {
    $(this).removeClass('drag-over');
  });

  $('.kanban-column').on('drop', function () {
    const newStatus = $(this).data('status');
    $(this).removeClass('drag-over');

    if (draggedTaskId && newStatus) {
      updateTaskStatus(draggedTaskId, newStatus);
    }
  });
});