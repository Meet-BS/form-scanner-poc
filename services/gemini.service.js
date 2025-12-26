const fetch = require('node-fetch');
require('dotenv').config();

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        this.apiKey = process.env.GEMINI_API_KEY;
        this.model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    }

    /**
     * Call Gemini API directly
     * @param {string} prompt - The prompt to send
     * @returns {Promise<Object>} - Generated text response with timing
     */
    async callGeminiAPI(prompt) {
        const startTime = Date.now();
        console.log('🤖 [Gemini API] Starting request...');
        
        try {
            console.log('📤 [Gemini API] Sending request to Gemini...');
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1, // Low temperature for consistent, factual responses
                        topP: 0.95,
                        topK: 40,
                        maxOutputTokens: 8192,
                    }
                })
            });

            console.log('📥 [Gemini API] Response received, processing...');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid API response structure');
            }

            const endTime = Date.now();
            const timeTaken = endTime - startTime;

            // Extract token usage information
            const usageMetadata = data.usageMetadata || {};
            const inputTokens = usageMetadata.promptTokenCount || 0;
            const outputTokens = usageMetadata.candidatesTokenCount || 0;
            const totalTokens = usageMetadata.totalTokenCount || (inputTokens + outputTokens);

            // Calculate cost (as of Dec 2024 - Gemini 1.5 Pro pricing)
            // Input: $0.00125 per 1K tokens (up to 128K context)
            // Output: $0.005 per 1K tokens
            const inputCost = (inputTokens / 1000) * 0.00125;
            const outputCost = (outputTokens / 1000) * 0.005;
            const totalCost = inputCost + outputCost;

            console.log(`✅ [Gemini API] Request completed in ${timeTaken}ms`);
            console.log(`📊 [Gemini API] Tokens - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);
            console.log(`💰 [Gemini API] Cost - $${totalCost.toFixed(6)} USD`);

            return {
                text: data.candidates[0].content.parts[0].text,
                timeTaken,
                timestamp: new Date().toISOString(),
                usage: {
                    inputTokens,
                    outputTokens,
                    totalTokens,
                    inputCost: parseFloat(inputCost.toFixed(6)),
                    outputCost: parseFloat(outputCost.toFixed(6)),
                    totalCost: parseFloat(totalCost.toFixed(6))
                }
            };
        } catch (error) {
            const endTime = Date.now();
            const timeTaken = endTime - startTime;
            console.error('❌ [Gemini API] Request failed after', timeTaken + 'ms');
            console.error('Error calling Gemini API:', error);
            error.timeTaken = timeTaken;
            throw error;
        }
    }

    /**
     * Extract forms from HTML content
     * @param {string} htmlContent - The HTML content to analyze
     * @returns {Promise<Object>} - Extracted form information
     */
    async extractForms(htmlContent) {
        console.log('\n🔍 [Extract Forms] Starting form extraction...');
        const prompt = this.buildFormExtractionPrompt(htmlContent);
        
        try {
            const result = await this.callGeminiAPI(prompt);
            console.log('✅ [Extract Forms] AI analysis complete, parsing results...');
            
            // Parse the JSON response
            const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || result.text.match(/```\n([\s\S]*?)\n```/);
            let parsedData;
            
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[1]);
            } else {
                // Try parsing the entire response as JSON
                parsedData = JSON.parse(result.text);
            }
            
            return {
                ...parsedData,
                performance: {
                    timeTaken: result.timeTaken,
                    timestamp: result.timestamp
                },
                usage: result.usage
            };
        } catch (error) {
            console.error('Error extracting forms:', error);
            throw new Error(`Failed to extract forms: ${error.message}`);
        }
    }

    /**
     * Generate field values that satisfy validations
     * @param {Object} formData - Form data with fields
     * @returns {Promise<Object>} - Field values for submission
     */
    async generateFieldValues(formData) {
        console.log(`\n📝 [Generate Values] Starting value generation for form: ${formData.formId || 'unknown'}...`);
        const prompt = this.buildFieldValueGenerationPrompt(formData);
        
        try {
            const result = await this.callGeminiAPI(prompt);
            console.log('✅ [Generate Values] AI generation complete, parsing values...');
            
            // Parse the JSON response
            const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || result.text.match(/```\n([\s\S]*?)\n```/);
            let parsedData;
            
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[1]);
            } else {
                parsedData = JSON.parse(result.text);
            }
            
            return {
                ...parsedData,
                performance: {
                    timeTaken: result.timeTaken,
                    timestamp: result.timestamp
                },
                usage: result.usage
            };
        } catch (error) {
            console.error('Error generating field values:', error);
            throw new Error(`Failed to generate field values: ${error.message}`);
        }
    }

    /**
     * Build prompt for form extraction
     * @param {string} htmlContent - HTML content
     * @returns {string} - Formatted prompt
     */
    buildFormExtractionPrompt(htmlContent) {
        return `You are an expert HTML form analyzer. Your task is to extract ALL FUNCTIONAL forms from the provided HTML content.

CRITICAL INSTRUCTIONS:
1. Identify ONLY functional forms that can actually submit data (ignore disabled/fake forms)
2. A form can be:
   - Traditional <form> tags with submit buttons
   - DIV-based containers with input fields and submit buttons (no <form> tag)
   - Contenteditable elements with save buttons
   - Input fields with data attributes and JavaScript submission
   - Hidden forms that appear on trigger
   - Modal forms that popup
   - Forms inside tables
   - Auto-submit forms (no explicit submit button)

3. IGNORE:
   - Forms with ALL disabled fields
   - Decorative/example forms marked as "not functional", "display only", or "demo"
   - Marketing content, testimonials, statistics
   - Image placeholders and fake content
   - Any form explicitly marked as fake or locked

4. For each functional form, extract:
   - Unique identifier (form ID, container ID, or generated ID)
   - Form type (traditional, formless, modal, hidden, table-based, etc.)
   - CSS selector to locate the form
   - All input fields with their:
     * Field name/identifier
     * Input type (text, email, password, select, textarea, checkbox, radio, etc.)
     * CSS selector to locate the field
     * Whether it's required
     * Validation hints (pattern, min, max, etc.)
     * Placeholder or default value if any
   - Submit mechanism (button selector, auto-submit trigger, etc.)

5. Return results in the following JSON structure:

{
  "summary": {
    "totalFunctionalForms": <number>,
    "totalFields": <number>,
    "formsIgnored": <number>,
    "confidence": <0-100>
  },
  "forms": [
    {
      "formId": "string (unique identifier)",
      "formType": "traditional|formless|modal|hidden|table|dynamic|inline|auto-submit|data-attributes",
      "selector": "CSS selector to locate this form",
      "submitSelector": "CSS selector for submit button/trigger",
      "submitType": "button-click|auto-submit|enter-key",
      "fields": [
        {
          "fieldName": "string (name or data attribute)",
          "fieldType": "text|email|password|tel|number|date|select|textarea|checkbox|radio|file|contenteditable|etc",
          "selector": "CSS selector to locate this field",
          "required": boolean,
          "validation": {
            "pattern": "regex pattern if any",
            "minLength": number,
            "maxLength": number,
            "min": number,
            "max": number,
            "type": "email|url|number|date|etc"
          },
          "placeholder": "string or null",
          "defaultValue": "string or null",
          "options": ["array of options for select/radio/checkbox"] or null
        }
      ],
      "specialFeatures": ["array of special characteristics like 'dynamic-fields', 'multi-step', 'conditional', etc"]
    }
  ]
}

HTML CONTENT TO ANALYZE:
${htmlContent}

Return ONLY the JSON response, no additional text or explanation.`;
    }

    /**
     * Build prompt for field value generation
     * @param {Object} formData - Form data
     * @returns {string} - Formatted prompt
     */
    buildFieldValueGenerationPrompt(formData) {
        return `You are an expert at generating realistic test data for form submissions. Your task is to generate valid values for all fields in the provided form that will pass ALL validations.

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

Return ONLY the JSON response, no additional text or explanation.`;
    }

    /**
     * Comprehensive form analysis - extract forms and generate values
     * @param {string} htmlContent - HTML content
     * @returns {Promise<Object>} - Complete analysis with forms and suggested values
     */
    async analyzeFormsComplete(htmlContent) {
        console.log('\n🎯 [Complete Analysis] Starting complete form analysis...');
        const overallStartTime = Date.now();
        
        try {
            // Step 1: Extract forms
            const extractionStartTime = Date.now();
            const formsData = await this.extractForms(htmlContent);
            const extractionTime = Date.now() - extractionStartTime;
            
            // Step 2: Generate values for each form
            console.log(`🔄 [Complete Analysis] Generating values for ${formsData.forms.length} forms...`);
            const valueGenerationStartTime = Date.now();
            const formsWithValues = await Promise.all(
                formsData.forms.map(async (form) => {
                    try {
                        const values = await this.generateFieldValues(form);
                        return {
                            ...form,
                            suggestedValues: values.values,
                            validationStatus: values.metadata,
                            valueGenerationPerformance: {
                                ...values.performance,
                                usage: values.usage
                            }
                        };
                    } catch (error) {
                        console.error(`Error generating values for form ${form.formId}:`, error);
                        return {
                            ...form,
                            suggestedValues: null,
                            validationStatus: { error: error.message }
                        };
                    }
                })
            );
            const valueGenerationTime = Date.now() - valueGenerationStartTime;
            const totalTime = Date.now() - overallStartTime;

            console.log(`✅ [Complete Analysis] Analysis complete in ${totalTime}ms!\n`);

            // Calculate total usage across all API calls
            const totalUsage = formsWithValues.reduce((acc, form) => {
                if (form.valueGenerationPerformance?.usage) {
                    acc.inputTokens += form.valueGenerationPerformance.usage.inputTokens || 0;
                    acc.outputTokens += form.valueGenerationPerformance.usage.outputTokens || 0;
                    acc.totalTokens += form.valueGenerationPerformance.usage.totalTokens || 0;
                    acc.inputCost += form.valueGenerationPerformance.usage.inputCost || 0;
                    acc.outputCost += form.valueGenerationPerformance.usage.outputCost || 0;
                    acc.totalCost += form.valueGenerationPerformance.usage.totalCost || 0;
                }
                return acc;
            }, {
                inputTokens: formsData.usage?.inputTokens || 0,
                outputTokens: formsData.usage?.outputTokens || 0,
                totalTokens: formsData.usage?.totalTokens || 0,
                inputCost: formsData.usage?.inputCost || 0,
                outputCost: formsData.usage?.outputCost || 0,
                totalCost: formsData.usage?.totalCost || 0
            });

            return {
                ...formsData,
                forms: formsWithValues,
                timestamp: new Date().toISOString(),
                performance: {
                    extractionTime,
                    valueGenerationTime,
                    totalTime,
                    averageTimePerForm: Math.round(valueGenerationTime / formsData.forms.length)
                },
                totalUsage: {
                    ...totalUsage,
                    inputCost: parseFloat(totalUsage.inputCost.toFixed(6)),
                    outputCost: parseFloat(totalUsage.outputCost.toFixed(6)),
                    totalCost: parseFloat(totalUsage.totalCost.toFixed(6))
                }
            };
        } catch (error) {
            console.error('Error in complete form analysis:', error);
            throw error;
        }
    }
}

module.exports = new GeminiService();
