export interface ThemeOption {
    label: string;
    value: string;
    icon: string;
    color?: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
    { 
        label: 'Light Theme', 
        value: 'light', 
        icon: 'pi pi-sun',
        color: '#0072bc'
    },
    { 
        label: 'Dark Theme', 
        value: 'dark', 
        icon: 'pi pi-moon',
        color: '#38bdf8'
    },
    { 
        label: 'Blue Theme', 
        value: 'blue', 
        icon: 'pi pi-palette',
        color: '#2563eb'
    },
    { 
        label: 'Green Theme', 
        value: 'green', 
        icon: 'pi pi-leaf',
        color: '#16a34a'
    },
    { 
        label: 'Teal Theme', 
        value: 'teal', 
        icon: 'pi pi-circle',
        color: '#14b8a6'
    }
];

// Helper functions
export const getThemeByValue = (value: string): ThemeOption | undefined => {
    return THEME_OPTIONS.find(theme => theme.value === value);
};

export const getThemeColor = (value: string): string => {
    const theme = getThemeByValue(value);
    return theme?.color || '#0072bc';
};

export const getThemeIcon = (value: string): string => {
    const theme = getThemeByValue(value);
    return theme?.icon || 'pi pi-palette';
};

export const getAllThemeValues = (): string[] => {
    return THEME_OPTIONS.map(theme => theme.value);
};