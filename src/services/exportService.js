import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Export trend data to CSV format
export const exportToCSV = (data, filename = 'trend-data.csv', type = 'timeline') => {
  try {
    let csvData = [];
    
    if (type === 'timeline') {
      // Timeline data format
      csvData = data.map(item => ({
        Date: item.date || item.formattedTime,
        Value: item.value || item.formattedValue || 0,
        Keyword: item.keyword || 'N/A'
      }));
    } else if (type === 'geographic') {
      // Geographic data format
      csvData = data.map(item => ({
        Country: item.name || item.geoName,
        'Country Code': item.code || item.geoCode,
        'Interest Value': item.value || item.formattedValue || 0
      }));
    } else if (type === 'comparison') {
      // Comparison data format - multiple keywords
      const dates = [...new Set(data.flatMap(series => 
        series.data.map(point => point.date)
      ))].sort();
      
      csvData = dates.map(date => {
        const row = { Date: date };
        data.forEach(series => {
          const point = series.data.find(p => p.date === date);
          row[series.keyword || series.label] = point ? point.value : 0;
        });
        return row;
      });
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export CSV: ' + error.message);
  }
};

// Export chart/component to PDF
export const exportToPDF = async (elementId, filename = 'trend-report.pdf', options = {}) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found for PDF export');
    }

    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: false,
      backgroundColor: options.backgroundColor || '#ffffff',
      ...options.html2canvasOptions
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: options.orientation || 'landscape',
      unit: 'mm',
      format: options.format || 'a4'
    });

    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add title if provided
    if (options.title) {
      pdf.setFontSize(16);
      pdf.text(options.title, 20, 20);
      pdf.addImage(imgData, 'PNG', 0, 30, imgWidth, imgHeight);
    } else {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    }
    
    // Add metadata
    if (options.metadata) {
      pdf.setProperties({
        title: options.metadata.title || 'Trend Report',
        subject: options.metadata.subject || 'Google Trends Analysis',
        author: options.metadata.author || 'Trend Tracker Pro',
        creator: 'Trend Tracker Pro'
      });
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export PDF: ' + error.message);
  }
};

// Export comprehensive report with multiple charts
export const exportComprehensiveReport = async (data, filename = 'comprehensive-trend-report.pdf') => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Add title
    pdf.setFontSize(20);
    pdf.text('Comprehensive Trend Analysis Report', 20, yPosition);
    yPosition += 15;

    // Add generation date
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;

    // Add summary statistics if available
    if (data.summary) {
      pdf.setFontSize(14);
      pdf.text('Summary Statistics', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      Object.entries(data.summary).forEach(([key, value]) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${key}: ${value}`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Add charts (if element IDs are provided)
    if (data.chartElements && data.chartElements.length > 0) {
      for (const elementId of data.chartElements) {
        const element = document.getElementById(elementId);
        if (element) {
          if (yPosition > pageHeight - 100) {
            pdf.addPage();
            yPosition = 20;
          }

          const canvas = await html2canvas(element, {
            scale: 1.5,
            logging: false,
            useCORS: true
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        }
      }
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error creating comprehensive report:', error);
    throw new Error('Failed to create comprehensive report: ' + error.message);
  }
};

// Utility function to prepare timeline data for export
export const prepareTimelineDataForExport = (rawData, keyword) => {
  if (!Array.isArray(rawData)) return [];
  
  return rawData.map(point => ({
    date: point.date || point.formattedTime,
    value: point.value || point.formattedValue || 0,
    keyword: keyword || 'Unknown'
  }));
};

// Utility function to prepare geographic data for export
export const prepareGeoDataForExport = (rawData) => {
  if (!rawData || !rawData.regions) return [];
  
  return rawData.regions.map(region => ({
    name: region.name || region.geoName,
    code: region.code || region.geoCode,
    value: region.value || region.formattedValue || 0
  }));
};

// Utility function to format filename with timestamp
export const formatFilename = (baseName, extension, includeTimestamp = true) => {
  if (!includeTimestamp) {
    return `${baseName}.${extension}`;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `${baseName}_${timestamp}.${extension}`;
}; 