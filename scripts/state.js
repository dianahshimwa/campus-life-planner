import { storage } from './storage.js';

export class State {
  constructor() {
    this.tasks = storage.getTasks();
    this.settings = storage.getSettings();
    this.currentPage = 'dashboard';
    this.editingTaskId = null;
    this.filteredTasks = [...this.tasks];
    this.searchPattern = null;
    this.sortBy = 'date-desc';
  }

  generateId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `task_${timestamp}_${random}`;
  }

  addTask(taskData) {
    const now = new Date().toISOString();
    const task = {
      id: this.generateId(),
      title: taskData.title.trim(),
      dueDate: taskData.date,
      duration: parseFloat(taskData.duration),
      tag: taskData.tag.trim().toLowerCase(),
      notes: taskData.notes ? taskData.notes.trim() : '',
      createdAt: now,
      updatedAt: now
    };

    this.tasks.push(task);
    this.filteredTasks = [...this.tasks];
    this.save();
    return task;
  }

  updateTask(id, taskData) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const task = this.tasks[index];
    task.title = taskData.title.trim();
    task.dueDate = taskData.date;
    task.duration = parseFloat(taskData.duration);
    task.tag = taskData.tag.trim().toLowerCase();
    task.notes = taskData.notes ? taskData.notes.trim() : '';
    task.updatedAt = new Date().toISOString();

    this.filteredTasks = [...this.tasks];
    this.save();
    return task;
  }

  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.tasks.splice(index, 1);
    this.filteredTasks = [...this.tasks];
    this.save();
    return true;
  }

  getTask(id) {
    return this.tasks.find(t => t.id === id);
  }

  sortTasks(sortBy) {
    this.sortBy = sortBy;
    const [field, order] = sortBy.split('-');

    this.filteredTasks.sort((a, b) => {
      let aVal, bVal;

      if (field === 'date') {
        aVal = new Date(a.dueDate).getTime();
        bVal = new Date(b.dueDate).getTime();
      } else if (field === 'title') {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else if (field === 'duration') {
        aVal = a.duration;
        bVal = b.duration;
      }

      if (order === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }

  filterTasks(pattern, caseSensitive = false) {
    if (!pattern) {
      this.filteredTasks = [...this.tasks];
      this.searchPattern = null;
      return { success: true, count: this.tasks.length };
    }

    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      this.searchPattern = regex;

      this.filteredTasks = this.tasks.filter(task => {
        return regex.test(task.title) ||
               regex.test(task.tag) ||
               regex.test(task.notes) ||
               regex.test(task.dueDate);
      });

      return { success: true, count: this.filteredTasks.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getStats() {
    const totalTasks = this.tasks.length;
    const totalMinutes = this.tasks.reduce((sum, task) => sum + task.duration, 0);
    const totalHours = totalMinutes / 60;

    const tagCounts = {};
    this.tasks.forEach(task => {
      tagCounts[task.tag] = (tagCounts[task.tag] || 0) + 1;
    });

    const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTasks = this.tasks.filter(task =>
      new Date(task.dueDate) >= sevenDaysAgo
    ).length;

    const weeklyHours = this.getWeeklyHours();
    const capPercentage = (weeklyHours / this.settings.weeklyCap) * 100;

    return {
      totalTasks,
      totalHours: totalHours.toFixed(1),
      topTag: topTag ? topTag[0] : 'None',
      recentTasks,
      weeklyHours: weeklyHours.toFixed(1),
      capPercentage: Math.min(capPercentage, 100),
      capTarget: this.settings.weeklyCap
    };
  }

  getWeeklyHours() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weeklyMinutes = this.tasks
      .filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= weekStart && dueDate < weekEnd;
      })
      .reduce((sum, task) => sum + task.duration, 0);

    return weeklyMinutes / 60;
  }

  getActivityData() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.tasks.forEach(task => {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((taskDate - today) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < 7) {
        const dayIndex = (today.getDay() + diffDays) % 7;
        counts[dayIndex]++;
      }
    });

    return days.map((day, i) => ({ day, count: counts[i] }));
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    storage.saveSettings(this.settings);
  }

  importTasks(tasks) {
    this.tasks = tasks;
    this.filteredTasks = [...this.tasks];
    this.save();
  }

  exportTasks() {
    return JSON.stringify(this.tasks, null, 2);
  }

  clearAllData() {
    this.tasks = [];
    this.filteredTasks = [];
    this.settings = {
      timeUnit: 'minutes',
      weeklyCap: 40,
      reduceMotion: false
    };
    storage.clearAll();
  }

  save() {
    storage.saveTasks(this.tasks);
  }
}