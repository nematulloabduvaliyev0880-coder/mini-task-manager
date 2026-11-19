/* ============================================================
   TaskFlow — Mini Task Manager
   Vanilla JavaScript · LocalStorage powered
   ============================================================ */

'use strict';

/* ---------- Constants ---------- */
const KEYS = {
  tasks: 'taskflow.tasks.v1',
  settings: 'taskflow.settings.v1',
};

const CATEGORIES = ['Personal', 'Work', 'Study', 'Shopping', 'Other'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const CATEGORY_ICONS = {
  Personal: 'fa-user',
  Work: 'fa-briefcase',
  Study: 'fa-book-open',
  Shopping: 'fa-basket-shopping',
  Other: 'fa-ellipsis',
};

const VIEW_META = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Here is what is happening with your tasks today.',
    board: 'All Tasks',
    emptyTitle: 'No tasks yet',
    emptyText: 'Add your first task above and start being productive.',
  },
  tasks: {
    title: 'My Tasks',
    subtitle: 'Every task you have created, all in one place.',
    board: 'My Tasks',
    emptyTitle: 'No tasks found',
    emptyText: 'Try changing your filters or add a brand new task.',
  },
  completed: {
    title: 'Completed',
    subtitle: 'A look back at everything you have accomplished.',
    board: 'Completed Tasks',
    emptyTitle: 'Nothing completed yet',
    emptyText: 'Mark a task as done and it will show up here.',
  },
  important: {
    title: 'Important',
    subtitle: 'Your high priority tasks deserve attention first.',
    board: 'Important Tasks',
    emptyTitle: 'No important tasks',
    emptyText: 'Set a task priority to High to pin it here.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Personalize your workspace and manage your data.',
    board: '',
    emptyTitle: '',
    emptyText: '',
  },
};

/* ---------- State ---------- */
const defaultSettings = () => ({
  theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  defaultCategory: 'Personal',
  defaultPriority: 'Medium',
  sort: 'newest',
});

const state = {
  tasks: [],
  settings: defaultSettings(),
  view: 'dashboard',
  status: 'all',
  category: 'all',
  priority: 'all',
  search: '',
  editingId: null,
  confirmAction: null,
};

/* ---------- DOM helpers ---------- */
const $ = (id) => document.getElementById(id);
const el = {
  html: document.documentElement,
  sidebar: $('sidebar'),
  sidebarOverlay: $('sidebarOverlay'),
  menuBtn: $('menuBtn'),
  sidebarClose: $('sidebarClose'),
  sideNav: $('sideNav'),
  pageTitle: $('pageTitle'),
  pageSubtitle: $('pageSubtitle'),
  searchInput: $('searchInput'),
  clearSearch: $('clearSearch'),
  themeBtn: $('themeBtn'),
  themeIcon: $('themeIcon'),
  sideThemeBtn: $('sideThemeBtn'),
  sideThemeIcon: $('sideThemeIcon'),
  sideThemeText: $('sideThemeText'),
  greetingWord: $('greetingWord'),
  welcomeSection: $('welcomeSection'),
  statsSection: $('statsSection'),
  progressSection: $('progressSection'),
  composerSection: $('composerSection'),
  boardSection: $('boardSection'),
  settingsSection: $('settingsSection'),
  taskForm: $('taskForm'),
  taskTitle: $('taskTitle'),
  taskDescription: $('taskDescription'),
  taskCategory: $('taskCategory'),
  taskPriority: $('taskPriority'),
  taskDeadline: $('taskDeadline'),
  formError: $('formError'),
  statTotal: $('statTotal'),
  statCompleted: $('statCompleted'),
  statPending: $('statPending'),
  statPercent: $('statPercent'),
  donut: $('donut'),
  donutPercent: $('donutPercent'),
  progressFill: $('progressFill'),
  progressLabel: $('progressLabel'),
  legendCompleted: $('legendCompleted'),
  legendPending: $('legendPending'),
  boardTitle: $('boardTitle'),
  boardCount: $('boardCount'),
  boardSubtitle: $('boardSubtitle'),
  statusTabs: $('statusTabs'),
  categoryFilter: $('categoryFilter'),
  priorityFilter: $('priorityFilter'),
  sortSelect: $('sortSelect'),
  taskList: $('taskList'),
  emptyState: $('emptyState'),
  emptyTitle: $('emptyTitle'),
  emptyText: $('emptyText'),
  emptyAction: $('emptyAction'),
  clearAllBtn: $('clearAllBtn'),
  navCountTasks: $('navCountTasks'),
  navCountCompleted: $('navCountCompleted'),
  navCountImportant: $('navCountImportant'),
  editModal: $('editModal'),
  editForm: $('editForm'),
  editTitle: $('editTitle'),
  editDescription: $('editDescription'),
  editCategory: $('editCategory'),
  editPriority: $('editPriority'),
  editDeadline: $('editDeadline'),
  editError: $('editError'),
  editClose: $('editClose'),
  editCancel: $('editCancel'),
  confirmModal: $('confirmModal'),
  confirmTitle: $('confirmTitle'),
  confirmText: $('confirmText'),
  confirmOk: $('confirmOk'),
  confirmCancel: $('confirmCancel'),
  toastContainer: $('toastContainer'),
  defaultCategory: $('defaultCategory'),
  defaultPriority: $('defaultPriority'),
  exportBtn: $('exportBtn'),
  importFile: $('importFile'),
  sampleBtn: $('sampleBtn'),
  settingsClearBtn: $('settingsClearBtn'),
  storageInfo: $('storageInfo'),
};

/* ---------- Utility ---------- */
const uid = () => `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function safeParse(raw, fallback) {
  try { return JSON.parse(raw) ?? fallback; } catch { return fallback; }
}

function normalizeTask(task) {
  if (!task || typeof task !== 'object' || !task.title) return null;
  return {
    id: String(task.id || uid()),
    title: String(task.title),
    description: String(task.description || ''),
    category: CATEGORIES.includes(task.category) ? task.category : 'Other',
    priority: PRIORITIES.includes(task.priority) ? task.priority : 'Medium',
    deadline: task.deadline || '',
    completed: Boolean(task.completed),
    createdAt: task.createdAt || new Date().toISOString(),
    completedAt: task.completedAt || null,
  };
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

function formatCreated(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `Added ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)}`;
}

function toInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isOverdue(task) {
  if (!task.deadline || task.completed) return false;
  const date = new Date(task.deadline);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

/* ---------- Persistence ---------- */
function load() {
  const storedTasks = safeParse(localStorage.getItem(KEYS.tasks), []);
  state.tasks = Array.isArray(storedTasks)
    ? storedTasks.map(normalizeTask).filter(Boolean)
    : [];

  const storedSettings = safeParse(localStorage.getItem(KEYS.settings), {});
  state.settings = { ...defaultSettings(), ...(storedSettings || {}) };
  if (!CATEGORIES.includes(state.settings.defaultCategory)) state.settings.defaultCategory = 'Personal';
  if (!PRIORITIES.includes(state.settings.defaultPriority)) state.settings.defaultPriority = 'Medium';
}

function saveTasks() {
  localStorage.setItem(KEYS.tasks, JSON.stringify(state.tasks));
}

function saveSettings() {
  localStorage.setItem(KEYS.settings, JSON.stringify(state.settings));
}

/* ---------- Toast ---------- */
function toast(message, type = 'success') {
  const icons = { success: 'fa-check', info: 'fa-bell', error: 'fa-xmark' };
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.innerHTML = `
    <span class="toast-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></span>
    <span class="toast-msg">${esc(message)}</span>
    <button class="toast-close" type="button" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>`;

  const remove = () => {
    node.classList.add('out');
    setTimeout(() => node.remove(), 300);
  };
  node.querySelector('.toast-close').addEventListener('click', remove);
  el.toastContainer.appendChild(node);
  setTimeout(remove, 3200);
}

/* ---------- Confirm dialog ---------- */
function askConfirm({ title, text, okText = 'Yes, delete', onConfirm }) {
  el.confirmTitle.textContent = title;
  el.confirmText.textContent = text;
  el.confirmOk.textContent = okText;
  state.confirmAction = onConfirm;
  el.confirmModal.hidden = false;
  el.confirmOk.focus();
}

function closeConfirm() {
  el.confirmModal.hidden = true;
  state.confirmAction = null;
}

/* ---------- View switching ---------- */
function setView(view) {
  if (!VIEW_META[view]) return;
  state.view = view;
  state.search = '';
  el.searchInput.value = '';
  el.clearSearch.hidden = true;

  if (view === 'completed') { state.status = 'completed'; state.priority = 'all'; }
  else if (view === 'important') { state.status = 'all'; state.priority = 'High'; }
  else { state.status = 'all'; state.priority = 'all'; }
  state.category = 'all';

  const meta = VIEW_META[view];
  el.pageTitle.textContent = meta.title;
  el.pageSubtitle.textContent = meta.subtitle;
  el.boardTitle.textContent = meta.board;
  el.boardSubtitle.textContent = view === 'important'
    ? 'Tasks flagged as High priority.'
    : view === 'completed'
      ? 'Tasks you have successfully finished.'
      : 'Manage and organize your tasks in one place.';

  el.welcomeSection.hidden = view !== 'dashboard';
  el.statsSection.hidden = view !== 'dashboard';
  el.progressSection.hidden = view !== 'dashboard';
  el.composerSection.hidden = view === 'completed' || view === 'important' || view === 'settings';
  el.boardSection.hidden = view === 'settings';
  el.settingsSection.hidden = view !== 'settings';

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  closeSidebar();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeSidebar() {
  el.sidebar.classList.remove('open');
  el.sidebarOverlay.classList.remove('show');
}

/* ---------- Theme ---------- */
function applyTheme(theme) {
  const isDark = theme === 'dark';
  el.html.dataset.theme = isDark ? 'dark' : 'light';
  el.themeIcon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  el.sideThemeIcon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  el.sideThemeText.textContent = isDark ? 'Light mode' : 'Dark mode';
  el.themeBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  document.querySelectorAll('.theme-option').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.themeChoice === theme);
  });
}

function toggleTheme() {
  state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.settings.theme);
  saveSettings();
  toast(`${state.settings.theme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'info');
}

/* ---------- Filtering & sorting ---------- */
function getVisibleTasks() {
  let tasks = state.tasks.slice();

  if (state.view === 'completed') tasks = tasks.filter((t) => t.completed);
  if (state.view === 'important') tasks = tasks.filter((t) => t.priority === 'High');
  if (state.status === 'active') tasks = tasks.filter((t) => !t.completed);
  if (state.status === 'completed') tasks = tasks.filter((t) => t.completed);
  if (state.category !== 'all') tasks = tasks.filter((t) => t.category === state.category);
  if (state.priority !== 'all') tasks = tasks.filter((t) => t.priority === state.priority);

  const query = state.search.trim().toLowerCase();
  if (query) {
    tasks = tasks.filter((t) =>
      `${t.title} ${t.description} ${t.category} ${t.priority}`.toLowerCase().includes(query));
  }

  const rank = { High: 0, Medium: 1, Low: 2 };
  switch (state.settings.sort) {
    case 'oldest': tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
    case 'priority': tasks.sort((a, b) => rank[a.priority] - rank[b.priority] || new Date(b.createdAt) - new Date(a.createdAt)); break;
    case 'deadline': tasks.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    }); break;
    case 'az': tasks.sort((a, b) => a.title.localeCompare(b.title)); break;
    default: tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return tasks;
}

/* ---------- Rendering ---------- */
function renderStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  el.statTotal.textContent = total;
  el.statCompleted.textContent = completed;
  el.statPending.textContent = pending;
  el.statPercent.textContent = `${percent}%`;
  el.donutPercent.textContent = `${percent}%`;
  el.progressLabel.textContent = `${percent}%`;
  el.legendCompleted.textContent = completed;
  el.legendPending.textContent = pending;
  el.progressFill.style.width = `${percent}%`;
  el.donut.style.setProperty('--pct', percent);

  el.navCountTasks.textContent = total;
  el.navCountCompleted.textContent = completed;
  el.navCountImportant.textContent = state.tasks.filter((t) => t.priority === 'High' && !t.completed).length;
}

function taskCardHTML(task, index) {
  const overdue = isOverdue(task);
  const deadlineLabel = overdue
    ? `Overdue · ${formatDate(task.deadline)}`
    : formatDate(task.deadline);

  return `
    <article class="task-card ${task.completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}"
             data-id="${esc(task.id)}" style="animation-delay:${Math.min(index * 35, 350)}ms">
      <label class="task-check" title="${task.completed ? 'Mark as active' : 'Mark as completed'}">
        <input type="checkbox" data-action="toggle" data-id="${esc(task.id)}"
               ${task.completed ? 'checked' : ''}
               aria-label="Mark ${esc(task.title)} as ${task.completed ? 'active' : 'completed'}" />
        <i class="fa-solid fa-check" aria-hidden="true"></i>
      </label>
      <div class="task-body">
        <div class="task-title">${esc(task.title)}</div>
        ${task.description ? `<div class="task-desc">${esc(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="badge cat-${esc(task.category)}"><i class="fa-solid ${CATEGORY_ICONS[task.category] || 'fa-tag'}"></i>${esc(task.category)}</span>
          <span class="badge pri-${esc(task.priority)}"><i class="fa-solid fa-flag"></i>${esc(task.priority)} priority</span>
          ${task.deadline ? `<span class="badge deadline ${overdue ? 'late' : ''}"><i class="fa-regular fa-clock"></i>${esc(deadlineLabel)}</span>` : ''}
          <span class="badge created"><i class="fa-regular fa-calendar"></i>${esc(formatCreated(task.createdAt))}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn" type="button" data-action="edit" data-id="${esc(task.id)}" aria-label="Edit task" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete" type="button" data-action="delete" data-id="${esc(task.id)}" aria-label="Delete task" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </article>`;
}

function renderTasks() {
  const visible = getVisibleTasks();
  el.taskList.innerHTML = visible.map(taskCardHTML).join('');
  el.boardCount.textContent = visible.length;

  const isEmptyWorkspace = state.tasks.length === 0;
  el.emptyState.hidden = visible.length > 0 || state.view === 'settings';
  el.emptyTitle.textContent = isEmptyWorkspace ? VIEW_META[state.view].emptyTitle : 'No matching tasks';
  el.emptyText.textContent = isEmptyWorkspace
    ? VIEW_META[state.view].emptyText
    : 'No tasks match your current search or filters.';
  el.emptyAction.innerHTML = isEmptyWorkspace
    ? '<i class="fa-solid fa-plus"></i> Add a task'
    : '<i class="fa-solid fa-rotate-right"></i> Clear filters';
  el.emptyAction.dataset.mode = isEmptyWorkspace ? 'add' : 'reset';
}

function renderSettings() {
  el.defaultCategory.value = state.settings.defaultCategory;
  el.defaultPriority.value = state.settings.defaultPriority;
  el.sortSelect.value = state.settings.sort;
  el.taskCategory.value = state.settings.defaultCategory;
  el.taskPriority.value = state.settings.defaultPriority;
  document.querySelectorAll('.theme-option').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.themeChoice === state.settings.theme);
  });
  const bytes = new Blob([localStorage.getItem(KEYS.tasks) || '']).size;
  el.storageInfo.textContent = `Storage: ${state.tasks.length} task${state.tasks.length === 1 ? '' : 's'} · ${(bytes / 1024).toFixed(1)} KB saved locally`;
}

function render() {
  updateFilterUI();
  renderStats();
  renderTasks();
  renderSettings();
  applyTheme(state.settings.theme);
  const hour = new Date().getHours();
  el.greetingWord.textContent = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
}

function updateFilterUI() {
  document.querySelectorAll('.status-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.status === state.status);
  });
  el.categoryFilter.value = state.category;
  el.priorityFilter.value = state.priority;
}

/* ---------- CRUD ---------- */
function addTask(event) {
  event.preventDefault();
  const title = el.taskTitle.value.trim();
  if (!title) {
    el.formError.hidden = false;
    el.taskTitle.focus();
    return;
  }
  el.formError.hidden = true;

  const task = normalizeTask({
    id: uid(),
    title,
    description: el.taskDescription.value.trim(),
    category: el.taskCategory.value,
    priority: el.taskPriority.value,
    deadline: el.taskDeadline.value,
    completed: false,
    createdAt: new Date().toISOString(),
  });

  state.tasks.unshift(task);
  saveTasks();
  el.taskForm.reset();
  el.taskCategory.value = state.settings.defaultCategory;
  el.taskPriority.value = state.settings.defaultPriority;
  render();
  toast('Task added successfully');
}

function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : null;
  saveTasks();
  render();
  toast(task.completed ? 'Task marked as completed' : 'Task moved back to active', 'info');
}

function openEdit(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  state.editingId = id;
  el.editTitle.value = task.title;
  el.editDescription.value = task.description;
  el.editCategory.value = task.category;
  el.editPriority.value = task.priority;
  el.editDeadline.value = task.deadline || '';
  el.editError.hidden = true;
  el.editModal.hidden = false;
  el.editTitle.focus();
}

function closeEdit() {
  el.editModal.hidden = true;
  state.editingId = null;
}

function saveEdit(event) {
  event.preventDefault();
  const title = el.editTitle.value.trim();
  if (!title) {
    el.editError.hidden = false;
    el.editTitle.focus();
    return;
  }
  const task = state.tasks.find((t) => t.id === state.editingId);
  if (!task) { closeEdit(); return; }

  Object.assign(task, {
    title,
    description: el.editDescription.value.trim(),
    category: el.editCategory.value,
    priority: el.editPriority.value,
    deadline: el.editDeadline.value,
  });
  saveTasks();
  closeEdit();
  render();
  toast('Task updated successfully');
}

function deleteTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  askConfirm({
    title: 'Delete this task?',
    text: `"${task.title}" will be permanently removed.`,
    onConfirm: () => {
      state.tasks = state.tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
      toast('Task deleted', 'error');
    },
  });
}

function clearAllTasks() {
  if (!state.tasks.length) {
    toast('There are no tasks to clear', 'info');
    return;
  }
  askConfirm({
    title: 'Clear all tasks?',
    text: `All ${state.tasks.length} tasks will be permanently deleted.`,
    okText: 'Yes, clear all',
    onConfirm: () => {
      state.tasks = [];
      saveTasks();
      render();
      toast('All tasks cleared', 'error');
    },
  });
}

/* ---------- Data tools ---------- */
function exportTasks() {
  if (!state.tasks.length) {
    toast('Nothing to export yet', 'info');
    return;
  }
  const payload = JSON.stringify({ app: 'TaskFlow', version: 1, exportedAt: new Date().toISOString(), tasks: state.tasks }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `taskflow-tasks-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Tasks exported as JSON');
}

function importTasks(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = safeParse(reader.result, null);
    const incoming = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.tasks) ? parsed.tasks : null;
    if (!incoming) {
      toast('Invalid file: no tasks found', 'error');
      return;
    }
    const valid = incoming.map(normalizeTask).filter(Boolean);
    if (!valid.length) {
      toast('No valid tasks found in file', 'error');
      return;
    }
    askConfirm({
      title: 'Import tasks?',
      text: `${valid.length} task${valid.length === 1 ? '' : 's'} will replace your current tasks.`,
      okText: 'Yes, import',
      onConfirm: () => {
        state.tasks = valid;
        saveTasks();
        setView('dashboard');
        toast(`${valid.length} task${valid.length === 1 ? '' : 's'} imported`);
      },
    });
  };
  reader.onerror = () => toast('Could not read the file', 'error');
  reader.readAsText(file);
  el.importFile.value = '';
}

function loadSampleTasks() {
  const now = new Date();
  const inDays = (days, hours = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours);
    return toInputValue(d);
  };
  const samples = [
    { title: 'Review weekly project roadmap', description: 'Check milestones and share updates with the team.', category: 'Work', priority: 'High', deadline: inDays(1), completed: false },
    { title: 'Morning workout', description: '30 minutes of cardio and stretching.', category: 'Personal', priority: 'Medium', deadline: inDays(0, 2), completed: true },
    { title: 'Read chapter 4 of Design Systems', description: 'Take notes on component patterns.', category: 'Study', priority: 'Low', deadline: inDays(3), completed: false },
    { title: 'Buy groceries for the week', description: 'Milk, eggs, vegetables, coffee.', category: 'Shopping', priority: 'Medium', deadline: inDays(2), completed: false },
    { title: 'Prepare presentation slides', description: 'Finalize the Q3 performance deck.', category: 'Work', priority: 'High', deadline: inDays(5), completed: false },
    { title: 'Call mom', description: 'Catch up and plan weekend dinner.', category: 'Personal', priority: 'Low', deadline: '', completed: false },
  ].map((task, index) => normalizeTask({
    ...task,
    id: uid() + index,
    createdAt: new Date(now.getTime() - index * 3600000).toISOString(),
    completedAt: task.completed ? new Date().toISOString() : null,
  }));

  askConfirm({
    title: 'Load sample tasks?',
    text: 'Six example tasks will replace your current list.',
    okText: 'Yes, load',
    onConfirm: () => {
      state.tasks = samples;
      saveTasks();
      setView('dashboard');
      toast('Sample tasks loaded');
    },
  });
}

/* ---------- Event wiring ---------- */
function bindEvents() {
  // Navigation
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      setView(btn.dataset.view);
    });
  });

  el.menuBtn.addEventListener('click', () => {
    el.sidebar.classList.add('open');
    el.sidebarOverlay.classList.add('show');
  });
  el.sidebarClose.addEventListener('click', closeSidebar);
  el.sidebarOverlay.addEventListener('click', closeSidebar);

  // Theme
  el.themeBtn.addEventListener('click', toggleTheme);
  el.sideThemeBtn.addEventListener('click', toggleTheme);
  document.querySelectorAll('.theme-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.settings.theme === btn.dataset.themeChoice) return;
      state.settings.theme = btn.dataset.themeChoice;
      saveSettings();
      render();
      toast(`${state.settings.theme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'info');
    });
  });

  // Search
  el.searchInput.addEventListener('input', () => {
    state.search = el.searchInput.value;
    el.clearSearch.hidden = !state.search;
    renderTasks();
  });
  el.clearSearch.addEventListener('click', () => {
    el.searchInput.value = '';
    state.search = '';
    el.clearSearch.hidden = true;
    renderTasks();
    el.searchInput.focus();
  });

  // Form
  el.taskForm.addEventListener('submit', addTask);
  el.taskTitle.addEventListener('input', () => { el.formError.hidden = true; });
  el.taskDeadline.addEventListener('input', () => { el.taskDeadline.classList.remove('invalid'); });

  // Task actions (delegated)
  el.taskList.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'edit') openEdit(id);
    if (action === 'delete') deleteTask(id);
  });

  // Real checkbox inputs are handled through their change event
  el.taskList.addEventListener('change', (event) => {
    const checkbox = event.target.closest('input[data-action="toggle"]');
    if (checkbox) toggleTask(checkbox.dataset.id);
  });

  // Filters
  el.statusTabs.addEventListener('click', (event) => {
    const tab = event.target.closest('.status-tab');
    if (!tab) return;
    state.status = tab.dataset.status;
    updateFilterUI();
    renderTasks();
  });
  el.categoryFilter.addEventListener('change', () => {
    state.category = el.categoryFilter.value;
    renderTasks();
  });
  el.priorityFilter.addEventListener('change', () => {
    state.priority = el.priorityFilter.value;
    renderTasks();
  });
  el.sortSelect.addEventListener('change', () => {
    state.settings.sort = el.sortSelect.value;
    saveSettings();
    renderTasks();
  });

  // Empty state action
  el.emptyAction.addEventListener('click', () => {
    if (el.emptyAction.dataset.mode === 'add') {
      setView('tasks');
      el.taskTitle.focus();
    } else {
      state.search = '';
      el.searchInput.value = '';
      el.clearSearch.hidden = true;
      state.status = 'all';
      state.category = 'all';
      state.priority = state.view === 'important' ? 'High' : 'all';
      if (state.view === 'completed') state.status = 'completed';
      updateFilterUI();
      renderTasks();
      toast('Filters cleared', 'info');
    }
  });

  el.clearAllBtn.addEventListener('click', clearAllTasks);

  // Edit modal
  el.editForm.addEventListener('submit', saveEdit);
  el.editClose.addEventListener('click', closeEdit);
  el.editCancel.addEventListener('click', closeEdit);
  el.editTitle.addEventListener('input', () => { el.editError.hidden = true; });
  el.editModal.addEventListener('click', (event) => {
    if (event.target === el.editModal) closeEdit();
  });

  // Confirm modal
  el.confirmCancel.addEventListener('click', closeConfirm);
  el.confirmOk.addEventListener('click', () => {
    const action = state.confirmAction;
    closeConfirm();
    if (typeof action === 'function') action();
  });
  el.confirmModal.addEventListener('click', (event) => {
    if (event.target === el.confirmModal) closeConfirm();
  });

  // Settings
  el.defaultCategory.addEventListener('change', () => {
    state.settings.defaultCategory = el.defaultCategory.value;
    el.taskCategory.value = el.defaultCategory.value;
    saveSettings();
    toast('Default category saved', 'info');
  });
  el.defaultPriority.addEventListener('change', () => {
    state.settings.defaultPriority = el.defaultPriority.value;
    el.taskPriority.value = el.defaultPriority.value;
    saveSettings();
    toast('Default priority saved', 'info');
  });
  el.exportBtn.addEventListener('click', exportTasks);
  el.importFile.addEventListener('change', () => importTasks(el.importFile.files[0]));
  el.sampleBtn.addEventListener('click', loadSampleTasks);
  el.settingsClearBtn.addEventListener('click', clearAllTasks);

  // Escape keyboard shortcut
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!el.confirmModal.hidden) closeConfirm();
      else if (!el.editModal.hidden) closeEdit();
      else closeSidebar();
    }
  });

  // Keep overdue badges fresh
  setInterval(() => {
    if (state.tasks.some((t) => t.deadline && !t.completed)) renderTasks();
  }, 60000);
}

/* ---------- Init ---------- */
function init() {
  load();
  bindEvents();
  $('footerYear').textContent = `© ${new Date().getFullYear()}`;
  setView('dashboard');
}

init();
