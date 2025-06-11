import React, { useState } from 'react';
import { DocumentArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { 
  exportToCSV, 
  exportToPDF, 
  exportComprehensiveReport,
  prepareTimelineDataForExport,
  prepareGeoDataForExport,
  formatFilename
} from '../services/exportService';

const ExportButton = ({ 
  data, 
  keyword, 
  dataType = 'timeline', 
  elementId,
  className = '',
  showDropdown = true,
  customOptions = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      
      // Debug logging
      console.log('ExportButton: Exporting CSV with keyword:', keyword, 'dataType:', dataType);
      
      let preparedData;
      let filename;
      
      if (dataType === 'timeline') {
        preparedData = prepareTimelineDataForExport(data, keyword);
        filename = formatFilename(`${keyword || 'trend'}_timeline`, 'csv');
      } else if (dataType === 'geographic') {
        preparedData = prepareGeoDataForExport(data);
        filename = formatFilename(`${keyword || 'trend'}_geographic`, 'csv');
             } else if (dataType === 'comparison') {
        preparedData = data; // Comparison data is already in the right format
        filename = formatFilename(`${keyword ? keyword.replace(/[^a-zA-Z0-9]/g, '_') : 'trend'}_comparison`, 'csv');
      } else {
        preparedData = data;
        filename = formatFilename('trend_data', 'csv');
      }

      await exportToCSV(preparedData, filename, dataType);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification('Data exported to CSV successfully!', 'success');
      }
    } catch (error) {
      console.error('CSV export failed:', error);
      if (window.showNotification) {
        window.showNotification('Failed to export CSV: ' + error.message, 'error');
      }
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      if (!elementId) {
        throw new Error('Element ID is required for PDF export');
      }

      const filename = formatFilename(`${keyword || 'trend'}_chart`, 'pdf');
      const options = {
        title: `Trend Analysis: ${keyword || 'Unknown'}`,
        orientation: 'landscape',
        metadata: {
          title: `Trend Analysis Report - ${keyword || 'Unknown'}`,
          subject: 'Google Trends Analysis',
          author: 'Trend Tracker Pro'
        },
        ...customOptions
      };

      await exportToPDF(elementId, filename, options);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification('Chart exported to PDF successfully!', 'success');
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      if (window.showNotification) {
        window.showNotification('Failed to export PDF: ' + error.message, 'error');
      }
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleComprehensiveReport = async () => {
    try {
      setIsExporting(true);
      
      // Debug logging
      console.log('ExportButton: Creating comprehensive report with keyword:', keyword);
      
      const reportData = {
        summary: {
          'Keyword': keyword || 'N/A',
          'Export Date': new Date().toLocaleDateString(),
          'Data Points': Array.isArray(data) ? data.length : 'N/A',
          'Data Type': dataType,
          'Time Range': customOptions.timeRange || 'N/A'
        },
        chartElements: elementId ? [elementId] : []
      };

      const filename = formatFilename(`${keyword || 'trend'}_comprehensive_report`, 'pdf');
      
      await exportComprehensiveReport(reportData, filename);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification('Comprehensive report generated successfully!', 'success');
      }
    } catch (error) {
      console.error('Comprehensive report failed:', error);
      if (window.showNotification) {
        window.showNotification('Failed to generate report: ' + error.message, 'error');
      }
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  // Simple export button without dropdown
  if (!showDropdown) {
    return (
      <button
        onClick={handleExportCSV}
        disabled={isExporting || !data}
        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </button>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isExporting || !data}
          className={`inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
          <ChevronDownIcon className="h-4 w-4 ml-2" />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu">
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              role="menuitem"
            >
              <div className="flex items-center">
                <DocumentArrowDownIcon className="h-4 w-4 mr-3" />
                Export as CSV
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                Download raw data
              </p>
            </button>
            
            {elementId && (
              <>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  role="menuitem"
                >
                  <div className="flex items-center">
                    <DocumentArrowDownIcon className="h-4 w-4 mr-3" />
                    Export as PDF
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                    Download chart as PDF
                  </p>
                </button>
                
                <button
                  onClick={handleComprehensiveReport}
                  disabled={isExporting}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  role="menuitem"
                >
                  <div className="flex items-center">
                    <DocumentArrowDownIcon className="h-4 w-4 mr-3" />
                    Comprehensive Report
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                    Full analysis with charts
                  </p>
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default ExportButton; 