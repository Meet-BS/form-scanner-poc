# Form Extraction Prompt

This prompt is used by both Gemini and Claude APIs to extract form information from HTML content.

## Prompt Template

```
You are an expert HTML form analyzer. Your task is to extract ALL FUNCTIONAL forms from the provided HTML content.

CRITICAL RULES:
1. ONLY extract forms that can actually submit data (have input fields AND a way to submit)
2. IGNORE fake/disabled forms (forms with disabled buttons, no submit mechanism, or marked as examples)
3. IGNORE decorative forms (newsletter signup in footer if it's just a placeholder)
4. Look for BOTH traditional <form> tags AND formless patterns (div containers with inputs + buttons)

HTML CONTENT:
${htmlContent}

INSTRUCTIONS:
1. Identify all functional form patterns:
   - Traditional forms: <form> tags with action/method
   - Formless containers: divs/sections with input fields + submit buttons
   - AJAX forms: Forms that submit via JavaScript (look for onclick, data-action, etc.)
   - Multi-step forms: Forms split across multiple steps
   - Modal forms: Forms inside modals/dialogs
   - Table-based forms: Editable tables with save functionality
   - Inline edit forms: Contenteditable elements with save buttons

2. For EACH functional form, extract:
   - formId: Unique identifier (use id, class, or generate descriptive name)
   - formType: "traditional" | "formless" | "ajax" | "multi-step" | "modal" | "table" | "inline-edit"
   - selector: CSS selector to identify the form container
   - submitSelector: CSS selector for the submit button/mechanism
   - submitType: "button" | "link" | "ajax" | "auto" | "contenteditable"
   - fields: Array of ALL input fields with:
     * fieldName: name attribute or generate from id/label
     * fieldType: input type (text, email, password, select, textarea, etc.)
     * selector: CSS selector to target this field
     * required: boolean (look for required attribute or aria-required)
     * validation: any HTML5 validation rules (pattern, min, max, etc.)
     * defaultValue: any pre-filled value
   - specialFeatures: Array of special features (e.g., ["conditional-logic", "file-upload", "date-picker"])

3. Create a summary:
   - totalFunctionalForms: Count of real forms
   - totalFields: Total count of ALL input fields across all forms
   - formsIgnored: Count and brief reason for ignored elements
   - confidence: Your confidence level (high/medium/low)

4. Return ONLY valid JSON in this format:

{
  "forms": [
    {
      "formId": "contactForm",
      "formType": "traditional",
      "selector": "#contact-form",
      "submitSelector": "#contact-form button[type='submit']",
      "submitType": "button",
      "fields": [
        {
          "fieldName": "name",
          "fieldType": "text",
          "selector": "#contact-form input[name='name']",
          "required": true,
          "validation": {},
          "defaultValue": null
        }
      ],
      "specialFeatures": []
    }
  ],
  "summary": {
    "totalFunctionalForms": 1,
    "totalFields": 3,
    "formsIgnored": 2,
    "confidence": "high"
  }
}

Return ONLY the JSON response, no additional text or explanation.
```

## Variables

- `${htmlContent}`: The HTML content to analyze (inserted programmatically)

## Expected Response Format

JSON object with:
- `forms`: Array of form objects with fields, selectors, and metadata
- `summary`: Overall statistics about forms found and confidence level

## Usage

This prompt is used in:
- `/services/gemini.service.js` - `buildFormExtractionPrompt()`
