import { highlightMatches, escapeHtml } from './search.js';

export class UI {
  constructor(state) {
    this.state = state;
  }

  renderTasks() {
    const tbody = document.getElementById('tasks-tbody');
    const mobileCards = document.getElementById('mobile-cards');

    if (this.state.filteredTasks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No tasks found. Try adjusting your search or add a new task!</td></tr>';
      mobileCards.innerHTML = '<p class="empty-state" style="text-align: center; padding: 2rem;">No tasks found. Try adjusting your search or add a new task!</p>';
      return;
    }

    tbody.innerHTML = '';
    mobileCards.innerHTML = '';

    this.state.filteredTasks.forEach(task => {
      const tr = document.createElement('tr');

      const titleContent = this.state.searchPattern
        ? highlightMatches(task.title, this.state.searchPattern)
        : escapeHtml(task.title);

      const tagContent = this.state.searchPattern
        ? highlightMatches(task.tag, this.state.searchPattern)
        : escapeHtml(task.tag);

      const durationText = this.formatDuration(task.duration);

      tr.innerHTML = `
        <td>${titleContent}</td>
        <td>${task.dueDate}</td>
        <td>${durationText}</td>
        <td>${tagContent}</td>
        <td>
          <div class="action-buttons">
            <button type="button" class="btn-icon edit" data-id="${task.id}" aria-label="Edit ${escapeHtml(task.title)}">
              Edit
            </button>
            <button type="button" class="btn-icon delete" data-id="${task.id}" aria-label="Delete ${escapeHtml(task.title)}">
              Delete
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);

      const card = document.createElement('div');
      card.className = 'task-card';
      card.innerHTML = `
        <div class="task-card-header">
          <h3 class="task-card-title">${titleContent}</h3>
        </div>
        <div class="task-card-body">
          <div class="task-card-row">
            <span class="task-card-label">Due Date:</span>
            <span class="task-card-value">${task.dueDate}</span>
          </div>
          <div class="task-card-row">
            <span class="task-card-label">Duration:</span>
            <span class="task-card-value">${durationText}</span>
          </div>
          <div class="task-card-row">
            <span class="task-card-label">Tag:</span>
            <span class="task-card-value">${tagContent}</span>
          </div>
        </div>
        <div class="action-buttons">
          <button type="button" class="btn-icon edit" data-id="${task.id}" aria-label="Edit ${escapeHtml(task.title)}">
            Edit
          </button>
          <button type="button" class="btn-icon delete" data-id="${task.id}" aria-label="Delete ${escapeHtml(task.title)}">
            Delete
          </button>
        </div>
      `;

      mobileCards.appendChild(card);
    });
  }

  formatDuration(minutes) {
    if (this.state.settings.timeUnit === 'hours') {
      const hours = minutes / 60;
      return `${hours.toFixed(2)} hrs`;
    }
    return `${minutes} min`;
  }

  renderStats() {
    const stats = this.state.getStats();

    document.getElementById('stat-total').textContent = stats.totalTasks;
    document.getElementById('stat-hours').textContent = stats.totalHours;
    document.getElementById('stat-tag').textContent = stats.topTag;
    document.getElementById('stat-recent').textContent = stats.recentTasks;

    const capBar = document.getElementById('cap-bar');
    const capCurrent = document.getElementById('cap-current');
    const capTarget = document.getElementById('cap-target');
    const capMessage = document.getElementById('cap-message');

    capBar.style.width = `${stats.capPercentage}%`;
    capBar.setAttribute('aria-valuenow', Math.round(stats.capPercentage));

    capCurrent.textContent = stats.weeklyHours;
    capTarget.textContent = stats.capTarget;

    const remaining = stats.capTarget - parseFloat(stats.weeklyHours);

    if (remaining > 0) {
      capMessage.textContent = `You have ${remaining.toFixed(1)} hours remaining this week.`;
      capMessage.className = 'cap-message under';
    } else {
      capMessage.textContent = `You are ${Math.abs(remaining).toFixed(1)} hours over your weekly cap!`;
      capMessage.className = 'cap-message over';
      capMessage.setAttribute('aria-live', 'assertive');
    }

    this.renderActivityChart();
  }

  renderActivityChart() {
    const chartContainer = document.getElementById('activity-chart');
    const activityData = this.state.getActivityData();

    const maxCount = Math.max(...activityData.map(d => d.count), 1);

    chartContainer.innerHTML = activityData.map(({ day, count }) => {
      const height = (count / maxCount) * 100;
      return `<div class="chart-bar" style="height: ${height}%" data-label="${day}" title="${day}: ${count} tasks"></div>`;
    }).join('');
  }

  showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const page = document.getElementById(`page-${pageName}`);
    if (page) {
      page.classList.add('active');
    }

    const navBtn = document.querySelector(`.nav-btn[data-page="${pageName}"]`);
    if (navBtn) {
      navBtn.classList.add('active');
    }

    this.state.currentPage = pageName;

    if (pageName === 'dashboard') {
      this.renderStats();
    } else if (pageName === 'tasks') {
      this.renderTasks();
    }

    const heading = page?.querySelector('h2');
    if (heading) {
      heading.focus();
    }
  }

  populateForm(task) {
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-date').value = task.dueDate;
    document.getElementById('task-duration').value = task.duration;
    document.getElementById('task-tag').value = task.tag;
    document.getElementById('task-notes').value = task.notes || '';

    document.getElementById('form-submit-text').textContent = 'Update Task';
    document.getElementById('add-heading').textContent = 'Edit Task';

    this.state.editingTaskId = task.id;
  }

  resetForm() {
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('form-submit-text').textContent = 'Add Task';
    document.getElementById('add-heading').textContent = 'Add Task';

    this.clearFieldErrors();

    this.state.editingTaskId = null;
  }

  showFieldError(fieldName, message) {
    const input = document.getElementById(`task-${fieldName}`);
    const errorDiv = document.getElementById(`${fieldName}-error`);

    if (input) {
      input.classList.add('error');
      input.setAttribute('aria-invalid', 'true');
    }

    if (errorDiv) {
      errorDiv.textContent = message;
    }
  }

  clearFieldErrors() {
    ['title', 'date', 'duration', 'tag'].forEach(field => {
      const input = document.getElementById(`task-${field}`);
      const errorDiv = document.getElementById(`${field}-error`);

      if (input) {
        input.classList.remove('error');
        input.removeAttribute('aria-invalid');
      }

      if (errorDiv) {
        errorDiv.textContent = '';
      }
    });
  }

  showFormStatus(message, type = 'success') {
    const statusDiv = document.getElementById('form-status');
    statusDiv.textContent = message;
    statusDiv.className = `form-status ${type}`;

    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'form-status';
    }, 3000);
  }

  showSearchStatus(message, type = 'success') {
    const statusDiv = document.getElementById('search-status');
    statusDiv.textContent = message;
    statusDiv.className = `search-status ${type}`;
  }

  showSettingsStatus(message, type = 'success') {
    const statusDiv = document.getElementById('settings-status');
    statusDiv.textContent = message;
    statusDiv.className = `settings-status ${type}`;

    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'settings-status';
    }, 3000);
  }

  announceToScreenReader(message, priority = 'polite') {
    const alertRegion = document.getElementById('alert-region');
    alertRegion.textContent = message;

    if (priority === 'assertive') {
      alertRegion.setAttribute('aria-live', 'assertive');
    } else {
      alertRegion.setAttribute('aria-live', 'polite');
    }

    setTimeout(() => {
      alertRegion.textContent = '';
    }, 2000);
  }

  updateSettingsUI() {
    document.getElementById('time-unit').value = this.state.settings.timeUnit;
    document.getElementById('weekly-cap').value = this.state.settings.weeklyCap;
    document.getElementById('reduce-motion').checked = this.state.settings.reduceMotion;

    if (this.state.settings.reduceMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
  }
}
