// Common JavaScript functions

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('token') !== null;
}

// Get token
function getToken() {
  return localStorage.getItem('token');
}

// Get user data
function getUserData() {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
}

// Logout user
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Redirect if not logged in
function redirectIfNotLoggedIn(redirectTo = '/login') {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
  }
}

// Redirect if logged in
function redirectIfLoggedIn(redirectTo = '/dashboard') {
  if (isLoggedIn()) {
    window.location.href = redirectTo;
  }
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Make API request
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `/api${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (isLoggedIn()) {
    options.headers['Authorization'] = `Bearer ${getToken()}`;
  }
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong');
    }
    
    return result;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Show notification
function showNotification(message, type = 'success') {
  // Check if notification container exists
  let notifContainer = document.getElementById('notification-container');
  
  // Create it if it doesn't exist
  if (!notifContainer) {
    notifContainer = document.createElement('div');
    notifContainer.id = 'notification-container';
    notifContainer.style.position = 'fixed';
    notifContainer.style.top = '20px';
    notifContainer.style.right = '20px';
    notifContainer.style.maxWidth = '300px';
    notifContainer.style.zIndex = '9999';
    document.body.appendChild(notifContainer);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
  notification.style.color = type === 'success' ? '#155724' : '#721c24';
  notification.style.padding = '15px 20px';
  notification.style.marginBottom = '10px';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  notification.textContent = message;
  
  // Add notification to container
  notifContainer.appendChild(notification);
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      notifContainer.removeChild(notification);
    }, 500);
  }, 5000);
} 