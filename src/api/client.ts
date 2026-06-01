import useAuthStore from '../store/authStore';
import { mockApiClient } from './mock';

interface FetchOptions extends RequestInit {
  data?: any;
}

export const apiClient = async (endpoint: string, options: FetchOptions = {}) => {
  const token = useAuthStore.getState().token;
  
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', "Bearer " + (token) + "");
  }
  
  if (options.data && !(options.data instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.data);
  } else if (options.data instanceof FormData) {
    options.body = options.data;
  }
  
  // Use local storage mock API instead of real fetch
  return await mockApiClient(endpoint, { ...options, headers });
};
