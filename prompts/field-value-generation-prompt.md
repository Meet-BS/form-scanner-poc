# Field Value Generation Prompt

This prompt is used by both Gemini and Claude APIs to generate realistic test data for form fields.

## Prompt Template

```
You are an expert at generating realistic test data for form submissions. Your task is to generate valid values for all fields in the provided form that will pass ALL validations.

FORM DATA:
${JSON.stringify(formData, null, 2)}

INSTRUCTIONS:
1. Generate realistic, valid values for each field
2. Ensure values satisfy ALL validation rules:
   - Required fields must have values
   - Email fields must have valid email format
   - Phone numbers must match expected format
   - Numbers must be within min/max ranges
   - Text must match pattern/regex if specified
   - Dates must be valid and in correct format
   - Passwords must meet strength requirements
   - Select fields must use one of the provided options
   - Checkboxes/radios must use valid values

3. Use realistic data:
   - Real-looking names (e.g., "John Smith", "Emma Johnson")
   - Valid email addresses (e.g., "john.smith@example.com")
   - Proper phone numbers (e.g., "+1-555-123-4567" or "(555) 123-4567")
   - Reasonable dates (not too far in past/future unless specified)
   - Meaningful text content for messages/comments
   - Appropriate selections for dropdowns
   - VARY THE DATA: Use different names, emails, numbers for each form to ensure uniqueness

4. For different field types:
   - text: Use relevant realistic text (3-50 characters unless specified) - VARY THE VALUES
   - email: Use valid email format with DIFFERENT realistic names each time
   - password: Use secure password meeting requirements (e.g., "SecureP@ss123", "MyP@ssw0rd!", "Str0ng#Key")
   - tel: Use valid phone format - RANDOMIZE the numbers
   - number: Use numbers within specified range - RANDOMIZE within range
   - date: Use YYYY-MM-DD format with reasonable dates - VARY the dates
   - time: Use HH:MM format - VARY the times
   - url: Use valid URL format (e.g., "https://example.com", "https://mysite.org")
   - select: Choose first valid option or most appropriate one
   - textarea: Use 2-3 sentences of realistic content - MAKE IT UNIQUE per form
   - checkbox: Use true/false or "checked"/"unchecked"
   - radio: Choose one valid option
   - file: Indicate file type needed (e.g., "image.jpg", "document.pdf", "resume.pdf")
   - contenteditable: Use realistic content matching context - VARY the content

IMPORTANT: Generate UNIQUE, VARIED values for each field. Don't reuse the same name/email/phone across forms.
Use a variety like: "Sarah Johnson", "Michael Chen", "Emily Rodriguez", "James Wilson", "Lisa Anderson", etc.

5. Return the response in this JSON format:

{
  "formId": "the form identifier",
  "values": {
    "fieldName1": "generated value",
    "fieldName2": "generated value",
    ...
  },
  "metadata": {
    "allValidationsSatisfied": boolean,
    "notes": "any special notes about generated values"
  }
}

Return ONLY the JSON response, no additional text or explanation.
```

## Variables

- `${formData}`: The form data object containing fields and validation rules (inserted programmatically as JSON)

## Expected Response Format

JSON object with:
- `formId`: The form identifier
- `values`: Object mapping field names to generated values
- `metadata`: Validation status and notes

## Field Type Examples

### Text Fields
```json
{
  "firstName": "Sarah Johnson",
  "lastName": "Chen",
  "company": "Tech Solutions Inc"
}
```

### Email Fields
```json
{
  "email": "sarah.johnson@example.com",
  "workEmail": "michael.chen@company.com"
}
```

### Phone Fields
```json
{
  "phone": "+1-555-123-4567",
  "mobile": "(555) 987-6543"
}
```

### Date/Time Fields
```json
{
  "birthDate": "1990-05-15",
  "appointmentDate": "2025-12-20",
  "meetingTime": "14:30"
}
```

### Number Fields
```json
{
  "age": 32,
  "quantity": 5,
  "price": 99.99
}
```

### Password Fields
```json
{
  "password": "SecureP@ss123",
  "confirmPassword": "SecureP@ss123"
}
```

### Select/Dropdown Fields
```json
{
  "country": "United States",
  "state": "California",
  "category": "Technology"
}
```

### Textarea Fields
```json
{
  "message": "I am interested in your services and would like to discuss potential collaboration opportunities. Please contact me at your earliest convenience.",
  "comments": "This is a test submission to verify form functionality and validation rules."
}
```

### Checkbox/Radio Fields
```json
{
  "subscribe": true,
  "agreeToTerms": "checked",
  "contactMethod": "email"
}
```

### File Fields
```json
{
  "resume": "resume.pdf",
  "profilePhoto": "profile-image.jpg",
  "attachment": "document.docx"
}
```

## Usage

This prompt is used in:
- `/services/gemini.service.js` - `buildFieldValueGenerationPrompt()`

## Notes

- Always generate UNIQUE values for each form to avoid duplication
- Ensure all validation rules are satisfied (required, format, length, range, etc.)
- Use realistic, varied data that looks like actual user input
- For passwords, generate secure values meeting common requirements (uppercase, lowercase, numbers, special characters)
