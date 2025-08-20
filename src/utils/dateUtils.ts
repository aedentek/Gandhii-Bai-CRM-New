/**
 * Global Date Utilities for Gandhi Bai CRM
 * Centralized date handling to prevent "NA" issues across the project
 */

import { format, parse, isValid } from 'date-fns';

// Types
export type DateInput = string | number | Date | null | undefined;

/**
 * Create timezone-safe local date
 */
export const createLocalDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
};

/**
 * Parse date from various input formats
 */
export const parseDate = (dateInput: DateInput): Date | null => {
  if (!dateInput) return null;

  try {
    let date: Date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      // Handle different string formats
      if (dateInput === 'NA' || dateInput.trim() === '') return null;
      
      // Try different parsing strategies
      if (dateInput.includes('-')) {
        if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // YYYY-MM-DD format
          const [year, month, day] = dateInput.split('-').map(Number);
          date = createLocalDate(year, month, day);
        } else if (dateInput.match(/^\d{2}-\d{2}-\d{4}$/)) {
          // DD-MM-YYYY format
          const [day, month, year] = dateInput.split('-').map(Number);
          date = createLocalDate(year, month, day);
        } else {
          date = new Date(dateInput);
        }
      } else if (dateInput.includes('/')) {
        if (dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          // DD/MM/YYYY format
          const [day, month, year] = dateInput.split('/').map(Number);
          date = createLocalDate(year, month, day);
        } else if (dateInput.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
          // YYYY/MM/DD format
          const [year, month, day] = dateInput.split('/').map(Number);
          date = createLocalDate(year, month, day);
        } else {
          date = new Date(dateInput);
        }
      } else {
        date = new Date(dateInput);
      }
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return null;
    }

    // Validate the date
    if (!isValid(date) || isNaN(date.getTime())) return null;
    
    // Check reasonable year range
    const year = date.getFullYear();
    if (year < 1900 || year > 2100) return null;

    return date;
  } catch (error) {
    console.warn('Error parsing date:', dateInput, error);
    return null;
  }
};

/**
 * Format date for HTML input (YYYY-MM-DD)
 */
export const formatDateForInput = (dateInput: DateInput): string => {
  const date = parseDate(dateInput);
  if (!date) return '';
  
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('Error formatting date for input:', dateInput, error);
    return '';
  }
};

/**
 * Format date for backend (DD-MM-YYYY)
 */
export const formatDateForBackend = (dateInput: DateInput): string => {
  const date = parseDate(dateInput);
  if (!date) return '';
  
  try {
    return format(date, 'dd-MM-yyyy');
  } catch (error) {
    console.warn('Error formatting date for backend:', dateInput, error);
    return '';
  }
};

/**
 * Format date for display (DD/MM/YYYY)
 */
export const formatDateForDisplay = (dateInput: DateInput): string => {
  const date = parseDate(dateInput);
  if (!date) return 'NA';
  
  try {
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    console.warn('Error formatting date for display:', dateInput, error);
    return 'NA';
  }
};

/**
 * Format date for display with fallback (DD MMM YYYY)
 */
export const formatDateLong = (dateInput: DateInput): string => {
  const date = parseDate(dateInput);
  if (!date) return 'Not Available';
  
  try {
    return format(date, 'dd MMM yyyy');
  } catch (error) {
    console.warn('Error formatting long date:', dateInput, error);
    return 'Not Available';
  }
};

/**
 * Parse HTML input date (YYYY-MM-DD) to Date
 */
export const parseDateFromInput = (dateString: string): Date | null => {
  if (!dateString || dateString.trim() === '') return null;
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Validate the numbers
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (year < 1900 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    
    const date = createLocalDate(year, month, day);
    
    // Double-check the created date is valid
    if (!isValid(date) || isNaN(date.getTime())) return null;
    
    return date;
  } catch (error) {
    console.warn('Error parsing date from input:', dateString, error);
    return null;
  }
};

/**
 * Check if a date value is valid
 */
export const isValidDate = (dateInput: DateInput): boolean => {
  const date = parseDate(dateInput);
  return date !== null;
};

/**
 * Get current date in YYYY-MM-DD format for input fields
 */
export const getCurrentDateForInput = (): string => {
  return formatDateForInput(new Date());
};

/**
 * Convert any date to safe backend format, returns empty string for invalid dates
 */
export const toSafeBackendDate = (dateInput: DateInput): string => {
  const date = parseDate(dateInput);
  return date ? formatDateForBackend(date) : '';
};

/**
 * Convert any date to safe display format, returns "NA" for invalid dates
 */
export const toSafeDisplayDate = (dateInput: DateInput): string => {
  const date = parseDate(dateInput);
  return date ? formatDateForDisplay(date) : 'NA';
};

// Global CSS class names for consistent date handling across project
export const DATE_CSS_CLASSES = {
  input: 'date-input',
  display: 'date-display',
  label: 'date-label',
  error: 'date-error',
} as const;

// Global date validation rules
export const DATE_VALIDATION = {
  minYear: 1900,
  maxYear: 2100,
  formats: {
    input: 'YYYY-MM-DD',
    backend: 'DD-MM-YYYY',
    display: 'DD/MM/YYYY',
    long: 'DD MMM YYYY'
  }
} as const;
