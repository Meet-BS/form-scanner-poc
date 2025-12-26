# Form Scanner Benchmark

This script tests form extraction across 10 diverse websites to analyze consistency, performance, and token usage.

## Features

- **Multi-Website Testing**: Tests 10 popular websites (GitHub, Stack Overflow, Reddit, Twitter, LinkedIn, etc.)
- **Comprehensive Metrics**: Tracks performance, token usage, cost, and extraction results
- **Statistical Analysis**: Calculates min, max, average, median, and standard deviation
- **Multiple Output Formats**: JSON (raw data), TXT (formatted report), CSV (spreadsheet-ready)
- **Error Handling**: Gracefully handles failed requests and continues testing

## Usage

### Prerequisites

Make sure the server is running:
```bash
npm start
```

### Run Benchmark

In a separate terminal:
```bash
npm run benchmark
```

Or directly:
```bash
node scripts/benchmark.js
```

## Metrics Collected

### Performance
- Fetch time (HTML download)
- Analysis time (Gemini processing)
- Total time per website

### Token Usage
- Input tokens (HTML sent to Gemini)
- Output tokens (JSON response from Gemini)
- Total tokens per request

### Cost Analysis
- Cost per request
- Total cost for all tests
- Cost statistics (min/max/avg/median)

### Extraction Results
- Number of forms found
- Number of fields extracted
- Forms ignored (fake/disabled)
- Confidence scores

### Consistency Analysis
- Standard deviation for all metrics
- Success rate across websites
- Error patterns

## Output Files

All results are saved to `benchmark-results/` directory with timestamps:

- `benchmark-YYYY-MM-DD-HHMMSS.json` - Raw data with full details
- `benchmark-YYYY-MM-DD-HHMMSS.txt` - Formatted report
- `benchmark-YYYY-MM-DD-HHMMSS.csv` - Spreadsheet-ready data

## Test Websites

1. **GitHub Login** - Authentication form
2. **Stack Overflow** - Community site with search/login
3. **Reddit** - Social media with multiple forms
4. **Twitter/X** - Login flow
5. **LinkedIn** - Professional network
6. **Medium** - Publishing platform
7. **Dev.to** - Developer community
8. **Product Hunt** - Product discovery
9. **Hacker News** - Tech news aggregator
10. **Google Forms** - Form builder landing page

## Example Output

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                     FORM SCANNER BENCHMARK REPORT                              ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Generated: 2025-12-02T11:30:00.000Z
Total Tests: 10
Success Rate: 90.00%

Performance Metrics:
  Fetch Time - Min: 245ms | Max: 1823ms | Avg: 892ms | Median: 765ms
  Analysis Time - Min: 8234ms | Max: 45123ms | Avg: 18456ms | Median: 15234ms
  
Token Usage:
  Input Tokens - Min: 15234 | Max: 98456 | Avg: 45678
  Output Tokens - Min: 1234 | Max: 8456 | Avg: 3456
  
Cost Analysis:
  Per Request - Min: $0.000234 | Max: $0.002345 | Avg: $0.001123
  Total Cost: $0.011234
```

## Customization

Edit `TEST_WEBSITES` array in `scripts/benchmark.js` to test different websites:

```javascript
const TEST_WEBSITES = [
    { name: 'Your Site', url: 'https://example.com' },
    // Add more websites...
];
```

## Notes

- Tests run sequentially with 2-second delays to avoid rate limiting
- Failed fetches are logged but don't stop the benchmark
- Large HTML pages may take longer to analyze
- Token usage varies significantly based on page size and complexity
