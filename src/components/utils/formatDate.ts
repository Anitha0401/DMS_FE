/**
 * One date format for the whole app: "28 Sep 2026" (and "28 Sep 2026, 14:05" with time).
 * Accepts ISO strings, Date objects and the "28-Sep-2026" strings some stored procedures return.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parse = (value: string | Date | null | undefined): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const d = new Date(value.replace(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/, '$1 $2 $3'));
    return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (value: string | Date | null | undefined, fallback = '–'): string => {
    const d = parse(value);
    if (!d) return value ? String(value) : fallback;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateTime = (value: string | Date | null | undefined, fallback = '–'): string => {
    const d = parse(value);
    if (!d) return value ? String(value) : fallback;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${formatDate(d)}, ${hh}:${mm}`;
};
