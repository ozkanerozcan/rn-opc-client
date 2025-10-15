import Toast from 'react-native-toast-message';

/**
 * Show a toast notification
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 */
export const showToast = (type, title, message = '') => {
  Toast.show({
    type: type,
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 5000,
    autoHide: true,
    topOffset: 50,
  });
};

export const showSuccess = (title, message = '') => {
  showToast('success', title, message);
};

export const showError = (title, message = '') => {
  showToast('error', title, message);
};

export const showInfo = (title, message = '') => {
  showToast('info', title, message);
};

export const showWarning = (title, message = '') => {
  Toast.show({
    type: 'error', // Use error type for warnings with orange/red color
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 8000, // Show longer for warnings
    autoHide: true,
    topOffset: 50,
  });
};
