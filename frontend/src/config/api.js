import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT Token from Firebase into Axios requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.error("Error retrieving Firebase JWT ID Token", e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
