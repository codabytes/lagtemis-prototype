import React from 'react';
import { School, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { Institution, Faculty, Department, Student } from '../../types';
import { calculateStemRatio, getInstitutionStemRatio } from '../../lib/academicUtils';

interface InstitutionInsightsProps {
  institutions: Institution[];
  faculties: Faculty[];
  departments: Department[];
  students: Student[];
  stemRatio: number;
}

interface ComplianceCardProps {
  institutions: Institution[];
  faculties: Faculty[];
  departments: Department[];
  students: Student[];
  globalStemRatio?: number;
}

export const ComplianceCard: React.FC<ComplianceCardProps> = ({
  institutions, faculties, departments, students, globalStemRatio
}) => {
  const institutionRatios = institutions.map(inst => {
    const ratio = getInstitutionStemRatio(inst.id, students, departments);
    return { name: inst.name, ratio };
  }).sort((a, b) => b.ratio - a.ratio);

  const calculatedGlobalRatio = globalStemRatio ?? calculateStemRatio(students, departments);

  return (
    <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
      <h3 className="text-lg font-bold mb-4">Policy Compliance</h3>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">STEM vs Non-STEM Ratio (Current Students)</p>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">Global STEM Ratio</span>
            <span className="text-sm font-bold text-emerald-400">{calculatedGlobalRatio}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${calculatedGlobalRatio}%` }}></div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Institution Breakdown</p>
          <div className="max-h-64 overflow-y-auto pr-2 space-y-4 custom-scrollbar px-1">
            {institutionRatios.map((inst, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-300 truncate max-w-[70%]">{inst.name}</span>
                  <span className="text-[11px] font-bold text-slate-100">{inst.ratio}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${inst.ratio >= 60 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                    style={{ width: `${inst.ratio}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            {calculatedGlobalRatio >= 60 ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <XCircle size={16} className="text-rose-400" />
            )}
            <span className="text-sm font-bold">{calculatedGlobalRatio >= 60 ? 'Policy Target Met' : 'Target Not Met'}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Lagos State policy requires a 60:40 ratio. Current data shows we are {calculatedGlobalRatio >= 60 ? `${calculatedGlobalRatio - 60}% above` : `${60 - calculatedGlobalRatio}% below`} the target.
          </p>
        </div>
      </div>
    </div>
  );
};

export const InstitutionInsights: React.FC<InstitutionInsightsProps> = ({
  institutions, faculties, departments, students, stemRatio
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

      <ComplianceCard 
        institutions={institutions} 
        faculties={faculties} 
        departments={departments} 
        students={students}
        globalStemRatio={stemRatio}
      />
    </div>
  );
};
