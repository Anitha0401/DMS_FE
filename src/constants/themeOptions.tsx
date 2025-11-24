export interface ThemeOption {
    label: string;
    value: string;
    icon: string;
    color?: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
    { label: 'Light Theme', value: 'light', icon: 'pi pi-sun', color: '#0072bc' },
    { label: 'Dark Theme', value: 'dark', icon: 'pi pi-moon', color: '#38bdf8' },
    { label: 'Blue Theme', value: 'blue', icon: 'pi pi-palette', color: '#2563eb' },
    { label: 'Indigo Theme', value: 'indigo', icon: 'pi pi-bookmark', color: '#6366f1' },
    { label: 'Emerald Theme', value: 'emerald', icon: 'pi pi-check-circle', color: '#10b981' },
    { label: 'Teal Theme', value: 'teal', icon: 'pi pi-circle', color: '#14b8a6' },
    { label: 'Slate Theme', value: 'slate', icon: 'pi pi-stop', color: '#475569' },
    { label: 'Yellow Theme', value: 'yellow', icon: 'pi pi-star-fill', color: '#eab308' },
    { label: 'Red Theme', value: 'red', icon: 'pi pi-heart', color: '#ef4444' },
    { label: 'Orange Theme', value: 'orange', icon: 'pi pi-sun', color: '#ea580c' },
    { label: 'Pink Theme', value: 'pink', icon: 'pi pi-heart-fill', color: '#ec4899' },
    { label: 'Rose Theme', value: 'rose', icon: 'pi pi-heart', color: '#f43f5e' },
    { label: 'Purple Theme', value: 'purple', icon: 'pi pi-star', color: '#9333ea' }
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