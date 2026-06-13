const BASE_URL = 'http://localhost:5000/api';

const getHeaders = (isMultipart = false) => {
  const headers = {};
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('doctor_hub_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    // Session expired or unauthorized
    localStorage.removeItem('doctor_hub_token');
    localStorage.removeItem('doctor_hub_user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?expired=true';
    }
  }

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  post: async (endpoint, body, isMultipart = false) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(isMultipart),
      body: isMultipart ? body : JSON.stringify(body)
    });
    return handleResponse(response);
  },

  put: async (endpoint, body) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};
