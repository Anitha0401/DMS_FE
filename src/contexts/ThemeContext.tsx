import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME_OPTIONS, ThemeOption, getAllThemeValues } from '../constants/themeOptions';

interface ThemeContextType {
    theme: string;
    setTheme: (theme: string) => void;
    themeOptions: ThemeOption[];
    currentTheme: ThemeOption | undefined;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    setTheme: () => {},
    themeOptions: THEME_OPTIONS,
    currentTheme: undefined,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState('light');

    useEffect(() => {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('selected-theme');
        if (savedTheme && getAllThemeValues().includes(savedTheme)) {
            setThemeState(savedTheme);
        }
    }, []);

    useEffect(() => {
        // Apply theme to document
        document.documentElement.removeAttribute('data-theme');
        document.body.removeAttribute('data-theme');
        
        setTimeout(() => {
            document.documentElement.setAttribute('data-theme', theme);
            document.body.setAttribute('data-theme', theme);
        }, 10);

        // Save to localStorage
        localStorage.setItem('selected-theme', theme);
    }, [theme]);

    const setTheme = (newTheme: string) => {
        if (getAllThemeValues().includes(newTheme)) {
            setThemeState(newTheme);
        }
    };

    const currentTheme = THEME_OPTIONS.find(t => t.value === theme);

    return (
        <ThemeContext.Provider value={{ 
            theme, 
            setTheme, 
            themeOptions: THEME_OPTIONS,
            currentTheme 
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};