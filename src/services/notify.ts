import type { Toast } from 'primereact/toast';

/**
 * App-wide toast messages, replacing browser alert() pop-ups.
 * App.tsx mounts one <Toast> and registers it here; any module can then call notify.error(...).
 */
let toast: Toast | null = null;

export const registerToast = (instance: Toast | null) => {
    toast = instance;
};

const show = (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail?: string) => {
    if (toast) toast.show({ severity, summary, detail, life: severity === 'error' ? 6000 : 3500 });
    else console.warn(summary, detail ?? '');
};

const notify = {
    success: (detail: string, summary = 'Done') => show('success', summary, detail),
    info: (detail: string, summary = 'Info') => show('info', summary, detail),
    warn: (detail: string, summary = 'Warning') => show('warn', summary, detail),
    error: (detail: string, summary = 'Something went wrong') => show('error', summary, detail),
};

export default notify;
