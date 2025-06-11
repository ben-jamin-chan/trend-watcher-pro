import express from 'express';
import { createObjectCsvWriter } from 'csv-writer';
import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper function to generate CSV from trend data
const generateCSVFromData = async (data, type, filename) => {
  const csvPath = path.join(__dirname, '../exports', filename);
  
  // Ensure exports directory exists
  await fs.ensureDir(path.dirname(csvPath));

  let csvWriter;

  if (type === 'timeline') {
    csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'value', title: 'Interest Value' },
        { id: 'keyword', title: 'Keyword' }
      ]
    });
  } else if (type === 'geographic') {
    csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: 'country', title: 'Country' },
        { id: 'countryCode', title: 'Country Code' },
        { id: 'value', title: 'Interest Value' }
      ]
    });
  } else if (type === 'comparison') {
    // Dynamic headers for comparison data
    const keywords = Object.keys(data[0]).filter(key => key !== 'date');
    const headers = [
      { id: 'date', title: 'Date' },
      ...keywords.map(keyword => ({ id: keyword, title: keyword }))
    ];

    csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: headers
    });
  }

  await csvWriter.writeRecords(data);
  return csvPath;
};

// Helper function to generate PDF report
const generatePDFReport = async (data, options = {}) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Generate HTML content for the report
  const htmlContent = generateReportHTML(data, options);
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfPath = path.join(__dirname, '../exports', options.filename || 'report.pdf');
  await fs.ensureDir(path.dirname(pdfPath));
  
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '20mm',
      right: '20mm'
    }
  });

  await browser.close();
  return pdfPath;
};

// Helper function to generate HTML content for PDF
const generateReportHTML = (data, options) => {
  const { title, keyword, timeRange, summary } = options;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title || 'Trend Analysis Report'}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 2.5em;
        }
        .header p {
          color: #666;
          font-size: 1.1em;
          margin: 10px 0 0 0;
        }
        .summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .summary h2 {
          color: #007bff;
          margin-top: 0;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: white;
          border-radius: 4px;
        }
        .summary-item strong {
          color: #495057;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .data-table th,
        .data-table td {
          border: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
        }
        .data-table th {
          background-color: #007bff;
          color: white;
          font-weight: 600;
        }
        .data-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 0.9em;
          border-top: 1px solid #dee2e6;
          padding-top: 20px;
        }
        .chart-placeholder {
          width: 100%;
          height: 300px;
          background: #f8f9fa;
          border: 2px dashed #dee2e6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title || 'Trend Analysis Report'}</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="summary">
        <h2>Analysis Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span><strong>Keyword:</strong></span>
            <span>${keyword || 'N/A'}</span>
          </div>
          <div class="summary-item">
            <span><strong>Time Range:</strong></span>
            <span>${timeRange || 'N/A'}</span>
          </div>
          <div class="summary-item">
            <span><strong>Data Points:</strong></span>
            <span>${Array.isArray(data) ? data.length : 'N/A'}</span>
          </div>
          <div class="summary-item">
            <span><strong>Report Type:</strong></span>
            <span>Comprehensive Analysis</span>
          </div>
        </div>
      </div>

      ${data && Array.isArray(data) && data.length > 0 ? `
        <div class="data-section">
          <h2>Trend Data</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Interest Value</th>
                ${data[0].keyword ? '<th>Keyword</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${data.slice(0, 20).map(item => `
                <tr>
                  <td>${item.date || item.formattedTime}</td>
                  <td>${item.value || item.formattedValue || 0}</td>
                  ${item.keyword ? `<td>${item.keyword}</td>` : ''}
                </tr>
              `).join('')}
              ${data.length > 20 ? `
                <tr>
                  <td colspan="${data[0].keyword ? 3 : 2}" style="text-align: center; font-style: italic;">
                    ... and ${data.length - 20} more entries
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p>Report generated by Trend Tracker Pro</p>
        <p>Data source: Google Trends API</p>
      </div>
    </body>
    </html>
  `;
};

// POST /api/export/csv - Export data as CSV
router.post('/csv', async (req, res) => {
  try {
    const { data, type, keyword, filename } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ message: 'Valid data array is required' });
    }

    const csvFilename = filename || `${keyword || 'trend'}_${type || 'data'}_${Date.now()}.csv`;
    const csvPath = await generateCSVFromData(data, type, csvFilename);

    // Send the file
    res.download(csvPath, csvFilename, (err) => {
      if (err) {
        console.error('Error sending CSV file:', err);
        res.status(500).json({ message: 'Failed to send CSV file' });
      } else {
        // Clean up the file after sending
        setTimeout(() => {
          fs.remove(csvPath).catch(console.error);
        }, 60000); // Remove after 1 minute
      }
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ message: 'Failed to generate CSV export' });
  }
});

// POST /api/export/pdf - Export data as PDF report
router.post('/pdf', async (req, res) => {
  try {
    const { data, options = {} } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Data is required for PDF export' });
    }

    const pdfOptions = {
      filename: `${options.keyword || 'trend'}_report_${Date.now()}.pdf`,
      title: options.title || 'Trend Analysis Report',
      keyword: options.keyword,
      timeRange: options.timeRange,
      ...options
    };

    const pdfPath = await generatePDFReport(data, pdfOptions);

    // Send the file
    res.download(pdfPath, pdfOptions.filename, (err) => {
      if (err) {
        console.error('Error sending PDF file:', err);
        res.status(500).json({ message: 'Failed to send PDF file' });
      } else {
        // Clean up the file after sending
        setTimeout(() => {
          fs.remove(pdfPath).catch(console.error);
        }, 60000); // Remove after 1 minute
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF export' });
  }
});

// GET /api/export/formats - Get available export formats
router.get('/formats', (req, res) => {
  res.json({
    formats: [
      {
        id: 'csv',
        name: 'CSV',
        description: 'Comma-separated values file',
        mimeType: 'text/csv',
        extension: '.csv'
      },
      {
        id: 'pdf',
        name: 'PDF Report',
        description: 'Comprehensive PDF report with charts',
        mimeType: 'application/pdf',
        extension: '.pdf'
      }
    ],
    dataTypes: [
      {
        id: 'timeline',
        name: 'Timeline Data',
        description: 'Trend data over time'
      },
      {
        id: 'geographic',
        name: 'Geographic Data',
        description: 'Regional interest data'
      },
      {
        id: 'comparison',
        name: 'Comparison Data',
        description: 'Multiple keywords comparison'
      }
    ]
  });
});

export default router; 