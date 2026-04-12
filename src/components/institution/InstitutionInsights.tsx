import React from 'react';
import { School, Layers, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { Institution, Department } from '../../types';

interface InstitutionInsightsProps {
  institutions: Institution[];
  departments: Department[];
  stemRatio: number;
}

export const InstitutionInsights: React.FC<InstitutionInsightsProps> = ({
  institutions, departments, stemRatio
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Hierarchy Insights</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                <School size={20} />
              </div>
              <span className="text-sm font-bold text-slate-700">Total Institutions</span>
            </div>
            <span className="text-xl font-bold text-blue-600">{institutions.length}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
                <Layers size={20} />
              </div>
              <span className="text-sm font-bold text-slate-700">Total Departments</span>
            </div>
            <span className="text-xl font-bold text-emerald-600">{departments.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
        <h3 className="text-lg font-bold mb-4">Policy Compliance</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">STEM vs Non-STEM Ratio</p>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">STEM Programs</span>
              <span className="text-sm font-bold text-emerald-400">{stemRatio}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${stemRatio}%` }}></div>
            </div>
          </div>
          <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              {stemRatio >= 60 ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <XCircle size={16} className="text-rose-400" />
              )}
              <span className="text-sm font-bold">{stemRatio >= 60 ? 'Target Met' : 'Target Not Met'}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lagos State policy requires a 60:40 ratio. Current data shows we are {stemRatio >= 60 ? `${stemRatio - 60}% above` : `${60 - stemRatio}% below`} the target.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
