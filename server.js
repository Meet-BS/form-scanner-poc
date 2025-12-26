const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for large HTML content
app.use(express.static('public'));

// Import routes
const scannerRoutes = require('./routes/scanner.routes');

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/simple-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'simple-form.html'));
});

// Alternative path to same simple form (for cache testing)
app.get('/contact-us', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'simple-form.html'));
});

app.get('/conditional-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'conditional-form.html'));
});

app.get('/complex-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'complex-form.html'));
});

app.get('/multi-step-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'multi-step-form.html'));
});

app.get('/noisy-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'noisy-form.html'));
});

app.get('/all-forms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'all-forms.html'));
});

// New standalone advanced forms
app.get('/wizard-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'wizard-form.html'));
});

app.get('/shadow-dom-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shadow-dom-form.html'));
});

app.get('/nested-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'nested-form.html'));
});

app.get('/collection-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'collection-form.html'));
});

app.get('/aria-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'aria-form.html'));
});

app.get('/conditional-disabled-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'conditional-disabled-form.html'));
});

app.get('/autosave-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'autosave-form.html'));
});

app.get('/masked-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'masked-form.html'));
});

app.get('/grid-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'grid-form.html'));
});

app.get('/multi-form-wizard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'multi-form-wizard.html'));
});

app.get('/rtl-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rtl-form.html'));
});

// Labs hub and exotic forms
app.get('/labs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'labs-index.html'));
});

app.get('/enter-key-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'enter-key-form.html'));
});

app.get('/runtime-created-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'runtime-created-form.html'));
});

app.get('/nested-forms-weird', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'nested-forms-weird.html'));
});

app.get('/mixed-shadow-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mixed-shadow-form.html'));
});

app.get('/scanner-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scanner-test.html'));
});

// Alternative path to duplicate-path-test (for cache testing)
app.get('/duplicate-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'duplicate-path-test.html'));
});

// API Routes
app.use('/api/scanner', scannerRoutes);

// Form submission handlers

// Simple form - always succeeds
app.post('/api/submit-simple', (req, res) => {
  console.log('Simple form submitted:', req.body);
  res.json({ success: true, message: 'Form submitted successfully!' });
});

// Conditional form - succeeds if specific conditions met
app.post('/api/submit-conditional', (req, res) => {
  console.log('Conditional form submitted:', req.body);
  
  // Fail if age is under 18
  if (req.body.age && parseInt(req.body.age) < 18) {
    return res.status(400).json({ success: false, message: 'You must be 18 or older' });
  }
  
  res.json({ success: true, message: 'Registration successful!' });
});

// Complex form - random success/failure
app.post('/api/submit-complex', (req, res) => {
  console.log('Complex form submitted:', req.body);
  
  // 70% success rate
//   const random = Math.random();
//   if (random > 0.7) {
//     return res.status(500).json({ success: false, message: 'Server error: Please try again later' });
//   }
  
  res.json({ success: true, message: 'Application submitted successfully!', applicationId: Math.floor(Math.random() * 100000) });
});

// Multi-step form - validates each step
app.post('/api/submit-multistep', (req, res) => {
  console.log('Multi-step form submitted:', req.body);
  
  // Validate required fields
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  
  if (!req.body.address || !req.body.city) {
    return res.status(400).json({ success: false, message: 'Address information is incomplete' });
  }
  
  res.json({ success: true, message: 'Account created successfully!' });
});

// Noisy form - hidden validation
app.post('/api/submit-noisy', (req, res) => {
  console.log('Noisy form submitted:', req.body);
  
  // Must agree to terms
  if (req.body.terms !== 'on' && req.body.terms !== 'true') {
    return res.status(400).json({ success: false, message: 'You must agree to the terms and conditions' });
  }
  
  res.json({ success: true, message: 'Subscription confirmed!' });
});

// All forms page - universal handler
app.post('/api/submit-all-forms', (req, res) => {
  console.log('All-forms page submission:', req.body);
  
  const formName = req.body.formName || 'Unknown Form';
  
  // Random 20% failure rate to test error handling
  const random = Math.random();
//   if (random > 0.8) {
//     return res.status(500).json({ 
//       success: false, 
//       message: `${formName}: Random server error occurred. Please try again.` 
//     });
//   }
  
  res.json({ 
    success: true, 
    message: `${formName} submitted successfully!`,
    receivedData: Object.keys(req.body).length + ' fields received'
  });
});

// Redirect form - returns confirmation ID
app.post('/api/submit-redirect', (req, res) => {
  console.log('Redirect form submission:', req.body);
  
  // Generate confirmation ID
  const confirmationId = 'CNF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  res.json({ 
    success: true, 
    message: 'Form submitted successfully!',
    confirmationId: confirmationId
  });
});

// Wizard standalone form
app.post('/api/submit-wizard-form', (req, res) => {
  console.log('Wizard form submitted:', req.body);
  res.json({ success: true, message: 'Wizard form captured for QA.' });
});

// Shadow DOM embedded form
app.post('/api/submit-shadow-form', (req, res) => {
  console.log('Shadow DOM form submitted:', req.body);
  res.json({ success: true, message: 'Shadow DOM form captured for QA.' });
});

// Deeply nested form
app.post('/api/submit-nested-form', (req, res) => {
  console.log('Nested form submitted:', req.body);
  res.json({ success: true, message: 'Nested form captured for QA.' });
});

// Collection / repeated groups form
app.post('/api/submit-collection-form', (req, res) => {
  console.log('Collection form submitted:', req.body);
  res.json({ success: true, message: 'Collection form captured for QA.' });
});

// ARIA-driven accessible form
app.post('/api/submit-aria-form', (req, res) => {
  console.log('ARIA form submitted:', req.body);
  res.json({ success: true, message: 'ARIA form captured for QA.' });
});

// Conditional / disabled fields form
app.post('/api/submit-conditional-disabled', (req, res) => {
  console.log('Conditional/disabled form submitted:', req.body);
  res.json({ success: true, message: 'Conditional/disabled form captured for QA.' });
});

// Autosave profile (no submit button)
app.post('/api/autosave-profile', (req, res) => {
  console.log('Autosave profile payload:', req.body);
  res.json({ success: true, message: 'Draft saved.' });
});

// Masked / formatted inputs form
app.post('/api/submit-masked-form', (req, res) => {
  console.log('Masked form submitted:', req.body);
  res.json({ success: true, message: 'Masked form captured for QA.' });
});

// Multi-column grid form
app.post('/api/submit-grid-form', (req, res) => {
  console.log('Grid form submitted:', req.body);
  res.json({ success: true, message: 'Grid form captured for QA.' });
});

// Multi-form wizard steps
app.post('/api/wizard-step-1', (req, res) => {
  console.log('Wizard step 1 submitted:', req.body);
  res.json({ success: true, message: 'Step 1 saved.' });
});

app.post('/api/wizard-step-2', (req, res) => {
  console.log('Wizard step 2 submitted:', req.body);
  res.json({ success: true, message: 'Step 2 saved.' });
});

app.post('/api/wizard-step-3', (req, res) => {
  console.log('Wizard step 3 submitted:', req.body);
  res.json({ success: true, message: 'Signup complete.' });
});

// RTL localized form
app.post('/api/submit-rtl-form', (req, res) => {
  console.log('RTL form submitted:', req.body);
  res.json({ success: true, message: 'تم استلام النموذج بنجاح.' });
});

// Labs / exotic API endpoints
app.post('/api/submit-enter-key-form', (req, res) => {
  console.log('Enter-key form submitted:', req.body);
  res.json({ success: true, message: 'Enter-key form captured for QA.' });
});

app.post('/api/submit-runtime-created-form', (req, res) => {
  console.log('Runtime-created form submitted:', req.body);
  res.json({ success: true, message: 'Runtime-created form captured for QA.' });
});

app.post('/api/submit-nested-forms-weird', (req, res) => {
  console.log('Nested/invalid form submitted:', req.body);
  res.json({ success: true, message: 'Nested/invalid form captured for QA.' });
});

app.post('/api/submit-mixed-shadow-form', (req, res) => {
  console.log('Mixed shadow/light form submitted:', req.body);
  res.json({ success: true, message: 'Mixed shadow/light form captured for QA.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('\nAvailable forms:');
  console.log(`- http://localhost:${PORT}/simple-form`);
  console.log(`- http://localhost:${PORT}/conditional-form`);
  console.log(`- http://localhost:${PORT}/complex-form`);
  console.log(`- http://localhost:${PORT}/multi-step-form`);
  console.log(`- http://localhost:${PORT}/noisy-form`);
  console.log(`- http://localhost:${PORT}/all-forms (10 forms in one page!)`);
});
