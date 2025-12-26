const fetch = require('node-fetch');

/**
 * Service to fetch and process HTML content including iframes
 */
class HtmlFetcherService {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    /**
     * Fetch HTML from URL with iframe extraction
     * @param {string} url - URL to fetch
     * @returns {Promise<Object>} - HTML content with iframes processed
     */
    async fetchWithIframes(url) {
        console.log(`\n🌐 Fetching HTML from: ${url}`);
        
        try {
            // Fetch main page
            const mainHtml = await this.fetchUrl(url);
            
            // Extract iframe sources
            const iframeSrcs = this.extractIframeSrcs(mainHtml, url);
            
            if (iframeSrcs.length === 0) {
                console.log(`   No iframes found`);
                return {
                    mainHtml,
                    iframes: [],
                    combinedHtml: mainHtml
                };
            }
            
            console.log(`   Found ${iframeSrcs.length} iframe(s), fetching content...`);
            
            // Fetch iframe content
            const iframeContents = await Promise.all(
                iframeSrcs.map(async (src, index) => {
                    try {
                        console.log(`   📄 Fetching iframe ${index + 1}: ${src}`);
                        const content = await this.fetchUrl(src);
                        return { src, content, success: true };
                    } catch (error) {
                        console.error(`   ❌ Failed to fetch iframe ${index + 1}: ${error.message}`);
                        return { src, content: '', success: false, error: error.message };
                    }
                })
            );
            
            // Combine all HTML
            const combinedHtml = this.combineHtml(mainHtml, iframeContents);
            
            const successfulIframes = iframeContents.filter(i => i.success).length;
            console.log(`   ✅ Successfully fetched ${successfulIframes}/${iframeSrcs.length} iframes`);
            
            return {
                mainHtml,
                iframes: iframeContents,
                combinedHtml,
                stats: {
                    totalIframes: iframeSrcs.length,
                    successfulIframes,
                    failedIframes: iframeSrcs.length - successfulIframes
                }
            };
        } catch (error) {
            console.error(`❌ Failed to fetch ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Fetch a single URL
     */
    async fetchUrl(url) {
        const response = await fetch(url, {
            headers: {
                'User-Agent': this.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 15000,
            follow: 5 // Follow up to 5 redirects
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
    }

    /**
     * Extract iframe src attributes from HTML
     */
    extractIframeSrcs(html, baseUrl) {
        const iframeSrcs = [];
        const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
        let match;

        while ((match = iframeRegex.exec(html)) !== null) {
            let src = match[1];
            
            // Skip data URIs, javascript:, and about:blank
            if (src.startsWith('data:') || src.startsWith('javascript:') || src === 'about:blank') {
                continue;
            }
            
            // Convert relative URLs to absolute
            if (!src.startsWith('http://') && !src.startsWith('https://')) {
                try {
                    const base = new URL(baseUrl);
                    src = new URL(src, base.origin).href;
                } catch (e) {
                    console.warn(`   ⚠️  Invalid iframe src: ${src}`);
                    continue;
                }
            }
            
            iframeSrcs.push(src);
        }

        return iframeSrcs;
    }

    /**
     * Combine main HTML with iframe contents
     */
    combineHtml(mainHtml, iframeContents) {
        let combined = mainHtml;
        
        // Add a comment separator and append each iframe content
        iframeContents.forEach((iframe, index) => {
            if (iframe.success && iframe.content) {
                combined += `\n\n<!-- ========== IFRAME ${index + 1} CONTENT: ${iframe.src} ========== -->\n\n`;
                combined += iframe.content;
            }
        });
        
        return combined;
    }

    /**
     * Get content from a specific iframe by index
     */
    getIframeContent(iframeContents, index) {
        if (index >= 0 && index < iframeContents.length) {
            return iframeContents[index];
        }
        return null;
    }
}

module.exports = new HtmlFetcherService();
