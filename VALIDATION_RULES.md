# Data Validation Rules

## Overview

All validation is implemented on the **frontend only** (Finixy_workflow folder). No changes were made to the backend (finance folder).

## Validation Rules

### 1. Amount Limits

- **Maximum Amount**: ₹10 Crore (100,000,000)
- Applies to:
  - Grand Total
  - Tax Total
  - Paid Amount
  - Outstanding Amount
  - Line Item Unit Price
  - Line Item Amount

**Behavior**: If user enters amount > 10 Crore, it will be automatically capped at 10 Crore and a warning message will be shown.

### 2. Name Fields (Vendor Name, Customer Name)

- **Maximum Length**: 50 characters
- **Allowed Characters**: Letters and spaces only (a-z, A-Z, space)
- **Not Allowed**: Numbers, special characters

**Behavior**: Special characters and numbers are automatically removed as user types. Warning message shown if invalid characters are entered.

### 3. Document Number

- **Maximum Length**: 50 characters
- **Allowed Characters**: Alphanumeric, spaces, dots, hyphens (a-z, A-Z, 0-9, space, ., -)
- **Not Allowed**: Special characters like @, #, $, %, etc.

**Behavior**: Special characters are automatically removed. Length is capped at 50 characters.

### 4. Line Item Descriptions

- **Maximum Length**: 100 characters
- **Allowed Characters**: Alphanumeric, spaces, dots, hyphens
- **Not Allowed**: Special characters

**Behavior**: Special characters are automatically removed. Length is capped at 100 characters.

## Implementation Files

### Created Files:

1. **`Finixy_workflow/src/utils/dataValidation.ts`**
   - Contains all validation logic
   - Sanitization functions
   - Validation rules constants

### Modified Files:

1. **`Finixy_workflow/src/components/modals/DocumentPreviewModal.tsx`**
   - Integrated validation into input handlers
   - Real-time validation as user types
   - Visual error messages

## How It Works

### Real-time Validation

- As user types in any field, validation runs automatically
- Invalid characters are removed immediately
- Error messages appear for 3 seconds when validation fails

### Visual Feedback

- Red error banner appears at top of modal when validation fails
- Error message explains what went wrong
- Banner auto-dismisses after 3 seconds

### Examples

**Vendor Name:**

```
User types: "ABC Corp @123"
Result: "ABC Corp"
Error: "Vendor Name: Only letters and spaces are allowed"
```

**Grand Total:**

```
User types: "150000000" (15 Crore)
Result: "100000000" (10 Crore)
Error: "Grand Total: Amount cannot exceed ₹10 Crore"
```

**Document Number:**

```
User types: "INV-2024-#001"
Result: "INV-2024-001"
(# is removed automatically)
```

## Testing

To test validation:

1. Open any document in the parsed data modal
2. Click "Edit Data"
3. Try entering:
   - Special characters in names
   - Amounts over 10 Crore
   - Very long strings (>50 chars)
4. Observe automatic sanitization and error messages

## Benefits

✅ Data consistency across all documents
✅ Prevents invalid data from being saved
✅ User-friendly error messages
✅ Real-time feedback
✅ No backend changes required
✅ Works offline (client-side validation)
