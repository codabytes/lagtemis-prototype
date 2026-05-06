import React, { useMemo } from 'react';
import { School, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Institution, Faculty, Department, Student } from '../../types';

import { useAuth } from '../AuthGuard';

interface InstitutionCardProps {
  inst: Institution;
  user: any;
  faculties: Faculty[];
  departments: Department[];
  students: Student[];
  handleEditInstitution: (e: React.MouseEvent, inst: Institution) => void;
  handleDeleteInstitution: (e: React.MouseEvent, id: string, name: string) => void;
  onDrillDown: () => void;
}

export const InstitutionCard: React.FC<InstitutionCardProps> = ({
  inst, user, faculties, departments, students,
  handleEditInstitution, handleDeleteInstitution, onDrillDown
}) => {
  const { canManage, canDelete } = useAuth();
  const instFaculties = faculties.filter(f => f.institutionId === inst.id);
  const facultyIds = instFaculties.map(f => f.id);
  const instDepts = departments.filter(d => facultyIds.includes(d.facultyId));
  const instStudents = students.filter(s => s.institutionId === inst.id);

  const genderDistribution = useMemo(() => {
    const dist: Record<string, number> = instStudents.reduce((acc: Record<string, number>, curr) => {
      acc[curr.sex] = (acc[curr.sex] || 0) + 1;
      return acc;
    }, {});
    
    // Ensure both Male and Female exist even if 0
    const data = [
      { name: 'Male', value: dist['Male'] || 0 },
      { name: 'Female', value: dist['Female'] || 0 }
    ];
    return data;
  }, [instStudents]);

  const totalStudents = instStudents.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:border-blue-300 transition-all flex flex-col">
      <div 
        className="p-6 flex items-start justify-between cursor-pointer flex-1"
        onClick={onDrillDown}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {inst.logoUrl ? (
              <img src={inst.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <School size={28} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900 leading-tight truncate">{inst.name}</h3>
              {inst.shortName && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-wider shrink-0">
                  {inst.shortName}
                </span>
              )}
            </div>
            <div className="space-y-2 text-slate-500">
              <p className="text-xs font-black uppercase tracking-[0.15em] leading-none text-slate-400">{inst.category}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-black rounded uppercase tracking-widest leading-none border border-slate-100">
                    {inst.type}
                  </span>
                </div>
                <div className="flex items-center gap-4 h-4 border-l border-slate-200 pl-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                        {instFaculties.filter(f => f.type !== 'directorate').length} Faculties
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none italic">
                        & {instFaculties.filter(f => f.type === 'directorate').length} Directorates
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                        {instDepts.filter(d => d.type !== 'unit').length} Departments
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none italic">
                        & {instDepts.filter(d => d.type === 'unit').length} Units
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 ml-4 h-full pt-1">
          {canManage('institutions') && (
            <button
              type="button"
              onClick={(e) => handleEditInstitution(e, inst)}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all hover:shadow-sm"
              title="Edit Institution"
            >
              <Edit2 size={18} />
            </button>
          )}
          {canDelete('institutions') && (
            <button
              type="button"
              onClick={(e) => handleDeleteInstitution(e, inst.id, inst.name)}
              className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all hover:shadow-sm"
              title="Delete Institution"
            >
              <Trash2 size={18} />
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* Chart Section at the bottom */}
      <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between gap-8">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Student Enrollment</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{totalStudents.toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Male</span>
                <div className="w-3 h-3 rounded-md bg-blue-600 shadow-sm"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Female</span>
                <div className="w-3 h-3 rounded-md bg-pink-500 shadow-sm"></div>
              </div>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
            <div 
              className="h-full bg-blue-600 transition-all duration-500" 
              style={{ width: `${totalStudents > 0 ? (genderDistribution[0].value / totalStudents) * 100 : 0}%` }}
            ></div>
            <div 
              className="h-full bg-pink-500 transition-all duration-500" 
              style={{ width: `${totalStudents > 0 ? (genderDistribution[1].value / totalStudents) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="w-28 h-28 shrink-0 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-white rounded-full shadow-sm m-1"></div>
          <PieChart width={112} height={112} className="relative z-10">
            <Pie
              data={genderDistribution}
              cx="50%"
              cy="50%"
              outerRadius={50}
              dataKey="value"
              isAnimationActive={false}
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                if (value === 0) return null;
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                if (isNaN(x) || isNaN(y)) return null;
                return (
                  <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="900" className="drop-shadow-sm">
                    {value}
                  </text>
                );
              }}
            >
              <Cell fill="#2563eb" stroke="#fff" strokeWidth={2} />
              <Cell fill="#ec4899" stroke="#fff" strokeWidth={2} />
            </Pie>
          </PieChart>
        </div>
      </div>
    </div>
  );
};
