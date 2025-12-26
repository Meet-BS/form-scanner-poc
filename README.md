# Form Scanner POC - Test Server

A Node.js server with diverse test forms designed to challenge and validate form scanner functionality.

## Features

This server provides 5 different form types with varying complexity levels:

### 1. **Simple Form** (`/simple-form`)
- Basic contact form
- Standard fields: name, email, phone, message
- **Success Rate**: 100%
- **Purpose**: Test basic form detection

### 2. **Conditional Form** (`/conditional-form`)
- Dynamic fields that appear/disappear based on selections
- Business account fields (company name, tax ID) appear when "Business" is selected
- Country-specific field appears when "Other" is selected
- **Validation**: Age must be 18+
- **Success Rate**: Conditional (fails if age < 18)
- **Purpose**: Test dynamic field detection

### 3. **Complex Form** (`/complex-form`)
- Comprehensive job application
- Multiple field types: text, email, date, number, file upload, checkboxes, radio buttons
- Sectioned layout with personal, professional, and additional info
- **Success Rate**: 70% (random failures to test error handling)
- **Purpose**: Test handling of complex forms with many fields

### 4. **Multi-Step Form** (`/multi-step-form`)
- Wizard-style registration with 3 steps
- Progressive disclosure of fields
- Step-by-step validation
- Visual progress indicator
- **Validation**: Each step must be completed before proceeding
- **Success Rate**: Conditional (validates all required fields)
- **Purpose**: Test multi-step form navigation and completion

### 5. **Noisy Form** (`/noisy-form`)
- Newsletter subscription form
- **Heavy distractions**: marketing content, images, testimonials, stats, FAQs
- Form buried in promotional content
- **Hidden validation**: Must agree to terms
- **Success Rate**: Conditional (fails if terms not accepted)
- **Purpose**: Test form detection in noisy environments

### 6. **All Forms Suite** (`/all-forms`)
- **13 different forms on one page** - ultimate testing ground
- Includes:
  1. Traditional form with `<form>` tag
  2. Formless inputs (no form tag, DIV-based)
  3. Multiple action buttons (save/publish/preview)
  4. Table-based form layout
  5. Dynamic fields (add/remove fields)
  6. Inline editing with contenteditable
  7. Auto-submit on change (no submit button)
  8. Hidden form with visible trigger
  9. All HTML5 input types
  10. Data attribute-based collection
  11. Modal popup form (opens on click)
  12. Form with page redirect to success page
  13. Form with success modal overlay
- **Success Rate**: 80% (random failures)
- **Purpose**: Comprehensive testing of all form patterns in one place

## Setup

### Installation

```bash
npm install
```

### Configuration

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Add your Gemini API key to the `.env` file:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro
```

To get a Gemini API key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into your `.env` file

### Running the Server

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The server will start at `http://localhost:3000`

## API Endpoints

### Form Pages (GET)
- `/` - Home page with links to all forms
- `/simple-form` - Simple contact form
- `/conditional-form` - Conditional registration form
- `/complex-form` - Complex job application
- `/multi-step-form` - Multi-step registration wizard
- `/noisy-form` - Newsletter form with distracting content
- `/all-forms` - All 13 form types on one page
- `/scanner-test` - AI-powered form scanner test interface

### Submission Endpoints (POST)
- `/api/submit-simple` - Always succeeds
- `/api/submit-conditional` - Validates age (must be 18+)
- `/api/submit-complex` - 70% success rate (random failures)
- `/api/submit-multistep` - Validates all required fields
- `/api/submit-noisy` - Validates terms acceptance
- `/api/submit-all-forms` - Universal handler for all-forms page (80% success rate)
- `/api/submit-redirect` - Returns confirmation ID for redirect

### AI Scanner Endpoints (POST)
- `/api/scanner/extract-forms` - Extract all functional forms from HTML content
- `/api/scanner/generate-values` - Generate valid field values for a form
- `/api/scanner/analyze-complete` - Complete analysis (extract + generate values)
- `/api/scanner/test-page` (GET) - Get the all-forms page HTML for testing

### Additional Pages
- `/success.html` - Success page shown after form redirect

## Response Format

All submission endpoints return JSON:

**Success Response:**
```json
{
  "success": true,
  "message": "Form submitted successfully!"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## AI-Powered Form Scanner

### Overview

The `/scanner-test` page provides an AI-powered testing interface using Google's Gemini API to:

1. **Extract Forms**: Automatically identify all functional forms from HTML
2. **Detect Fields**: Find all input fields with their types, validations, and selectors
3. **Generate Values**: Create realistic test data that satisfies all validations
4. **Calculate Accuracy**: Compare AI results against expected values (13 forms, 89 fields)

### Using the Scanner

1. Navigate to `http://localhost:3000/scanner-test`
2. Click "Extract Forms Only" to see form detection results
3. Click "Complete Analysis" to also generate field values
4. Review the accuracy metrics and detailed comparison

### Scanner Features

- **Smart Form Detection**: Identifies forms with/without `<form>` tags
- **Fake Form Filtering**: Ignores disabled/decorative forms
- **Field Analysis**: Extracts field types, validations, selectors
- **Value Generation**: Creates realistic data matching validation rules
- **Accuracy Scoring**: Compares results against ground truth (13 forms, 89 fields)
- **Visual Dashboard**: Shows form-by-form comparison and confidence levels

### API Usage Examples

**Extract Forms:**
```bash
curl -X POST http://localhost:3000/api/scanner/extract-forms \
  -H "Content-Type: application/json" \
  -d '{"htmlContent": "<html>...</html>"}'
```

**Generate Values:**
```bash
curl -X POST http://localhost:3000/api/scanner/generate-values \
  -H "Content-Type: application/json" \
  -d '{"formData": {"formId": "test", "fields": [...]}}'
```

**Complete Analysis:**
```bash
curl -X POST http://localhost:3000/api/scanner/analyze-complete \
  -H "Content-Type: application/json" \
  -d '{"htmlContent": "<html>...</html>"}'
```

### Prompt Engineering

The scanner uses carefully crafted prompts for:

1. **Form Extraction**: Identifies functional forms, ignores fakes, extracts selectors
2. **Field Analysis**: Detects field types, validations, requirements
3. **Value Generation**: Creates realistic data satisfying all constraints

See `services/gemini.service.js` for full prompt templates.

## Testing Your Form Scanner

Use these forms to test:

1. **Field Detection**: Can your scanner identify all form fields correctly?
2. **Dynamic Fields**: Can it handle conditional fields that appear/disappear?
3. **Multi-Step Forms**: Can it navigate through wizard-style forms?
4. **Noise Resistance**: Can it find forms buried in distracting content?
5. **Error Handling**: Can it retry on failures and handle validation errors?
6. **Field Types**: Does it support text, email, number, date, file, checkbox, radio, select?
7. **Forms Without Form Tags**: Can it detect inputs outside `<form>` tags?
8. **Table-Based Forms**: Can it parse forms embedded in tables?
9. **ContentEditable**: Can it handle inline editing with contenteditable elements?
10. **Auto-Submit**: Can it detect forms that submit on change without buttons?
11. **Hidden Forms**: Can it find and submit hidden forms?
12. **Data Attributes**: Can it collect data from custom attributes?
13. **Modal Forms**: Can it detect and interact with forms in modal popups?
14. **Page Redirects**: Can it handle forms that redirect after submission?
15. **Success Modals**: Can it detect success confirmation overlays?

## Project Structure

```
form-scanner-poc/
├── server.js              # Express server with routes and handlers
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (API keys)
├── .env.example           # Environment template
├── services/
│   └── gemini.service.js  # Gemini AI integration for form extraction
├── routes/
│   └── scanner.routes.js  # Scanner API endpoints
├── public/                # Static HTML files
│   ├── index.html         # Home page
│   ├── simple-form.html
│   ├── conditional-form.html
│   ├── complex-form.html
│   ├── multi-step-form.html
│   ├── noisy-form.html
│   ├── all-forms.html     # 13 forms test suite
│   ├── scanner-test.html  # AI scanner test interface
│   └── success.html       # Success redirect page
└── README.md              # This file
```

## Technologies Used

- **Node.js** - Runtime environment (v18+ for native fetch)
- **Express** - Web framework
- **Body-Parser** - Request parsing middleware
- **Gemini API** - Direct REST API calls for form extraction
- **dotenv** - Environment variable management
- **Vanilla JavaScript** - Frontend form handling
- **CSS3** - Styling with gradients and animations

## No Authentication Required

All forms are publicly accessible without authentication, making them perfect for automated testing.

## Development

The server includes:
- Console logging for all form submissions
- CORS-friendly setup
- JSON and URL-encoded body parsing
- Static file serving from `public/` directory

## License

ISC
