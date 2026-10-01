import axios from 'axios';
import { API_URL } from '../config/appConfig';

export interface AuthUser {
    userId: string;
    userName: string;
    role: string;
    token: string;
    expiresUtc: string;
}

// sessionStorage: the login ends when the browser tab closes (shared office PCs).
const STORAGE_KEY = 'dms.auth';
const listeners = new Set<(user: AuthUser | null) => void>();

const read = (): AuthUser | null => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const user = JSON.parse(raw) as AuthUser;
        if (!user.token || new Date(user.expiresUtc).getTime() <= Date.now()) {
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return user;
    } catch {
        return null;
    }
};

const authService = {
    login: async (userId: string, password: string): Promise<AuthUser> => {
        const { data } = await axios.post(`${API_URL}/Login`, { userId, password });
        const user: AuthUser = {
            userId: data.userId,
            userName: data.userName,
            role: data.role,
            token: data.token,
            expiresUtc: data.expiresUtc,
        };
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } catch {
            /* storage blocked: logged in for this page only */
        }
        listeners.forEach((l) => l(user));
        return user;
    },

    logout: () => {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch {
            /* ignore */
        }
        listeners.forEach((l) => l(null));
    },

    currentUser: (): AuthUser | null => read(),

    token: (): string | null => read()?.token ?? null,

    onChange: (listener: (user: AuthUser | null) => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
};

export default authService;
