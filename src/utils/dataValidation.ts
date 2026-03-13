/**
 * Data Validation Utilities for Financial Documents
 * 
 * Rules:
 * - Amounts: Max 10 Crore (100,000,000)
 * - Names/Text: Max 50 characters, no special characters
 * - Only alphanumeric and spaces allowed in names
 */

export const VALIDATION_RULES = {
  MAX_AMOUNT: 100000000, // 10 Crore
  MAX_STRING_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 100,
};

/**
 * Sanitize string by removing special characters
 * Only allows: letters, numbers, spaces, dots, hyphens
 */
export const sanitizeString = (value: string, maxLength: number = VALIDATION_RULES.MAX_STRING_LENGTH): string => {
  if (!value) return '';
  
  // Remove special characters (keep only alphanumeric, space, dot, hyphen)
  let sanitized = value.replace(/[^a-zA-Z0-9\s.\-]/g, '');
  
  // Trim to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Sanitize name fields (only letters and spaces)
 */
export const sanitizeName = (value: string, maxLength: number = VALIDATION_RULES.MAX_STRING_LENGTH): string => {
  if (!value) return '';
  
  // Remove everything except letters and spaces
  let sanitized = value.replace(/[^a-zA-Z\s]/g, '');
  
  // Trim to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Validate and cap amount to maximum limit
 */
export const validateAmount = (value: number | string): number | string => {
  // Allow empty string (user deleted everything)
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Return empty if not a valid number
  if (isNaN(num)) {
    return '';
  }
  
  // Prevent negative amounts
  if (num < 0) {
    return 0;
  }
  
  // Cap at 10 Crore
  if (num > VALIDATION_RULES.MAX_AMOUNT) {
    return VALIDATION_RULES.MAX_AMOUNT;
  }
  
  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
};

/**
 * Check if string contains special characters
 */
export const hasSpecialCharacters = (value: string): boolean => {
  return /[^a-zA-Z0-9\s.\-]/.test(value);
};

/**
 * Check if name contains numbers or special characters
 */
export const hasInvalidNameCharacters = (value: string): boolean => {
  return /[^a-zA-Z\s]/.test(value);
};

/**
 * Check if amount exceeds maximum
 */
export const exceedsMaxAmount = (value: number | string): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > VALIDATION_RULES.MAX_AMOUNT;
};

/**
 * Check if string exceeds maximum length
 */
export const exceedsMaxLength = (value: string, maxLength: number = VALIDATION_RULES.MAX_STRING_LENGTH): boolean => {
  return value && value.length > maxLength;
};

/**
 * Format validation error message
 */
export const getValidationError = (field: string, type: 'special_chars' | 'max_length' | 'max_amount' | 'invalid_name'): string => {
  switch (type) {
    case 'special_chars':
      return `${field}: Special characters are not allowed`;
    case 'max_length':
      return `${field}: Maximum ${VALIDATION_RULES.MAX_STRING_LENGTH} characters allowed`;
    case 'max_amount':
      return `${field}: Amount cannot exceed ₹10 Crore`;
    case 'invalid_name':
      return `${field}: Only letters and spaces are allowed`;
    default:
      return `${field}: Invalid value`;
  }
};

/**
 * Validate entire canonical data structure
 */
export const validateCanonicalData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data) {
    return { isValid: false, errors: ['No data provided'] };
  }
  
  // Validate vendor name
  if (data.vendor?.name) {
    if (hasInvalidNameCharacters(data.vendor.name)) {
      errors.push(getValidationError('Vendor Name', 'invalid_name'));
    }
    if (exceedsMaxLength(data.vendor.name)) {
      errors.push(getValidationError('Vendor Name', 'max_length'));
    }
  }
  
  // Validate customer name
  if (data.customer?.name) {
    if (hasInvalidNameCharacters(data.customer.name)) {
      errors.push(getValidationError('Customer Name', 'invalid_name'));
    }
    if (exceedsMaxLength(data.customer.name)) {
      errors.push(getValidationError('Customer Name', 'max_length'));
    }
  }
  
  // Validate document number
  if (data.document_metadata?.document_number) {
    if (exceedsMaxLength(data.document_metadata.document_number)) {
      errors.push(getValidationError('Document Number', 'max_length'));
    }
  }
  
  // Validate amounts
  const totals = data.totals || {};
  if (exceedsMaxAmount(totals.grand_total)) {
    errors.push(getValidationError('Grand Total', 'max_amount'));
  }
  if (exceedsMaxAmount(totals.tax_total)) {
    errors.push(getValidationError('Tax Total', 'max_amount'));
  }
  if (exceedsMaxAmount(totals.amount_paid)) {
    errors.push(getValidationError('Paid Amount', 'max_amount'));
  }
  if (exceedsMaxAmount(totals.balance_due)) {
    errors.push(getValidationError('Outstanding', 'max_amount'));
  }
  
  // Validate line items
  const lineItems = data.line_items || data.extracted_fields?.line_items || [];
  lineItems.forEach((item: any, index: number) => {
    if (item.description && exceedsMaxLength(item.description, VALIDATION_RULES.MAX_DESCRIPTION_LENGTH)) {
      errors.push(`Line Item ${index + 1}: Description exceeds ${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} characters`);
    }
    if (exceedsMaxAmount(item.unit_price)) {
      errors.push(`Line Item ${index + 1}: Unit price exceeds ₹10 Crore`);
    }
    if (exceedsMaxAmount(item.line_total || item.amount)) {
      errors.push(`Line Item ${index + 1}: Amount exceeds ₹10 Crore`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
