const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini.service');
const htmlFetcherService = require('../services/html-fetcher.service');

/**
 * POST /api/scanner/extract-forms
 * Extract forms from HTML content
 */
router.post('/extract-forms', async (req, res) => {
    try {
        const { htmlContent } = req.body;

        if (!htmlContent) {
            return res.status(400).json({
                success: false,
                error: 'HTML content is required'
            });
        }

        const result = await geminiService.extractForms(htmlContent);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in extract-forms:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scanner/generate-values
 * Generate field values for a form
 */
router.post('/generate-values', async (req, res) => {
    try {
        const { formData } = req.body;

        if (!formData) {
            return res.status(400).json({
                success: false,
                error: 'Form data is required'
            });
        }

        const result = await geminiService.generateFieldValues(formData);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generate-values:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scanner/analyze-complete
 * Complete analysis: extract forms and generate values
 */
router.post('/analyze-complete', async (req, res) => {
    try {
        const { htmlContent } = req.body;

        if (!htmlContent) {
            return res.status(400).json({
                success: false,
                error: 'HTML content is required'
            });
        }

        const result = await geminiService.analyzeFormsComplete(htmlContent);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in analyze-complete:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/scanner/test-page
 * Get the all-forms page HTML for testing
 */
router.get('/test-page', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        
        const htmlPath = path.join(__dirname, '../public/all-forms.html');
        const htmlContent = await fs.readFile(htmlPath, 'utf-8');

        res.json({
            success: true,
            data: {
                htmlContent,
                length: htmlContent.length
            }
        });
    } catch (error) {
        console.error('Error reading test page:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scanner/fetch-url
 * Fetch HTML content from a URL (including iframes)
 */
router.post('/fetch-url', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format'
            });
        }

        // Fetch with iframe extraction
        const result = await htmlFetcherService.fetchWithIframes(url);
        
        console.log(`✅ Fetched ${result.combinedHtml.length} characters from ${url} (including ${result.stats.successfulIframes} iframes)`);

        res.json({
            success: true,
            data: {
                htmlContent: result.combinedHtml,
                length: result.combinedHtml.length,
                url: url,
                iframeStats: result.stats
            }
        });
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scanner/analyze-url
 * Fetch URL and analyze forms in one step (including iframes)
 */
router.post('/analyze-url', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format'
            });
        }

        console.log(`\n🌐 Fetching and analyzing URL: ${url}`);
        
        // Fetch with iframe extraction
        const fetchResult = await htmlFetcherService.fetchWithIframes(url);
        console.log(`✅ Fetched ${fetchResult.combinedHtml.length} characters (${fetchResult.stats.successfulIframes} iframes), starting analysis...`);

        // Analyze with Gemini
        const result = await geminiService.analyzeFormsComplete(fetchResult.combinedHtml);

        res.json({
            success: true,
            data: {
                ...result,
                sourceUrl: url,
                htmlLength: fetchResult.combinedHtml.length,
                iframeStats: fetchResult.stats
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error analyzing URL:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
