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
    validateLoggedInUser: async (loginInfo: any) => {
        try {
            const formData = new FormData();
            Object.entries(loginInfo).forEach(([key, value]) => {
                formData.append(key, value as string);
            });
            const response = await axiosInstance.post(`${API_URL}/Login`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error validating logged in status:', error);
            throw error; // Re-throw the error for further handling
        }
    },
    // Generic API call method
    apiCall: async (endpoint: string, method: 'get' | 'post' | 'delete' = 'get', data?: any, config?: any) => {
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