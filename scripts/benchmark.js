#!/usr/bin/env node

/**
 * Form Scanner Benchmark Script
 * 
 * This script tests form extraction on multiple websites to analyze:
 * - Consistency of extraction across different sites
 * - Performance metrics (response time)
 * - Token usage (input/output tokens)
 * - Cost analysis
 * - Success rates and error patterns
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// Test websites - diverse set of sites with forms
const TEST_WEBSITES = [
    { name: 'BrowserStack Contact', url: 'https://www.browserstack.com/contact?ref=footer' },
    { name: 'RatedPower Demo', url: 'https://ratedpower.com/request-demo/' },
    { name: 'Salesforce Demo', url: 'https://www.salesforce.com/ap/form/demo/request-a-demo/' },
    { name: 'LinkedIn Sales Demo', url: 'https://business.linkedin.com/sales-solutions/request-free-demo-form-b' },
    { name: 'Greenhouse Demo', url: 'https://www.greenhouse.com/uk/demo' },
    { name: 'Zendesk Contact', url: 'https://www.zendesk.com/in/contact' },
    { name: 'BrowserStack Slack Help', url: 'https://browserstack.slack.com/intl/en-in/help/requests/new' },
    { name: 'Local Test Forms', url: 'http://localhost:3000/all-forms' }
];

const API_BASE_URL = 'http://localhost:3000';
const RESULTS_DIR = path.join(__dirname, '../benchmark-results');
const NUM_RUNS = 10; // Number of times to run each website for consistency testing

/**
 * Fetch HTML from a URL
 */
async function fetchWebsite(url) {
    console.log(`\n📥 Fetching: ${url}`);
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/scanner/fetch-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const fetchTime = Date.now() - startTime;
        
        console.log(`✅ Fetched in ${fetchTime}ms (${data.data.length} chars)`);
        
        return {
            success: true,
            htmlContent: data.data.htmlContent,
            htmlLength: data.data.length,
            fetchTime
        };
    } catch (error) {
        const fetchTime = Date.now() - startTime;
        console.error(`❌ Fetch failed: ${error.message}`);
        
        return {
            success: false,
            error: error.message,
            fetchTime
        };
    }
}

/**
 * Analyze forms using Gemini API
 */
async function analyzeWebsite(htmlContent) {
    console.log(`🤖 Starting Gemini analysis...`);
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/scanner/analyze-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ htmlContent })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        const analysisTime = Date.now() - startTime;
        
        console.log(`✅ Analysis complete in ${analysisTime}ms`);
        console.log(`   Forms found: ${result.data.summary.totalFunctionalForms}`);
        console.log(`   Fields found: ${result.data.summary.totalFields}`);
        console.log(`   Input tokens: ${result.data.totalUsage.inputTokens}`);
        console.log(`   Output tokens: ${result.data.totalUsage.outputTokens}`);
        console.log(`   Cost: $${result.data.totalUsage.totalCost.toFixed(6)}`);
        
        return {
            success: true,
            data: result.data,
            analysisTime
        };
    } catch (error) {
        const analysisTime = Date.now() - startTime;
        console.error(`❌ Analysis failed: ${error.message}`);
        
        return {
            success: false,
            error: error.message,
            analysisTime
        };
    }
}

/**
 * Run benchmark for a single website
 */
async function benchmarkWebsite(website, index, total) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 [${index + 1}/${total}] Testing: ${website.name}`);
    console.log(`${'='.repeat(80)}`);
    
    const result = {
        name: website.name,
        url: website.url,
        timestamp: new Date().toISOString(),
        fetch: {},
        analysis: {}
    };

    // Step 1: Fetch HTML
    const fetchResult = await fetchWebsite(website.url);
    result.fetch = fetchResult;

    if (!fetchResult.success) {
        console.log(`⏭️  Skipping analysis due to fetch failure`);
        return result;
    }

    // Step 2: Analyze with Gemini
    const analysisResult = await analyzeWebsite(fetchResult.htmlContent);
    result.analysis = analysisResult;

    // Calculate totals
    if (analysisResult.success) {
        result.totalTime = fetchResult.fetchTime + analysisResult.analysisTime;
        result.summary = {
            forms: analysisResult.data.summary.totalFunctionalForms,
            fields: analysisResult.data.summary.totalFields,
            formsIgnored: analysisResult.data.summary.formsIgnored,
            confidence: analysisResult.data.summary.confidence
        };
        result.tokens = {
            input: analysisResult.data.totalUsage.inputTokens,
            output: analysisResult.data.totalUsage.outputTokens,
            total: analysisResult.data.totalUsage.totalTokens
        };
        result.cost = analysisResult.data.totalUsage.totalCost;
        result.performance = {
            fetchTime: fetchResult.fetchTime,
            analysisTime: analysisResult.analysisTime,
            totalTime: result.totalTime
        };
    }

    return result;
}

/**
 * Calculate statistics from results
 */
function calculateStatistics(results) {
    const successful = results.filter(r => r.analysis.success);
    const failed = results.filter(r => !r.fetch.success || !r.analysis.success);

    if (successful.length === 0) {
        return {
            totalTests: results.length,
            successful: 0,
            failed: failed.length,
            successRate: 0,
            error: 'No successful tests to analyze'
        };
    }

    // Token statistics
    const inputTokens = successful.map(r => r.tokens.input);
    const outputTokens = successful.map(r => r.tokens.output);
    const totalTokens = successful.map(r => r.tokens.total);

    // Performance statistics
    const fetchTimes = successful.map(r => r.performance.fetchTime);
    const analysisTimes = successful.map(r => r.performance.analysisTime);
    const totalTimes = successful.map(r => r.performance.totalTime);

    // Cost statistics
    const costs = successful.map(r => r.cost);

    // Form statistics
    const formsCounts = successful.map(r => r.summary.forms);
    const fieldsCounts = successful.map(r => r.summary.fields);

    const stats = {
        totalTests: results.length,
        successful: successful.length,
        failed: failed.length,
        successRate: ((successful.length / results.length) * 100).toFixed(2) + '%',
        
        tokens: {
            input: calculateMetrics(inputTokens),
            output: calculateMetrics(outputTokens),
            total: calculateMetrics(totalTokens)
        },
        
        performance: {
            fetch: calculateMetrics(fetchTimes),
            analysis: calculateMetrics(analysisTimes),
            total: calculateMetrics(totalTimes)
        },
        
        cost: {
            ...calculateMetrics(costs),
            totalCost: costs.reduce((sum, c) => sum + c, 0).toFixed(6)
        },
        
        forms: {
            formsFound: calculateMetrics(formsCounts),
            fieldsFound: calculateMetrics(fieldsCounts),
            totalForms: formsCounts.reduce((sum, c) => sum + c, 0),
            totalFields: fieldsCounts.reduce((sum, c) => sum + c, 0)
        }
    };

    return stats;
}

/**
 * Calculate min, max, avg, median, stddev for a dataset
 */
function calculateMetrics(values) {
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    
    // Calculate standard deviation
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    // Calculate median
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: parseFloat(avg.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2))
    };
}

/**
 * Generate detailed analysis report
 */
function generateReport(results, statistics) {
    let report = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                     FORM SCANNER BENCHMARK REPORT                              ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Generated: ${new Date().toISOString()}
Total Tests: ${statistics.totalTests}
Success Rate: ${statistics.successRate}

╔═══════════════════════════════════════════════════════════════════════════════╗
║                             PERFORMANCE METRICS                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Fetch Time (ms):
  Min: ${statistics.performance.fetch.min}
  Max: ${statistics.performance.fetch.max}
  Avg: ${statistics.performance.fetch.avg}
  Median: ${statistics.performance.fetch.median}
  StdDev: ${statistics.performance.fetch.stdDev}

Analysis Time (ms):
  Min: ${statistics.performance.analysis.min}
  Max: ${statistics.performance.analysis.max}
  Avg: ${statistics.performance.analysis.avg}
  Median: ${statistics.performance.analysis.median}
  StdDev: ${statistics.performance.analysis.stdDev}

Total Time (ms):
  Min: ${statistics.performance.total.min}
  Max: ${statistics.performance.total.max}
  Avg: ${statistics.performance.total.avg}
  Median: ${statistics.performance.total.median}
  StdDev: ${statistics.performance.total.stdDev}

╔═══════════════════════════════════════════════════════════════════════════════╗
║                              TOKEN USAGE                                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Input Tokens:
  Min: ${statistics.tokens.input.min}
  Max: ${statistics.tokens.input.max}
  Avg: ${statistics.tokens.input.avg}
  Median: ${statistics.tokens.input.median}
  StdDev: ${statistics.tokens.input.stdDev}

Output Tokens:
  Min: ${statistics.tokens.output.min}
  Max: ${statistics.tokens.output.max}
  Avg: ${statistics.tokens.output.avg}
  Median: ${statistics.tokens.output.median}
  StdDev: ${statistics.tokens.output.stdDev}

Total Tokens:
  Min: ${statistics.tokens.total.min}
  Max: ${statistics.tokens.total.max}
  Avg: ${statistics.tokens.total.avg}
  Median: ${statistics.tokens.total.median}
  StdDev: ${statistics.tokens.total.stdDev}

╔═══════════════════════════════════════════════════════════════════════════════╗
║                               COST ANALYSIS                                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Cost per Request ($):
  Min: $${statistics.cost.min.toFixed(6)}
  Max: $${statistics.cost.max.toFixed(6)}
  Avg: $${statistics.cost.avg.toFixed(6)}
  Median: $${statistics.cost.median.toFixed(6)}
  StdDev: $${statistics.cost.stdDev.toFixed(6)}

Total Cost: $${statistics.cost.totalCost}

╔═══════════════════════════════════════════════════════════════════════════════╗
║                            EXTRACTION RESULTS                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Forms Found:
  Min: ${statistics.forms.formsFound.min}
  Max: ${statistics.forms.formsFound.max}
  Avg: ${statistics.forms.formsFound.avg}
  Median: ${statistics.forms.formsFound.median}
  Total: ${statistics.forms.totalForms}

Fields Found:
  Min: ${statistics.forms.fieldsFound.min}
  Max: ${statistics.forms.fieldsFound.max}
  Avg: ${statistics.forms.fieldsFound.avg}
  Median: ${statistics.forms.fieldsFound.median}
  Total: ${statistics.forms.totalFields}

╔═══════════════════════════════════════════════════════════════════════════════╗
║                          INDIVIDUAL TEST RESULTS                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`;

    results.forEach((result, index) => {
        report += `\n${index + 1}. ${result.name} (${result.url})\n`;
        report += `   Status: ${result.analysis.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
        
        if (result.analysis.success) {
            report += `   Forms: ${result.summary.forms} | Fields: ${result.summary.fields}\n`;
            report += `   Tokens: ${result.tokens.input}→${result.tokens.output} (${result.tokens.total} total)\n`;
            report += `   Time: ${result.performance.fetchTime}ms fetch + ${result.performance.analysisTime}ms analysis = ${result.performance.totalTime}ms\n`;
            report += `   Cost: $${result.cost.toFixed(6)}\n`;
            report += `   Confidence: ${result.summary.confidence}\n`;
        } else {
            report += `   Error: ${result.fetch.error || result.analysis.error}\n`;
        }
    });

    report += `\n${'═'.repeat(79)}\n`;
    
    return report;
}

/**
 * Main benchmark execution
 */
async function runBenchmark() {
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              FORM SCANNER BENCHMARK - STARTING                                ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');
    console.log(`Testing ${TEST_WEBSITES.length} websites × ${NUM_RUNS} runs = ${TEST_WEBSITES.length * NUM_RUNS} total tests\n`);

    // Ensure results directory exists
    try {
        await fs.mkdir(RESULTS_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create results directory:', error);
    }

    const allResults = [];
    const startTime = Date.now();

    // Run each website NUM_RUNS times for consistency testing
    for (let run = 1; run <= NUM_RUNS; run++) {
        console.log(`\n\n╔═══════════════════════════════════════════════════════════════════════════════╗`);
        console.log(`║                              RUN ${run} of ${NUM_RUNS}                                      ║`);
        console.log(`╚═══════════════════════════════════════════════════════════════════════════════╝\n`);

        for (let i = 0; i < TEST_WEBSITES.length; i++) {
            const result = await benchmarkWebsite(TEST_WEBSITES[i], i, TEST_WEBSITES.length);
            result.runNumber = run; // Add run number to result
            allResults.push(result);
            
            // Brief pause between tests
            if (i < TEST_WEBSITES.length - 1 || run < NUM_RUNS) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    const totalTime = Date.now() - startTime;

    console.log('\n\n╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              BENCHMARK COMPLETE - GENERATING REPORT                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

    // Calculate statistics
    const statistics = calculateStatistics(allResults);

    // Calculate consistency metrics (variance across runs for each website)
    const consistencyMetrics = calculateConsistency(allResults);

    // Generate report
    const report = generateReport(allResults, statistics);
    console.log(report);

    // Save results to files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save raw JSON results with all runs
    const jsonFile = path.join(RESULTS_DIR, `benchmark-${timestamp}.json`);
    await fs.writeFile(jsonFile, JSON.stringify({
        metadata: {
            timestamp: new Date().toISOString(),
            totalTime,
            totalTests: allResults.length,
            numWebsites: TEST_WEBSITES.length,
            runsPerWebsite: NUM_RUNS,
            version: '1.0.0'
        },
        results: allResults,
        statistics,
        consistencyMetrics
    }, null, 2));
    console.log(`\n💾 Raw results saved to: ${jsonFile}`);

    // Save text report
    const reportFile = path.join(RESULTS_DIR, `benchmark-${timestamp}.txt`);
    await fs.writeFile(reportFile, report);
    console.log(`📄 Report saved to: ${reportFile}`);

    // Save detailed CSV with all runs
    const csvFile = path.join(RESULTS_DIR, `benchmark-${timestamp}.csv`);
    const csvData = generateCSV(allResults);
    await fs.writeFile(csvFile, csvData);
    console.log(`📊 Detailed CSV saved to: ${csvFile}`);

    // Save consistency analysis CSV
    const consistencyCsvFile = path.join(RESULTS_DIR, `benchmark-consistency-${timestamp}.csv`);
    const consistencyCsvData = generateConsistencyCSV(consistencyMetrics);
    await fs.writeFile(consistencyCsvFile, consistencyCsvData);
    console.log(`📈 Consistency CSV saved to: ${consistencyCsvFile}`);

    console.log('\n✅ Benchmark complete!\n');
}

/**
 * Generate CSV summary
 */
function generateCSV(results) {
    let csv = 'Run,Name,URL,Status,Forms,Fields,Input Tokens,Output Tokens,Total Tokens,Cost,Fetch Time,Analysis Time,Total Time,Confidence\n';
    
    results.forEach(result => {
        const status = result.analysis.success ? 'SUCCESS' : 'FAILED';
        const forms = result.summary?.forms || 0;
        const fields = result.summary?.fields || 0;
        const inputTokens = result.tokens?.input || 0;
        const outputTokens = result.tokens?.output || 0;
        const totalTokens = result.tokens?.total || 0;
        const cost = result.cost?.toFixed(6) || 0;
        const fetchTime = result.performance?.fetchTime || 0;
        const analysisTime = result.performance?.analysisTime || 0;
        const totalTime = result.performance?.totalTime || 0;
        const confidence = result.summary?.confidence || '';
        const run = result.runNumber || 1;
        
        csv += `${run},"${result.name}","${result.url}",${status},${forms},${fields},${inputTokens},${outputTokens},${totalTokens},${cost},${fetchTime},${analysisTime},${totalTime},${confidence}\n`;
    });
    
    return csv;
}

/**
 * Calculate consistency metrics across multiple runs for each website
 */
function calculateConsistency(results) {
    const websiteGroups = {};
    
    // Group results by website
    results.forEach(result => {
        if (!websiteGroups[result.name]) {
            websiteGroups[result.name] = [];
        }
        websiteGroups[result.name].push(result);
    });
    
    const consistencyMetrics = {};
    
    // Calculate consistency for each website
    Object.keys(websiteGroups).forEach(websiteName => {
        const runs = websiteGroups[websiteName].filter(r => r.analysis.success);
        
        if (runs.length === 0) {
            consistencyMetrics[websiteName] = {
                totalRuns: websiteGroups[websiteName].length,
                successfulRuns: 0,
                failedRuns: websiteGroups[websiteName].length,
                error: 'All runs failed'
            };
            return;
        }
        
        // Extract metrics across runs
        const formCounts = runs.map(r => r.summary.forms);
        const fieldCounts = runs.map(r => r.summary.fields);
        const inputTokens = runs.map(r => r.tokens.input);
        const outputTokens = runs.map(r => r.tokens.output);
        const costs = runs.map(r => r.cost);
        const analysisTimes = runs.map(r => r.performance.analysisTime);
        
        consistencyMetrics[websiteName] = {
            totalRuns: websiteGroups[websiteName].length,
            successfulRuns: runs.length,
            failedRuns: websiteGroups[websiteName].length - runs.length,
            
            forms: {
                ...calculateMetrics(formCounts),
                allValues: formCounts,
                isConsistent: new Set(formCounts).size === 1
            },
            
            fields: {
                ...calculateMetrics(fieldCounts),
                allValues: fieldCounts,
                isConsistent: new Set(fieldCounts).size === 1
            },
            
            inputTokens: {
                ...calculateMetrics(inputTokens),
                variance: calculateVariance(inputTokens)
            },
            
            outputTokens: {
                ...calculateMetrics(outputTokens),
                variance: calculateVariance(outputTokens)
            },
            
            cost: {
                ...calculateMetrics(costs),
                variance: calculateVariance(costs)
            },
            
            analysisTime: {
                ...calculateMetrics(analysisTimes),
                variance: calculateVariance(analysisTimes)
            }
        };
    });
    
    return consistencyMetrics;
}

/**
 * Calculate variance for consistency analysis
 */
function calculateVariance(values) {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return parseFloat(variance.toFixed(2));
}

/**
 * Generate consistency analysis CSV
 */
function generateConsistencyCSV(consistencyMetrics) {
    let csv = 'Website,Total Runs,Successful,Failed,Forms Min,Forms Max,Forms Avg,Forms StdDev,Forms Consistent,Fields Min,Fields Max,Fields Avg,Fields StdDev,Fields Consistent,Input Tokens Avg,Input Tokens StdDev,Output Tokens Avg,Output Tokens StdDev,Cost Avg,Cost StdDev,Analysis Time Avg,Analysis Time StdDev\n';
    
    Object.keys(consistencyMetrics).forEach(websiteName => {
        const metrics = consistencyMetrics[websiteName];
        
        if (metrics.error) {
            csv += `"${websiteName}",${metrics.totalRuns},${metrics.successfulRuns},${metrics.failedRuns},0,0,0,0,FALSE,0,0,0,0,FALSE,0,0,0,0,0,0,0,0\n`;
            return;
        }
        
        csv += `"${websiteName}",`;
        csv += `${metrics.totalRuns},${metrics.successfulRuns},${metrics.failedRuns},`;
        csv += `${metrics.forms.min},${metrics.forms.max},${metrics.forms.avg},${metrics.forms.stdDev},${metrics.forms.isConsistent ? 'TRUE' : 'FALSE'},`;
        csv += `${metrics.fields.min},${metrics.fields.max},${metrics.fields.avg},${metrics.fields.stdDev},${metrics.fields.isConsistent ? 'TRUE' : 'FALSE'},`;
        csv += `${metrics.inputTokens.avg},${metrics.inputTokens.stdDev},`;
        csv += `${metrics.outputTokens.avg},${metrics.outputTokens.stdDev},`;
        csv += `${metrics.cost.avg.toFixed(6)},${metrics.cost.stdDev.toFixed(6)},`;
        csv += `${metrics.analysisTime.avg},${metrics.analysisTime.stdDev}\n`;
    });
    
    return csv;
}

// Run the benchmark
if (require.main === module) {
    runBenchmark().catch(error => {
        console.error('\n❌ Benchmark failed:', error);
        process.exit(1);
    });
}

module.exports = { runBenchmark };
