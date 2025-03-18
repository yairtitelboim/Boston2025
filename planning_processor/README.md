# Enhanced Planning Document Processing

This system processes LA planning documents using advanced transformer models and OpenAI's Response API for improved data extraction.

## OpenAI Response API Integration

The system now integrates OpenAI's structured Response API, which improves extraction quality and ensures valid JSON output.

### Features

- **Structured JSON Output**: Uses the OpenAI Response API's `response_format={"type": "json_object"}` parameter to guarantee valid, structured JSON responses.
- **Cost Controls**: Implements strict API usage limits and token tracking to prevent excessive costs.
- **Usage Reporting**: Tracks API calls, token usage, and estimated costs for transparency.
- **Graceful Fallback**: Falls back to rule-based extraction methods when API limits are reached or when API calls fail.

## Quick Start

Run the planning document processing with OpenAI Response API:

```bash
# Process all planning documents with OpenAI Response API (default limit: 10 API calls)
./process_planning_docs.sh --use-openai

# Process with custom API call limit
./process_planning_docs.sh --use-openai --max-api-calls 5

# Run only a specific stage with API
./process_planning_docs.sh --use-openai --stage 2
```

## Testing OpenAI Response API

You can test the OpenAI Response API extraction on a single document:

```bash
# Test with a sample document
python3 planning_processor/test_openai_response.py --input-file path/to/sample_document.txt --output-dir test_output
```

## Configuration

The system uses API keys from your `.env` file:

- `OPENAI_API_KEY`: Your OpenAI API key for direct access
- `OPENROUTER_API_KEY2`: Alternative OpenRouter API key

## API Usage Tracking

API usage is tracked and logged in:

- `public/processed_planning_docs/api_usage_summary.txt`: Human-readable summary
- `public/processed_planning_docs/api_usage_detailed.json`: Detailed JSON log

## Implementation Details

The OpenAI Response API is integrated in the following components:

1. **API Usage Tracker** (`api_usage_tracker.py`): Monitors API usage, estimates costs, and enforces limits
2. **Structured Data Extraction** (`extract_structured_data.py`): Uses the Response API for extracting structured data
3. **Test Script** (`test_openai_response.py`): Demonstrates how to use the Response API for a single document

The implementation ensures:

- Documents are processed efficiently with high-quality extraction
- API costs are carefully controlled and tracked
- Processing continues even if API limits are reached or errors occur

## Best Practices

- Start with a small `--max-api-calls` value to test before processing the entire document set
- Monitor the API usage logs to understand cost implications
- For large document sets, consider processing in batches 