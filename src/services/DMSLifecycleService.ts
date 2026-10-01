import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_URL } from '../config/appConfig';
import authService from './authService';

/**
 * Every API call goes through this service.
 *  - base URL comes from REACT_APP_API_URL (no more hard-coded https://localhost:7151)
 *  - sends the logged-in user's token
 *  - a 401 logs the user out (the app then shows the login page)
 */
const axiosInstance = axios.create({ timeout: 60_000 });

axiosInstance.interceptors.request.use((config) => {
    const token = authService.token();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // error.response is undefined for network errors and timeouts: never read .status directly.
        if (error.response?.status === 401) authService.logout();
        return Promise.reject(error);
    }
);

const dmsLifecycleService = {
    getApiCall: async (endpoint: string) => dmsLifecycleService.apiCall(endpoint, 'get'),

    deleteApiCall: async (endpoint: string, data?: any) => dmsLifecycleService.apiCall(endpoint, 'delete', data),

    postApiCall: async (endpoint: string, data?: any) =>
        dmsLifecycleService.apiCall(endpoint, 'post', data, { headers: { 'Content-Type': 'application/json' } }),

    putApiCall: async (endpoint: string, data?: any) =>
        dmsLifecycleService.apiCall(endpoint, 'put', data, { headers: { 'Content-Type': 'application/json' } }),

    apiCall: async (
        endpoint: string,
        method: 'get' | 'post' | 'put' | 'delete' = 'get',
        data?: any,
        config?: AxiosRequestConfig
    ) => {
        const url = `${API_URL}/${endpoint}`;
        if (method === 'get' && data) config = { ...config, params: data };

        try {
            let response;
            if (method === 'get') response = await axiosInstance.get(url, config);
            else if (method === 'delete') response = await axiosInstance.delete(url, { ...config, data });
            else if (method === 'put') response = await axiosInstance.put(url, data, config);
            else response = await axiosInstance.post(url, data, config);
            return response.data;
        } catch (error) {
            console.error(`Error in API call to ${endpoint}:`, error);
            throw error;
        }
    },
};

/** A readable message from an API error (ProblemDetails, the API's error JSON, or plain text). */
export const errorMessage = (error: unknown, fallback = 'Something went wrong.'): string => {
    const e = error as AxiosError<any>;
    const data = e?.response?.data;
    if (!e?.response) return 'Cannot reach the server. Check your connection.';
    if (typeof data === 'string' && data.trim()) return data;
    // ASP.NET validation errors: { title: "One or more validation errors occurred.", errors: { Field: ["..."] } }
    if (data?.errors && typeof data.errors === 'object') {
        const details = Object.entries(data.errors as Record<string, unknown>)
            .flatMap(([field, msgs]) => (Array.isArray(msgs) ? msgs : [msgs]).map((m) => `${field.replace(/^\$\./, '')}: ${m}`))
            .slice(0, 5);
        if (details.length) return details.join('\n');
    }
    return data?.MetaData?.ErrorMessage || data?.metaData?.errorMessage || data?.detail || data?.title || data?.message || data?.error || fallback;
};

export default dmsLifecycleService;
