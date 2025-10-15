export const validators = {
  title: {
    pattern: /^\S(?:.*\S)?$/,
    message: 'Title cannot have leading or trailing spaces, and must not be empty',

    validate(value) {
      if (!value || !value.trim()) {
        return { valid: false, message: 'Title is required' };
      }

      if (!/^\S(?:.*\S)?$/.test(value)) {
        return { valid: false, message: this.message };
      }

      if (/\s{2,}/.test(value)) {
        return { valid: false, message: 'Title cannot contain consecutive spaces' };
      }

      return { valid: true, message: '' };
    }
  },

  date: {
    pattern: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    message: 'Date must be in YYYY-MM-DD format',

    validate(value) {
      if (!value || !value.trim()) {
        return { valid: false, message: 'Date is required' };
      }

      if (!this.pattern.test(value)) {
        return { valid: false, message: this.message };
      }

      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { valid: false, message: 'Invalid date' };
      }

      const [year, month, day] = value.split('-').map(Number);
      if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
        return { valid: false, message: 'Invalid date (e.g., February 30th)' };
      }

      return { valid: true, message: '' };
    }
  },

  duration: {
    pattern: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    message: 'Duration must be a positive number with up to 2 decimal places',

    validate(value) {
      if (!value || !value.toString().trim()) {
        return { valid: false, message: 'Duration is required' };
      }

      if (!this.pattern.test(value)) {
        return { valid: false, message: this.message };
      }

      const num = parseFloat(value);
      if (num < 0) {
        return { valid: false, message: 'Duration must be positive' };
      }

      if (num > 1440) {
        return { valid: false, message: 'Duration cannot exceed 1440 minutes (24 hours)' };
      }

      return { valid: true, message: '' };
    }
  },

  tag: {
    pattern: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
    message: 'Tag can only contain letters, spaces, and hyphens',

    validate(value) {
      if (!value || !value.trim()) {
        return { valid: false, message: 'Tag is required' };
      }

      if (!this.pattern.test(value)) {
        return { valid: false, message: this.message };
      }

      if (value.length > 30) {
        return { valid: false, message: 'Tag cannot exceed 30 characters' };
      }

      return { valid: true, message: '' };
    }
  },

  duplicateWords: {
    pattern: /\b(\w+)\s+\1\b/i,
    message: 'Detected duplicate consecutive words',

    validate(value) {
      if (!value) {
        return { valid: true, message: '' };
      }

      const match = this.pattern.exec(value);
      if (match) {
        return {
          valid: false,
          message: `Duplicate word detected: "${match[1]}"`
        };
      }

      return { valid: true, message: '' };
    }
  },

  validateAll(data) {
    const errors = {};

    const titleResult = this.title.validate(data.title);
    if (!titleResult.valid) {
      errors.title = titleResult.message;
    } else {
      const dupResult = this.duplicateWords.validate(data.title);
      if (!dupResult.valid) {
        errors.title = dupResult.message;
      }
    }

    const dateResult = this.date.validate(data.date);
    if (!dateResult.valid) {
      errors.date = dateResult.message;
    }

    const durationResult = this.duration.validate(data.duration);
    if (!durationResult.valid) {
      errors.duration = durationResult.message;
    }

    const tagResult = this.tag.validate(data.tag);
    if (!tagResult.valid) {
      errors.tag = tagResult.message;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export function validateImportData(data) {
  if (!Array.isArray(data)) {
    return { valid: false, message: 'Data must be an array' };
  }

  for (let i = 0; i < data.length; i++) {
    const task = data[i];

    if (!task.id || typeof task.id !== 'string') {
      return { valid: false, message: `Task at index ${i} is missing valid id` };
    }

    if (!task.title || typeof task.title !== 'string') {
      return { valid: false, message: `Task at index ${i} is missing valid title` };
    }

    if (!task.dueDate || typeof task.dueDate !== 'string') {
      return { valid: false, message: `Task at index ${i} is missing valid dueDate` };
    }

    if (typeof task.duration !== 'number' || task.duration < 0) {
      return { valid: false, message: `Task at index ${i} has invalid duration` };
    }

    if (!task.tag || typeof task.tag !== 'string') {
      return { valid: false, message: `Task at index ${i} is missing valid tag` };
    }

    if (!task.createdAt || !task.updatedAt) {
      return { valid: false, message: `Task at index ${i} is missing timestamps` };
    }
  }

  return { valid: true, message: 'Data is valid' };
}
