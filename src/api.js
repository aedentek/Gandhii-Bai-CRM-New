// API base URL - adjust according to your server configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Generic API call function
async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Staff API functions
export const staffAPI = {
  // Get all staff
  getAll: () => apiCall('/staff'),
  
  // Get staff by ID
  getById: (id) => apiCall(`/staff/${id}`),
  
  // Create new staff
  create: (staffData) => apiCall('/staff', {
    method: 'POST',
    body: JSON.stringify(staffData),
  }),
  
  // Update staff
  update: (id, staffData) => apiCall(`/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(staffData),
  }),
  
  // Delete staff (soft delete)
  delete: (id, deletedBy = 'System') => apiCall(`/staff/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ deletedBy }),
  }),
  
  // Restore deleted staff
  restore: (id) => apiCall(`/staff/${id}/restore`, {
    method: 'PUT',
  }),
  
  // Get deleted staff
  getDeleted: () => apiCall('/staff/deleted'),
  
  // Salary payment specific endpoints
  salary: {
    // Update staff salary payment
    updatePayment: (id, paymentData) => apiCall(`/staff/${id}/salary-payment`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    }),
    
    // Get salary summary for all staff
    getSummary: () => apiCall('/staff/salary-summary'),
  }
};

// Staff Categories API functions
export const staffCategoriesAPI = {
  getAll: () => apiCall('/staff-categories'),
  getById: (id) => apiCall(`/staff-categories/${id}`),
  create: (categoryData) => apiCall('/staff-categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  }),
  update: (id, categoryData) => apiCall(`/staff-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  }),
  delete: (id) => apiCall(`/staff-categories/${id}`, {
    method: 'DELETE',
  }),
};

// Export default API object
export default {
  staff: staffAPI,
  staffCategories: staffCategoriesAPI,
};
