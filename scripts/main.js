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
    btn.addEventListener('click', (e) => {
      const page = e.target.dataset.page;
      ui.showPage(page);
    });
  });
}

function setupForm() {
  const form = document.getElementById('task-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ui.clearFieldErrors();

    const formData = {
      title: document.getElementById('task-title').value,
      date: document.getElementById('task-date').value,
      duration: document.getElementById('task-duration').value,
      tag: document.getElementById('task-tag').value,
      notes: document.getElementById('task-notes').value
    };

    const validation = validators.validateAll(formData);

    if (!validation.valid) {
      Object.entries(validation.errors).forEach(([field, message]) => {
        ui.showFieldError(field, message);
      });

      ui.announceToScreenReader('Form has errors. Please check the fields.', 'assertive');
      return;
    }

    try {
      const taskId = document.getElementById('task-id').value;

      if (taskId) {
        state.updateTask(taskId, formData);
        ui.showFormStatus('Task updated successfully!', 'success');
        ui.announceToScreenReader('Task updated successfully');
      } else {
        state.addTask(formData);
        ui.showFormStatus('Task added successfully!', 'success');
        ui.announceToScreenReader('Task added successfully');
      }

      ui.resetForm();

      setTimeout(() => {
        ui.showPage('tasks');
      }, 1000);
    } catch (error) {
      ui.showFormStatus('Error saving task. Please try again.', 'error');
      ui.announceToScreenReader('Error saving task', 'assertive');
    }
  });

  document.getElementById('cancel-edit').addEventListener('click', () => {
    ui.resetForm();
    ui.showPage('tasks');
  });

  ['task-title', 'task-date', 'task-duration', 'task-tag'].forEach(fieldId => {
    const input = document.getElementById(fieldId);
    input.addEventListener('input', () => {
      const field = fieldId.replace('task-', '');
      const errorDiv = document.getElementById(`${field}-error`);
      if (errorDiv && errorDiv.textContent) {
        input.classList.remove('error');
        input.removeAttribute('aria-invalid');
        errorDiv.textContent = '';
      }
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchCase = document.getElementById('search-case');

  let searchTimeout;

  const performSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const pattern = searchInput.value.trim();
      const caseSensitive = searchCase.checked;

      if (!pattern) {
        state.filterTasks('');
        ui.showSearchStatus('');
        ui.renderTasks();
        return;
      }

      const testResult = testRegexPattern(pattern, caseSensitive);

      if (!testResult.valid) {
        ui.showSearchStatus(`Invalid regex: ${testResult.error}`, 'error');
        return;
      }

      const result = state.filterTasks(pattern, caseSensitive);

      if (result.success) {
        state.sortTasks(state.sortBy);
        ui.renderTasks();
        ui.showSearchStatus(`Found ${result.count} task${result.count !== 1 ? 's' : ''}`, 'success');
        ui.announceToScreenReader(`Found ${result.count} tasks`);
      } else {
        ui.showSearchStatus(`Search error: ${result.error}`, 'error');
      }
    }, 300);
  };

  searchInput.addEventListener('input', performSearch);
  searchCase.addEventListener('change', performSearch);
}

function setupSort() {
  const sortSelect = document.getElementById('sort-select');

  sortSelect.addEventListener('change', (e) => {
    state.sortTasks(e.target.value);
    ui.renderTasks();
  });
}

function setupSettings() {
  const timeUnitSelect = document.getElementById('time-unit');
  const weeklyCapInput = document.getElementById('weekly-cap');
  const reduceMotionCheck = document.getElementById('reduce-motion');
  const exportBtn = document.getElementById('export-json');
  const importFile = document.getElementById('import-file');
  const clearBtn = document.getElementById('clear-data');

  timeUnitSelect.addEventListener('change', (e) => {
    state.updateSettings({ timeUnit: e.target.value });
    ui.renderStats();
    ui.renderTasks();
    ui.showSettingsStatus('Settings saved', 'success');
  });

  weeklyCapInput.addEventListener('change', (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= 168) {
      state.updateSettings({ weeklyCap: value });
      ui.renderStats();
      ui.showSettingsStatus('Settings saved', 'success');
    } else {
      ui.showSettingsStatus('Invalid cap value (1-168)', 'error');
      e.target.value = state.settings.weeklyCap;
    }
  });

  reduceMotionCheck.addEventListener('change', (e) => {
    state.updateSettings({ reduceMotion: e.target.checked });
    ui.updateSettingsUI();
    ui.showSettingsStatus('Settings saved', 'success');
  });

  exportBtn.addEventListener('click', () => {
    try {
      const data = state.exportTasks();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campus-planner-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      ui.showSettingsStatus('Data exported successfully', 'success');
      ui.announceToScreenReader('Data exported successfully');
    } catch (error) {
      ui.showSettingsStatus('Export failed', 'error');
      ui.announceToScreenReader('Export failed', 'assertive');
    }
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const validation = validateImportData(data);

        if (!validation.valid) {
          ui.showSettingsStatus(`Import failed: ${validation.message}`, 'error');
          ui.announceToScreenReader('Import failed', 'assertive');
          return;
        }

        state.importTasks(data);
        ui.renderTasks();
        ui.renderStats();
        ui.showSettingsStatus(`Imported ${data.length} tasks successfully`, 'success');
        ui.announceToScreenReader(`Imported ${data.length} tasks`);
      } catch (error) {
        ui.showSettingsStatus('Invalid JSON file', 'error');
        ui.announceToScreenReader('Invalid JSON file', 'assertive');
      }

      e.target.value = '';
    };

    reader.readAsText(file);
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      state.clearAllData();
      ui.renderTasks();
      ui.renderStats();
      ui.showSettingsStatus('All data cleared', 'success');
      ui.announceToScreenReader('All data cleared');
    }
  });
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