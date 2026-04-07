import toast from 'react-hot-toast';

/**
 * Handle API errors and show appropriate messages
 * @param {Error} error - The error object from axios
 * @param {string} defaultMessage - Default message to show if no other message available
 * @param {boolean} showToast - Whether to show a toast notification
 * @returns {string} - Error message
 */
export const handleError = (error, defaultMessage = 'An error occurred', showToast = true) => {
  let message = defaultMessage;
  let statusCode = null;

  if (error.response?.data?.message) {
    message = error.response.data.message;
    statusCode = error.response.status;
  } else if (error.message) {
    if (error.code === 'ECONNABORTED') {
      message = 'Request timeout. Please try again.';
    } else if (error.message === 'Network Error') {
      message = 'Network error. Check your connection.';
    } else {
      message = error.message;
    }
  }

  if (showToast) {
    toast.error(message);
  }

  console.error('API Error:', { statusCode, message, error });
  return message;
};

/**
 * Handle success responses and show notifications
 * @param {string} message - Success message
 * @param {boolean} showToast - Whether to show a toast notification
 */
export const handleSuccess = (message = 'Success!', showToast = true) => {
  if (showToast) {
    toast.success(message);
  }
  console.log('Success:', message);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{ isValid: boolean, strength: 'weak' | 'medium' | 'strong', message: string }}
 */
export const validatePassword = (password) => {
  if (password.length < 8) {
    return { isValid: false, strength: 'weak', message: 'Password must be at least 8 characters' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  const strength = strengthScore <= 2 ? 'weak' : strengthScore === 3 ? 'medium' : 'strong';

  return {
    isValid: strengthScore >= 2,
    strength,
    message: strengthScore >= 2 ? `Password strength: ${strength}` : 'Password is too weak'
  };
};

/**
 * Format date to readable format
 * @param {string | Date} date - Date to format
 * @returns {string}
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string | Date} date - Date to format
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
export const throttle = (func, delay = 300) => {
  let lastRun = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastRun >= delay) {
      func(...args);
      lastRun = now;
    }
  };
};

export default {
  handleError,
  handleSuccess,
  isValidEmail,
  validatePassword,
  formatDate,
  formatRelativeTime,
  debounce,
  throttle
};
