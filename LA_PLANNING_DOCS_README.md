# Los Angeles Planning Documents Processing and Visualization

This project extends the existing Los Angeles zoning map with planning document information, creating an interactive visualization that connects zoning areas with relevant planning policies and documents.

## Overview

The system consists of:

1. **PDF Document Processor**: Python script that extracts text and information from planning PDFs
2. **Document-to-Zone Mapper**: Links planning documents to specific zoning areas
3. **Interactive Map Layer**: Visualizes planning document information on the map

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js for the React application
- Tesseract OCR (for better PDF extraction)

### Installation

1. Install Python dependencies:
   ```bash
   pip install -r requirements_planning.txt
   ```

2. Install Tesseract OCR (optional but recommended):
   - macOS: `brew install tesseract`
   - Ubuntu/Debian: `sudo apt-get install tesseract-ocr`
   - Windows: Download from [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)

### Processing Planning Documents

1. Place PDF planning documents in the `public/planningDocs` directory
2. Run the processing script:
   ```bash
   ./process_planning_docs.sh
   ```
   
   Or manually:
   ```bash
   python process_planning_docs.py --docs-dir public/planningDocs --zoning-geojson public/optimized_zoning/zoning_medium_detail.geojson --output-dir public/processed_planning_docs
   ```

3. The script will generate the following outputs in `public/processed_planning_docs`:
   - `planning_docs_index.json`: Metadata about all processed documents
   - `zoning_with_planning_docs.geojson`: Enhanced zoning GeoJSON with document links
   - `planning_policies.geojson`: Policy areas extracted from documents
   - Individual document JSON files with extracted information

## Features

### PDF Document Processing

- Text extraction from various PDF formats
- OCR fallback for scanned documents
- Table extraction
- Entity recognition for zones, geographic areas, and policies
- Automatic summary generation

### Visualization Components

- Zoning areas that have associated planning documents are highlighted
- Policy markers indicate areas affected by specific planning policies
- Interactive popups display document summaries and policy information
- Links between zones and documents allow for exploration of planning context

## Usage

1. Start the React application
2. Toggle the "Show Planning Docs" layer in the layer control panel
3. Click on highlighted zoning areas to view associated planning documents
4. Click on policy markers to view policy information and affected areas

## Extending the System

### Adding More Document Types

The system can be extended to process additional document types by:

1. Updating the `extract_zone_mentions`, `extract_area_mentions`, and `extract_policy_mentions` methods in `process_planning_docs.py`
2. Adding new policy types to the `policy_types` list

### Improving Entity Recognition

To improve the accuracy of zone and area recognition:

1. Add more LA neighborhoods to the `la_neighborhoods` list
2. Update zone patterns in the `zoning_patterns` list
3. Fine-tune a custom spaCy model on planning documents

## Proof of Concept Limitations

This implementation is a proof of concept with the following limitations:

1. Policy areas use placeholder coordinates (LA City Hall) instead of actual boundaries
2. Document-to-zone mapping is based on textual mentions rather than spatial analysis
3. OCR quality may vary depending on the document quality
4. Limited error handling for malformed PDFs

## Next Steps

Potential improvements for production use:

1. Implement proper spatial analysis to accurately map policies to geographic boundaries
2. Add full-text search capability for planning documents
3. Create a document management interface for manual corrections and annotations
4. Implement more sophisticated NLP for better policy extraction 