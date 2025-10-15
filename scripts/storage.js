const STORAGE_KEY = 'campusLifePlannerTasks';
const SETTINGS_KEY = 'campusLifePlannerSettings';

export const storage = {
  getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading tasks from storage:', error);
      return [];
    }
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('Error saving tasks to storage:', error);
      return false;
    }
  },

  getSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        timeUnit: 'minutes',
        weeklyCap: 40,
        reduceMotion: false
      };
    } catch (error) {
      console.error('Error reading settings from storage:', error);
      return {
        timeUnit: 'minutes',
        weeklyCap: 40,
        reduceMotion: false
      };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings to storage:', error);
      return false;
    }
  },

  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};
