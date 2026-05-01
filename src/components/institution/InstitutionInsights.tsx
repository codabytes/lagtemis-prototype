import React, { useState } from 'react';
import { School, Layers, CheckCircle2, XCircle, ArrowLeft, Users } from 'lucide-react';
import { Institution, Faculty, Department, Student } from '../../types';
import { calculateStemRatio, getInstitutionStemRatio } from '../../lib/academicUtils';
import { useAuth } from '../AuthGuard';

interface InstitutionInsightsProps {
  institutions: Institution[];
  faculties: Faculty[];
  departments: Department[];
  students: Student[];
}

export const InstitutionInsights: React.FC<InstitutionInsightsProps> = ({
  institutions, faculties, departments, students
}) => {
  const { user } = useAuth();
  const [activeDrillDown, setActiveDrillDown] = useState<'accessibility' | 'gender' | null>(null);

  const canDrillDown = ['SuperUser', 'DirectorAdminHR', 'DirectorStandards', 'DirectorInspection', 'DirectorInfrastructure', 'DirectorResearch'].includes(user?.role || '');

  // Accessibility Stats
  const publicCount = institutions.filter(i => i.type === 'Public').length;
  const privateCount = institutions.filter(i => i.type === 'Private').length;

  // Gender Stats
  const femaleCount = students.filter(s => s.sex === 'Female').length;
  const maleCount = students.filter(s => s.sex === 'Male').length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Accessibility Insights</h3>
        <div className="space-y-4">
          {activeDrillDown === 'accessibility' ? (
            <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Public</p>
                  <p className="text-2xl font-black text-blue-700">{publicCount}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Private</p>
                  <p className="text-2xl font-black text-slate-700">{privateCount}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveDrillDown(null)}
                className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
              >
                <ArrowLeft size={12} /> Back to Insights
              </button>
            </div>
          ) : (
            <div 
              onClick={canDrillDown ? () => setActiveDrillDown('accessibility') : undefined}
              className={`flex items-center justify-between p-4 bg-blue-50 rounded-2xl group transition-all ${canDrillDown ? 'cursor-pointer hover:bg-blue-100 active:scale-[0.98]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                  <School size={20} />
                </div>
                <span className="text-sm font-bold text-slate-700">Total Institutions</span>
              </div>
              <span className="text-xl font-bold text-blue-600 tabular-nums">{institutions.length}</span>
            </div>
          )}

          {activeDrillDown === 'gender' ? (
            <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 text-center">
                  <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-1">Female</p>
                  <p className="text-2xl font-black text-pink-700 tabular-nums">{femaleCount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Male</p>
                  <p className="text-2xl font-black text-indigo-700 tabular-nums">{maleCount.toLocaleString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveDrillDown(null)}
                className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
              >
                <ArrowLeft size={12} /> Back to Insights
              </button>
            </div>
          ) : (
            <div 
              onClick={canDrillDown ? () => setActiveDrillDown('gender') : undefined}
              className={`flex items-center justify-between p-4 bg-emerald-50 rounded-2xl group transition-all ${canDrillDown ? 'cursor-pointer hover:bg-emerald-100 active:scale-[0.98]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <span className="text-sm font-bold text-slate-700">Gender Balance</span>
              </div>
              <span className="text-xl font-bold text-emerald-600 tabular-nums">{students.length.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
