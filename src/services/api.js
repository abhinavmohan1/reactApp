import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://nationalinstituteoflanguage.in/wp-json/attendance-tracker/v1';
const APP_USERNAME = process.env.REACT_APP_APP_USERNAME || 'admins';
const APP_PASSWORD = process.env.REACT_APP_APP_PASSWORD || '2r6vZ4wvLGz5Y3oxjtz5CVij';

if (!APP_USERNAME || !APP_PASSWORD) {
  console.error('Application Password credentials are not set in environment variables.');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Basic ${btoa(`${APP_USERNAME}:${APP_PASSWORD}`)}`
  }
});

api.interceptors.request.use(request => {
  console.log('Starting Request', JSON.stringify(request, null, 2));
  return request;
}, error => {
  console.error('Request Error:', error);
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  console.log('Response:', JSON.stringify(response.data, null, 2));
  return response;
}, error => {
  if (error.response) {
    console.error('Response Error:', {
      data: error.response.data,
      status: error.response.status,
      headers: error.response.headers,
    });
  } else if (error.request) {
    console.error('Request Error:', error.request);
  } else {
    console.error('Error:', error.message);
  }
  return Promise.reject(error);
});

const handleApiCall = async (apiCall) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

const getAttendanceHistory = async ({ start_date, end_date, room_number, full_name, page, per_page }) => {
  console.log('Fetching attendance history with params:', { start_date, end_date, room_number, full_name, page, per_page });
  try {
    const params = {
      start_date,
      end_date,
      ...(room_number && { room_number }),
      ...(full_name && { full_name }),
      ...(page && { page }),
      ...(per_page && { per_page })
    };
    const response = await api.get('/attendance', { params });
    console.log('Attendance history response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return { total_records: 0, attendance_records: [] };
  }
};

const getDashboardAttendanceData = async () => {
  console.log('Fetching dashboard attendance data');
  try {
    const response = await api.get('/attendance/dashboard');
    console.log('Dashboard attendance data response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard attendance data:', error);
    return { today: 0, last_7_days: 0, last_30_days: 0 };
  }
};

const apiMethods = {
    getDashboardAttendanceData,
    getTrainers: () => handleApiCall(() => api.get('/trainers')),
    searchTrainers: (params) => handleApiCall(() => {
      console.log('Searching trainers with params:', params);
      return api.get('/search/trainers', { params });
    }),
    searchUsers: (params) => handleApiCall(() => {
      console.log('Searching users with params:', params);
      return api.get('/search/users', { params });
    }),
    getCourseHoldRequests: () => handleApiCall(() => {
      console.log('Fetching course hold requests');
      return api.get('/course-hold', { params: { status: 'pending' } });
    }),
    getAttendanceHistory,
  
  getUsers: (params) => handleApiCall(() => api.get('/users', { params })),
  updateUserMetadata: (userId, metadata) => handleApiCall(() => api.post(`/users/${userId}/metadata`, metadata)),
  getCourses: () => handleApiCall(() => api.get('/courses')),
  getCoordinators: () => handleApiCall(() => api.get('/coordinators')),
  updateUser: (userId, data) => handleApiCall(() => api.post(`/users/${userId}`, data)),
};
  
  export default apiMethods;