import { State } from './state.js';
import { UI } from './ui.js';
import { validators, validateImportData } from './validators.js';
import { testRegexPattern } from './search.js';

const state = new State();
const ui = new UI(state);

function init() {
  setupNavigation();
  setupForm();
  setupSearch();
  setupSort();
  setupSettings();
  setupTaskActions();
  setupKeyboardShortcuts();

  ui.updateSettingsUI();
  ui.showPage('dashboard');
}

function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ui.showPage(btn.dataset.page);
    });
  });
}

function setupForm() {
  const form = document.getElementById('task-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ui.handleFormSubmit();
  });
  const cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => ui.cancelEdit());
  }
  ['task-title', 'task-date', 'task-duration', 'task-tag'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', () => ui.validateField(fieldId));
    }
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchCase = document.getElementById('search-case');
  let searchTimeout;
  const performSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => ui.performSearch(), 200);
  };
  if (searchInput) searchInput.addEventListener('input', performSearch);
  if (searchCase) searchCase.addEventListener('change', performSearch);
}

function setupSort() {
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => ui.sortTasks(e.target.value));
  }
}

function setupSettings() {
  const timeUnitSelect = document.getElementById('time-unit');
  const weeklyCapInput = document.getElementById('weekly-cap');
  if (timeUnitSelect) {
    timeUnitSelect.addEventListener('change', () => ui.updateTimeUnit(timeUnitSelect.value));
  }
  if (weeklyCapInput) {
    weeklyCapInput.addEventListener('input', () => ui.updateWeeklyCap(weeklyCapInput.value));
  }
}

function setupTaskActions() {
  document.getElementById('tasks-tbody').addEventListener('click', handleTaskAction);
  document.getElementById('mobile-cards').addEventListener('click', handleTaskAction);

  function handleTaskAction(e) {
    if (e.target.classList.contains('edit')) {
      const taskId = e.target.dataset.id;
      const task = state.getTask(taskId);
      if (task) {
        ui.populateForm(task);
        ui.showPage('add');
      }
    }

    if (e.target.classList.contains('delete')) {
      const taskId = e.target.dataset.id;
      const task = state.getTask(taskId);

      if (task && confirm(`Are you sure you want to delete "${task.title}"?`)) {
        state.deleteTask(taskId);
        ui.renderTasks();
        ui.renderStats();
        ui.announceToScreenReader('Task deleted');
      }
    }
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.editingTaskId) {
      ui.resetForm();
      ui.showPage('tasks');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}