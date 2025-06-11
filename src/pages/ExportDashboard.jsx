import React, { useState, useEffect } from 'react';
import { DocumentArrowDownIcon, ChartBarIcon, GlobeAltIcon, ClockIcon } from '@heroicons/react/24/outline';
import { 
  exportToCSV, 
  exportToPDF, 
  exportComprehensiveReport,
  prepareTimelineDataForExport,
  prepareGeoDataForExport,
  formatFilename
} from '../services/exportService';
import { getSavedTrends, searchTrends, getGeoData, getExportFormats } from '../services/api';

const ExportDashboard = () => {
  const [savedTrends, setSavedTrends] = useState([]);
  const [exportFormats, setExportFormats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingItems, setExportingItems] = useState(new Set());
  const [selectedTrends, setSelectedTrends] = useState(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load saved trends if user is authenticated
        const userId = localStorage.getItem('userId');
        if (userId) {
          const trends = await getSavedTrends(userId);
          setSavedTrends(Array.isArray(trends) ? trends : []);
        }
        
        // Load export formats
        const formats = await getExportFormats();
        setExportFormats(formats);
        
      } catch (error) {
        console.error('Error loading export dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleExportTrend = async (trend, format) => {
    const itemId = `${trend.keyword}-${format}`;
    if (exportingItems.has(itemId)) return;

    try {
      setExportingItems(prev => new Set([...prev, itemId]));

      if (format === 'csv') {
        // Fetch fresh data for export
        const trendData = await searchTrends({
          keyword: trend.keyword,
          timeRange: trend.timeRange || '1m'
        });

        const preparedData = prepareTimelineDataForExport(trendData, trend.keyword);
        const filename = formatFilename(`${trend.keyword}_timeline`, 'csv');
        
        await exportToCSV(preparedData, filename, 'timeline');
      } else if (format === 'pdf') {
        // For PDF, we need to generate a report with the data
        const trendData = await searchTrends({
          keyword: trend.keyword,
          timeRange: trend.timeRange || '1m'
        });

        const preparedData = prepareTimelineDataForExport(trendData, trend.keyword);
        const filename = formatFilename(`${trend.keyword}_report`, 'pdf');
        
        await exportComprehensiveReport({
          summary: {
            'Keyword': trend.keyword,
            'Export Date': new Date().toLocaleDateString(),
            'Data Points': Array.isArray(preparedData) ? preparedData.length : 'N/A',
            'Time Range': trend.timeRange || '1m',
            'Date Saved': trend.dateAdded ? new Date(trend.dateAdded).toLocaleDateString() : 'N/A'
          }
        }, filename);
      }

      // Show success notification
      if (window.showNotification) {
        window.showNotification(`${trend.keyword} exported as ${format.toUpperCase()} successfully!`, 'success');
      }
    } catch (error) {
      console.error(`Error exporting ${trend.keyword}:`, error);
      if (window.showNotification) {
        window.showNotification(`Failed to export ${trend.keyword}: ${error.message}`, 'error');
      }
    } finally {
      setExportingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleBulkExport = async (format) => {
    if (selectedTrends.size === 0) {
      if (window.showNotification) {
        window.showNotification('Please select trends to export', 'warning');
      }
      return;
    }

    const bulkId = `bulk-${format}`;
    if (exportingItems.has(bulkId)) return;

    try {
      setExportingItems(prev => new Set([...prev, bulkId]));

      const trendsToExport = savedTrends.filter(trend => selectedTrends.has(trend.keyword));
      
      if (format === 'csv') {
        // Export each trend as a separate CSV
        for (const trend of trendsToExport) {
          await handleExportTrend(trend, 'csv');
        }
      } else if (format === 'pdf') {
        // Create a comprehensive report with all selected trends
        const allData = [];
        const summaryData = {
          'Export Date': new Date().toLocaleDateString(),
          'Number of Trends': trendsToExport.length,
          'Trends': trendsToExport.map(t => t.keyword).join(', ')
        };

        const filename = formatFilename('bulk_trends_report', 'pdf');
        
        await exportComprehensiveReport({
          summary: summaryData
        }, filename);
      }

      // Show success notification
      if (window.showNotification) {
        window.showNotification(`${selectedTrends.size} trends exported as ${format.toUpperCase()} successfully!`, 'success');
      }
    } catch (error) {
      console.error('Error in bulk export:', error);
      if (window.showNotification) {
        window.showNotification(`Bulk export failed: ${error.message}`, 'error');
      }
    } finally {
      setExportingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(bulkId);
        return newSet;
      });
    }
  };

  const toggleTrendSelection = (keyword) => {
    setSelectedTrends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };

  const selectAllTrends = () => {
    if (selectedTrends.size === savedTrends.length) {
      setSelectedTrends(new Set());
    } else {
      setSelectedTrends(new Set(savedTrends.map(t => t.keyword)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Export Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Export your trend data in multiple formats for analysis and reporting
          </p>
        </div>

        {/* Export Formats Info */}
        {exportFormats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {exportFormats.formats.map((format) => (
              <div key={format.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <DocumentArrowDownIcon className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{format.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{format.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Actions */}
        {savedTrends.length > 0 && (
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bulk Actions</h2>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={selectAllTrends}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                {selectedTrends.size === savedTrends.length ? 'Deselect All' : 'Select All'}
              </button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTrends.size} of {savedTrends.length} trends selected
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkExport('csv')}
                  disabled={selectedTrends.size === 0 || exportingItems.has('bulk-csv')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingItems.has('bulk-csv') ? 'Exporting...' : 'Export Selected as CSV'}
                </button>
                
                <button
                  onClick={() => handleBulkExport('pdf')}
                  disabled={selectedTrends.size === 0 || exportingItems.has('bulk-pdf')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingItems.has('bulk-pdf') ? 'Exporting...' : 'Export Selected as PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Trends List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Saved Trends</h2>
          </div>
          
          {savedTrends.length === 0 ? (
            <div className="p-8 text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No saved trends</h3>
              <p className="text-gray-600 dark:text-gray-400">Save some trends to access export functionality</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {savedTrends.map((trend) => (
                <div key={trend.keyword} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTrends.has(trend.keyword)}
                        onChange={() => toggleTrendSelection(trend.keyword)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                      />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {trend.keyword}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>Saved: {trend.dateAdded ? new Date(trend.dateAdded).toLocaleDateString() : 'Unknown'}</span>
                          {trend.timeRange && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Range: {trend.timeRange}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExportTrend(trend, 'csv')}
                        disabled={exportingItems.has(`${trend.keyword}-csv`)}
                        className="px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                      >
                        {exportingItems.has(`${trend.keyword}-csv`) ? 'Exporting...' : 'CSV'}
                      </button>
                      
                      <button
                        onClick={() => handleExportTrend(trend, 'pdf')}
                        disabled={exportingItems.has(`${trend.keyword}-pdf`)}
                        className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        {exportingItems.has(`${trend.keyword}-pdf`) ? 'Exporting...' : 'PDF'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Tips */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Export Tips</h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li>• CSV exports contain raw data perfect for spreadsheet analysis</li>
            <li>• PDF reports include charts and formatted summaries for presentations</li>
            <li>• Use bulk export to process multiple trends at once</li>
            <li>• Exported files include timestamps to avoid naming conflicts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExportDashboard; 