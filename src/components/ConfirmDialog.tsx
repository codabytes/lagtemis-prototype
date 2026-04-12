import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDangerous ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {message}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              className={`w-full py-3 px-4 font-bold rounded-xl transition-all ${
                isDangerous 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100'
              }`}
            >
              {confirmLabel}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 px-4 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
