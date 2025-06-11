# Data Export Feature

## Overview

The Data Export feature allows users to export trend data in CSV and PDF formats for further analysis, reporting, and integration with external tools. This feature provides both frontend client-side exports and backend server-side generation capabilities.

## Features

### Export Formats

1. **CSV Export**
   - Raw data in comma-separated values format
   - Perfect for spreadsheet analysis and data processing
   - Supports timeline data, geographic data, and comparison data
   - Includes proper headers and data formatting

2. **PDF Export**
   - Formatted reports with charts and visualizations
   - Comprehensive analysis summaries
   - Professional presentation-ready documents
   - Includes metadata and generation timestamps

3. **Comprehensive Reports**
   - Multi-page PDF reports combining multiple trends
   - Summary statistics and analysis
   - Chart images embedded in reports
   - Bulk export capabilities

### Export Types

1. **Timeline Data Export**
   - Date and interest value over time
   - Keyword information included
   - Supports different time ranges (1h, 1d, 7d, 1m, 3m, 12m, 5y)

2. **Geographic Data Export**
   - Country-wise interest data
   - Includes country names and ISO codes
   - Interest values by region

3. **Comparison Data Export**
   - Multiple keywords comparison
   - Side-by-side analysis
   - Normalized data across different trends

## Implementation

### Frontend Components

#### 1. ExportButton Component (`src/components/ExportButton.jsx`)
- Reusable export button with dropdown options
- Integrates with existing chart components
- Supports both CSV and PDF exports
- Loading states and error handling

```jsx
<ExportButton
  data={trendData}
  keyword="example"
  dataType="timeline"
  elementId="chart-container"
  customOptions={{ timeRange: "1m" }}
/>
```

#### 2. Export Dashboard (`src/pages/ExportDashboard.jsx`)
- Dedicated page for bulk export operations
- Lists all saved trends with export options
- Bulk selection and export capabilities
- Export format information and tips

### Backend API

#### 1. Export Routes (`server/routes/export.js`)
- `/api/export/csv` - Generate and download CSV files
- `/api/export/pdf` - Generate and download PDF reports
- `/api/export/formats` - Get available export formats and data types

#### 2. Server-side Generation
- CSV generation using `csv-writer` library
- PDF generation using `puppeteer` for HTML to PDF conversion
- Temporary file handling with automatic cleanup
- Support for custom templates and styling

### Services

#### 1. Export Service (`src/services/exportService.js`)
- Client-side export utilities
- Data preparation and formatting
- File download handling
- PDF generation from DOM elements

#### 2. API Integration (`src/services/api.js`)
- Server-side export API calls
- File download management
- Error handling and fallbacks

## Usage

### Basic Export from Charts

1. **In TrendChart Component**:
   ```jsx
   <TrendChart
     data={chartData}
     keyword="artificial intelligence"
     timeRange="1m"
     // Export button automatically included
   />
   ```

2. **In GeographicMap Component**:
   ```jsx
   <GeographicMap
     data={geoData}
     keyword="machine learning"
     // Export button automatically included
   />
   ```

### Export Dashboard Usage

1. **Access the Export Dashboard**:
   - Navigate to `/export` route
   - View all saved trends
   - Select trends for bulk export

2. **Individual Exports**:
   - Click CSV or PDF button next to each trend
   - Files download automatically with timestamps

3. **Bulk Exports**:
   - Select multiple trends using checkboxes
   - Choose "Export Selected as CSV" or "Export Selected as PDF"
   - Get combined reports or individual files

### Programmatic Usage

```javascript
import { exportToCSV, exportToPDF, exportComprehensiveReport } from '../services/exportService';

// Export timeline data to CSV
await exportToCSV(
  preparedData, 
  'my-trend-data.csv', 
  'timeline'
);

// Export chart to PDF
await exportToPDF(
  'chart-element-id',
  'trend-report.pdf',
  {
    title: 'Trend Analysis Report',
    orientation: 'landscape'
  }
);

// Generate comprehensive report
await exportComprehensiveReport({
  summary: { /* analysis data */ },
  chartElements: ['chart1', 'chart2']
}, 'comprehensive-report.pdf');
```

## Configuration

### Frontend Configuration

1. **Dependencies** (already added to `package.json`):
   ```json
   {
     "jspdf": "^2.5.1",
     "html2canvas": "^1.4.1",
     "papaparse": "^5.4.1"
   }
   ```

2. **Import the components**:
   ```javascript
   import ExportButton from '../components/ExportButton';
   import { exportToCSV, exportToPDF } from '../services/exportService';
   ```

### Backend Configuration

1. **Dependencies** (already added to `server/package.json`):
   ```json
   {
     "csv-writer": "^1.6.0",
     "puppeteer": "^21.11.0",
     "fs-extra": "^11.2.0"
   }
   ```

2. **Add routes to server** (already configured):
   ```javascript
   import exportRoutes from "./routes/export.js";
   app.use("/api/export", exportRoutes);
   ```

## File Structure

```
src/
├── components/
│   └── ExportButton.jsx          # Reusable export button component
├── pages/
│   └── ExportDashboard.jsx       # Dedicated export dashboard page
├── services/
│   ├── exportService.js          # Client-side export utilities
│   └── api.js                    # Updated with export API calls

server/
├── routes/
│   └── export.js                 # Export API endpoints
└── exports/                      # Temporary files (auto-created)
```

## Features Integration

### Existing Component Integration

1. **TrendChart Component**: 
   - Export button added to header
   - Supports both timeline and comparison exports
   - Chart screenshot capability for PDF reports

2. **GeographicMap Component**:
   - Export button in map header
   - Geographic data CSV export
   - Map visualization PDF export

3. **API Service Enhancement**:
   - New export endpoints
   - Server-side file generation
   - Automatic file cleanup

### Workflow Integration

1. **Search → Analyze → Export**: Users can search for trends, analyze the data, and export results
2. **Save → Bulk Export**: Save multiple trends and export them in bulk
3. **Dashboard → Report**: Use the export dashboard for comprehensive reporting

## Error Handling

1. **Client-side Errors**:
   - Network failures with fallback to client-side generation
   - Invalid data handling with user-friendly messages
   - Loading states during export operations

2. **Server-side Errors**:
   - Graceful degradation if backend services fail
   - Automatic file cleanup to prevent disk space issues
   - Detailed error logging for debugging

## Performance Considerations

1. **Client-side Exports**:
   - Small to medium datasets processed locally
   - No server load for simple CSV exports
   - Immediate download without network delays

2. **Server-side Exports**:
   - Large datasets and complex PDF generation
   - Better formatting and styling capabilities
   - Consistent output across different browsers

3. **File Management**:
   - Temporary files cleaned up after 1 minute
   - Unique filenames prevent conflicts
   - Memory-efficient streaming for large files

## Future Enhancements

1. **Additional Formats**:
   - Excel (.xlsx) export
   - JSON export for developers
   - SVG chart exports

2. **Advanced Features**:
   - Scheduled exports
   - Email delivery of reports
   - Custom report templates

3. **Integration**:
   - Google Drive/Dropbox integration
   - API for third-party tools
   - Webhook notifications

## Troubleshooting

### Common Issues

1. **PDF Generation Fails**:
   - Check if puppeteer is properly installed
   - Ensure sufficient memory for large charts
   - Verify element IDs are correct

2. **CSV Download Issues**:
   - Check browser download settings
   - Verify data format is correct
   - Ensure pop-up blockers aren't interfering

3. **Server Export Errors**:
   - Check server logs for detailed errors
   - Verify export directory permissions
   - Ensure all dependencies are installed

### Support

For issues or feature requests related to the export functionality:
1. Check the browser console for client-side errors
2. Review server logs for backend issues
3. Verify all dependencies are properly installed
4. Test with smaller datasets first

## API Reference

### Export Endpoints

#### POST `/api/export/csv`
Export data as CSV file.

**Request Body:**
```json
{
  "data": [...],           // Array of data points
  "type": "timeline",      // "timeline" | "geographic" | "comparison"
  "keyword": "AI",         // Keyword for filename
  "filename": "ai.csv"     // Optional custom filename
}
```

#### POST `/api/export/pdf`
Export data as PDF report.

**Request Body:**
```json
{
  "data": [...],           // Array of data points
  "options": {
    "title": "Trend Report",
    "keyword": "AI",
    "timeRange": "1m",
    "filename": "report.pdf"
  }
}
```

#### GET `/api/export/formats`
Get available export formats and data types.

**Response:**
```json
{
  "formats": [
    {
      "id": "csv",
      "name": "CSV",
      "description": "Comma-separated values file",
      "mimeType": "text/csv",
      "extension": ".csv"
    }
  ],
  "dataTypes": [
    {
      "id": "timeline",
      "name": "Timeline Data",
      "description": "Trend data over time"
    }
  ]
}
``` 