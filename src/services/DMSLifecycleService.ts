import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'https://localhost:7151/api'; // window.location.origin + '/dms/api'; // Use the current origin as the base URL
const axiosInstance = axios.create();

// Add a request interceptor to include the anti-forgery XSRF-TOKEN in the headers
axiosInstance.interceptors.request.use(
    (config) => {
        const token = Cookies.get('XSRF-TOKEN'); // Retrieve the token from cookies
        if (token) {
            config.headers['RequestVerificationToken'] = token; // add the token to the headers
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Attempt to refresh the token
                await dmsLifecycleService.getToken(); // Assuming this refreshes the token
                // The request interceptor will add the new token
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // If token refresh fails, redirect to login
                window.location.href = '/login'; 
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

const dmsLifecycleService = {
    getToken: async () => {
        try {
            const response = await axios.get(`${API_URL}/gettoken`);
            return response.data;
        } catch (error) {
            console.error('Error fetching token:', error);
            throw error; // Re-throw the error for further handling
        }
    },
    getApiCall: async (endpoint: string) => {
         return await dmsLifecycleService.apiCall(endpoint, 'get');
    },
    deleteApiCall: async (endpoint: string, data?: any) => {
         return await dmsLifecycleService.apiCall(endpoint, 'delete', data);
    },
    postApiCall: async (endpoint: string, data?: any) => {
        return await dmsLifecycleService.apiCall(endpoint, 'post', data, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
     
    },
    putApiCall: async (endpoint: string, data?: any) => {
        return await dmsLifecycleService.apiCall(endpoint, 'put', data, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
     
    },
    apiCall: async (endpoint: string, method: 'get' | 'post' | 'put' | 'delete' = 'get', data?: any, config?: any) => {
        try {
            const url = `${API_URL}/${endpoint}`;
            
            // If the method is 'get', we don't send data in the body, but as query parameters
            if (method === 'get' && data) {
                config = { ...config, params: data };
            }

            let response;
            if (method === 'get') {
                response = await axiosInstance.get(url, config);
            } else if (method === 'delete') {
                response = await axiosInstance.delete(url, config);
            } else if (method === 'put') {
                response = await axiosInstance.put(url, data, config);
            } else {
                response = await axiosInstance.post(url, data, config);
            }
            
            return response.data;
        } catch (error) {
            console.error(`Error in API call to ${endpoint}:`, error);
            throw error;
        }
    }
};
export default dmsLifecycleService;