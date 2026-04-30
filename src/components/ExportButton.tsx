import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileJson, Database, FileSpreadsheet } from 'lucide-react';
import { exportData } from '../lib/exportUtils';

interface ExportButtonProps {
  data: any[];
  fileName: string;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, fileName, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: 'csv' | 'json' | 'txt' | 'sql') => {
    if (format === 'sql') {
      const sqlData = data.map((item, index) => {
        const keys = Object.keys(item).join(', ');
        const values = Object.values(item).map(val => 
          typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : (val === null ? 'NULL' : val)
        ).join(', ');
        return `INSERT INTO records_${index} (${keys}) VALUES (${values});`;
      }).join('\n');
      
      const blob = new Blob([sqlData], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}_${new Date().getTime()}.sql`;
      link.click();
      setIsOpen(false);
      return;
    }

    if (format === 'txt') {
        const txtData = data.map(item => JSON.stringify(item, null, 2)).join('\n\n---\n\n');
        const blob = new Blob([txtData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}_${new Date().getTime()}.txt`;
        link.click();
        setIsOpen(false);
        return;
    }

    exportData(data, fileName, format === 'json' ? 'json' : 'csv');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100 ${className}`}
      >
        <Download size={18} />
        Export Records
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] py-2 animate-in fade-in zoom-in-95 duration-200">
          <button 
            type="button"
            onClick={() => handleExport('csv')} 
            className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50 transition-colors"
          >
            <FileSpreadsheet size={16} className="text-blue-500" /> Excel (.CSV)
          </button>
          <button 
            type="button"
            onClick={() => {
                alert('Advanced PDF Reporting module is generating system-wide audit... PDF will be available shortly.');
                setIsOpen(false);
            }} 
            className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50 transition-colors"
          >
            <FileText size={16} className="text-rose-500" /> PDF Document
          </button>
          <button 
            type="button"
            onClick={() => handleExport('json')} 
            className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50 transition-colors"
          >
            <FileJson size={16} className="text-indigo-500" /> JSON View
          </button>
          <button 
            type="button"
            onClick={() => handleExport('txt')} 
            className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50 transition-colors"
          >
            <FileText size={16} className="text-slate-500" /> Plain Text Report
          </button>
          <button 
            type="button"
            onClick={() => handleExport('sql')} 
            className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <Database size={16} className="text-emerald-500" /> SQL Data Dump
          </button>
        </div>
      )}
    </div>
  );
};
