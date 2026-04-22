
/**
 * Systemwide Export Utility
 * 
 * Provides standardized functions for generating CSV, JSON, and other format exports 
 * from application data arrays.
 */

export const triggerDownload = (content: string, fileName: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const jsonToCsv = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      const val = obj[header];
      // Handle commas and quotes in values
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Standardized system export runner
 */
export const exportData = (data: any[], fileName: string, format: 'json' | 'csv' = 'csv') => {
  if (!data || data.length === 0) {
    alert('No records available to export.');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fullFileName = `${fileName}_${timestamp}.${format}`;

  if (format === 'json') {
    triggerDownload(JSON.stringify(data, null, 2), fullFileName, 'application/json');
  } else {
    triggerDownload(jsonToCsv(data), fullFileName, 'text/csv');
  }
};
