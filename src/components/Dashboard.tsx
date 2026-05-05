import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  ArrowRight,
  School,
  BarChart2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Staff, Institution, Facility, Faculty, Department, Publication, Training } from '../types';
import { useAuth } from './AuthGuard';
import { calculateStemRatio, getStemRatioData } from '../lib/academicUtils';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  onClick?: () => void;
  drillable?: boolean;
  extra?: React.ReactNode;
  label?: string;
  footer?: string;
}> = ({ title, value, icon, color, onClick, drillable, extra, label, footer }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6 transition-all duration-300 ${drillable ? 'cursor-pointer hover:shadow-xl hover:border-blue-200 active:scale-[0.98]' : ''}`}
  >
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight mb-2">{title}</h3>
        <div>
          <p className="text-4xl font-black text-slate-900 tabular-nums leading-none tracking-tight">{value}</p>
          <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest opacity-70">{label || 'Total'}</p>
        </div>
      </div>
      <div className={`p-3 rounded-2xl ${color} bg-opacity-100 text-white shrink-0 shadow-lg shadow-${color.split('-')[1]}-100`}>
        {icon}
      </div>
    </div>
    
    {extra && (
      <div className="w-full h-full flex items-center justify-center">
        {extra}
      </div>
    )}
    
    {footer && (
      <div className="pt-4 border-t border-slate-50 mt-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{footer}</p>
      </div>
    )}
  </div>
);

const FacilityDrillDownModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  facilities: Facility[];
  institutions: Institution[];
  initialInstitutionId?: string | null;
}> = ({ isOpen, onClose, facilities, institutions, initialInstitutionId }) => {
  const [selectedInstId, setSelectedInstId] = useState<string | null>(initialInstitutionId || null);

  useEffect(() => {
    if (initialInstitutionId) {
      setSelectedInstId(initialInstitutionId);
    }
  }, [initialInstitutionId]);
  const [filters, setFilters] = useState({
    campus: 'ALL',
    type: 'ALL',
    capacity: 'ALL',
    fundingSource: 'ALL'
  });

  const selectedInstitution = institutions.find(i => i.id === selectedInstId);

  const instStats = useMemo(() => {
    return institutions.map(inst => ({
      ...inst,
      count: facilities.filter(f => f.institutionId === inst.id).length
    })).sort((a, b) => b.count - a.count);
  }, [facilities, institutions]);

  const filteredFacilities = useMemo(() => {
    if (!selectedInstId) return [];
    return facilities.filter(f => {
      if (f.institutionId !== selectedInstId) return false;
      if (filters.campus !== 'ALL' && f.campus !== filters.campus) return false;
      if (filters.type !== 'ALL' && f.type !== filters.type) return false;
      if (filters.fundingSource !== 'ALL' && f.fundingSource !== filters.fundingSource) return false;
      
      if (filters.capacity !== 'ALL') {
        const cap = f.capacity;
        if (filters.capacity === '0-50') if (cap > 50) return false;
        if (filters.capacity === '51-100') if (cap <= 50 || cap > 100) return false;
        if (filters.capacity === '101-200') if (cap <= 100 || cap > 200) return false;
        if (filters.capacity === '201-500') if (cap <= 200 || cap > 500) return false;
        if (filters.capacity === '501+') if (cap <= 500) return false;
      }
      return true;
    });
  }, [facilities, selectedInstId, filters]);

  const availableCampuses = useMemo(() => {
    if (!selectedInstId) return [];
    const campuses = facilities
      .filter(f => f.institutionId === selectedInstId && f.campus)
      .map(f => f.campus);
    return Array.from(new Set(campuses)).sort();
  }, [facilities, selectedInstId]);

  const types = Array.from(new Set(facilities.map(f => f.type))).sort();
  const fundingSources = Array.from(new Set(facilities.map(f => f.fundingSource))).sort();

  const clearFilters = () => {
    setFilters({
      campus: 'ALL',
      type: 'ALL',
      capacity: 'ALL',
      fundingSource: 'ALL'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {selectedInstId && (
                <button 
                  onClick={() => setSelectedInstId(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                >
                  <ArrowRight className="rotate-180" size={18} />
                </button>
              )}
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {!selectedInstId ? 'Total Facilities By Institution' : `Facilities Breakdown: ${selectedInstitution?.name}`}
              </h2>
            </div>
            <p className="text-slate-400 text-[11px] italic serif">
              {!selectedInstId ? 'Overall infrastructure inventory across the state' : 'Detailed asset listing with multidimensional filtering'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white hover:shadow-sm rounded-xl transition-all">
            <Building2 size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!selectedInstId ? (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instStats.map(inst => (
                  <button 
                    key={inst.id}
                    onClick={() => setSelectedInstId(inst.id)}
                    className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left hover:border-amber-300 hover:bg-white hover:shadow-lg transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">
                        {inst.shortName[0]}
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">{inst.name}</h3>
                    <p className="text-3xl font-black text-slate-900 tabular-nums mb-1">{inst.count.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Facilities</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 px-6 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Campus</label>
                  <select 
                    value={filters.campus}
                    onChange={(e) => setFilters(prev => ({ ...prev, campus: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-2 outline-none focus:ring-2 focus:ring-amber-50 transition-all shadow-sm"
                  >
                    <option value="ALL">ALL CAMPUSES</option>
                    {availableCampuses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Facility Type</label>
                  <select 
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-2 outline-none focus:ring-2 focus:ring-amber-50 transition-all shadow-sm"
                  >
                    <option value="ALL">ALL TYPES</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Capacity</label>
                  <select 
                    value={filters.capacity}
                    onChange={(e) => setFilters(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-2 outline-none focus:ring-2 focus:ring-amber-50 transition-all shadow-sm"
                  >
                    <option value="ALL">ANY CAPACITY</option>
                    <option value="0-50">Up to 50</option>
                    <option value="51-100">51 - 100</option>
                    <option value="101-200">101 - 200</option>
                    <option value="201-500">201 - 500</option>
                    <option value="501+">Above 500</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Funding Source</label>
                  <select 
                    value={filters.fundingSource}
                    onChange={(e) => setFilters(prev => ({ ...prev, fundingSource: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-2 outline-none focus:ring-2 focus:ring-amber-50 transition-all shadow-sm"
                  >
                    <option value="ALL">ALL SOURCES</option>
                    {fundingSources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button 
                  onClick={clearFilters}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all h-[34px]"
                >
                  Clear All
                </button>
              </div>

              <div className="flex-1 overflow-hidden bg-slate-50/20 p-4 px-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Infrastructure Records</h4>
                    <p className="text-xs font-bold text-slate-500">Showing {filteredFacilities.length} matching assets</p>
                  </div>
                  <div className="px-3 py-1 bg-white rounded-lg border border-slate-100 shadow-sm flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Matches:</span>
                    <span className="text-sm font-black text-amber-600">{filteredFacilities.length}</span>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-0">
                  <div className="overflow-x-auto overflow-y-auto h-full custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-50 z-10">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Facility Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campus</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Completed</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Acquisition Cost (₦)</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Funding Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredFacilities.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium">No assets found matching the active filters</td>
                          </tr>
                        ) : filteredFacilities.map(f => (
                          <tr key={f.id} className="hover:bg-slate-50/50 group transition-colors">
                            <td className="px-6 py-5">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{f.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {f.assetId}</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-xs font-bold text-slate-700">{f.type}</span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{f.campus}</span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-sm font-bold text-slate-900 tabular-nums">
                                {new Date(f.dateCompleted).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-sm font-black text-slate-900 tabular-nums">
                                ₦{f.acquisitionCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">{f.fundingSource}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StaffDrillDownModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  staff: Staff[];
  institutions: Institution[];
  faculties: Faculty[];
  departments: Department[];
  initialInstitutionId?: string | null;
}> = ({ isOpen, onClose, staff, institutions, faculties, departments, initialInstitutionId }) => {
  const [selectedInstId, setSelectedInstId] = useState<string | null>(initialInstitutionId || null);

  useEffect(() => {
    if (initialInstitutionId) {
      setSelectedInstId(initialInstitutionId);
    }
  }, [initialInstitutionId]);
  const [selectedType, setSelectedType] = useState<'Academic' | 'Non-Academic' | null>(null);
  const [filters, setFilters] = useState({
    facultyId: 'ALL',
    departmentId: 'ALL',
    qualification: 'ALL',
    employmentStatus: 'ALL'
  });

  const selectedInstitution = institutions.find(i => i.id === selectedInstId);

  const instStats = useMemo(() => {
    return institutions.map(inst => {
      const instStaff = staff.filter(s => s.institutionId === inst.id);
      const academicCount = instStaff.filter(s => s.staffType === 'Academic').length;
      const nonAcademicCount = instStaff.filter(s => s.staffType === 'Non-Academic').length;
      return {
        ...inst,
        count: instStaff.length,
        typeDist: [
          { name: 'Academic', value: academicCount },
          { name: 'Non-Academic', value: nonAcademicCount }
        ]
      };
    }).sort((a, b) => b.count - a.count);
  }, [staff, institutions]);

  const typeCounts = useMemo(() => {
    if (!selectedInstId) return { academic: 0, nonAcademic: 0 };
    const instStaff = staff.filter(s => s.institutionId === selectedInstId);
    return {
      academic: instStaff.filter(s => s.staffType === 'Academic').length,
      nonAcademic: instStaff.filter(s => s.staffType === 'Non-Academic').length
    };
  }, [staff, selectedInstId]);

  const filteredStaff = useMemo(() => {
    if (!selectedInstId || !selectedType) return [];
    return staff.filter(s => {
      if (s.institutionId !== selectedInstId) return false;
      if (s.staffType !== selectedType) return false;
      if (filters.facultyId !== 'ALL' && s.facultyId !== filters.facultyId) return false;
      if (filters.departmentId !== 'ALL' && s.departmentId !== filters.departmentId) return false;
      if (filters.qualification !== 'ALL' && s.highestQualification !== filters.qualification) return false;
      if (filters.employmentStatus !== 'ALL' && s.employmentStatus !== filters.employmentStatus) return false;
      return true;
    });
  }, [staff, selectedInstId, selectedType, filters]);

  const availableFaculties = faculties.filter(f => f.institutionId === selectedInstId);
  const availableDepartments = useMemo(() => {
    if (filters.facultyId === 'ALL') {
      return departments.filter(d => availableFaculties.some(f => f.id === d.facultyId));
    }
    return departments.filter(d => d.facultyId === filters.facultyId);
  }, [departments, filters.facultyId, availableFaculties]);

  const qualifications = Array.from(new Set(staff.map(s => s.highestQualification).filter(Boolean))).sort();
  const statuses = Array.from(new Set(staff.map(s => s.employmentStatus))).sort();

  if (!isOpen) return null;

  const navigateBack = () => {
    if (selectedType) setSelectedType(null);
    else if (selectedInstId) setSelectedInstId(null);
  };

  const clearFilters = () => {
    setFilters({
      facultyId: 'ALL',
      departmentId: 'ALL',
      qualification: 'ALL',
      employmentStatus: 'ALL'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {(selectedInstId || selectedType) && (
                <button 
                  onClick={navigateBack}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                >
                  <ArrowRight className="rotate-180" size={18} />
                </button>
              )}
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {!selectedInstId ? 'Staff Strength By Institution' : 
                 !selectedType ? `Staff Breakdown: ${selectedInstitution?.name}` :
                 `${selectedType} Staff: ${selectedInstitution?.name}`}
              </h2>
            </div>
            <p className="text-slate-400 text-[11px] italic serif">
              {!selectedInstId ? 'Total human resource capacity across all institutions' : 
               !selectedType ? 'Academic and Non-Academic personnel breakdown' :
               'Advanced filtering and detailed records view'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white hover:shadow-sm rounded-xl transition-all">
            <Users size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!selectedInstId ? (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instStats.map(inst => (
                  <button 
                    key={inst.id}
                    onClick={() => setSelectedInstId(inst.id)}
                    className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left hover:border-emerald-300 hover:bg-white hover:shadow-lg transition-all group active:scale-[0.98] flex flex-col h-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
                        {inst.shortName[0]}
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-2 min-h-[2.5rem]">{inst.name}</h3>
                      <div className="flex items-center justify-between gap-4 mt-2">
                        <div>
                          <p className="text-3xl font-black text-slate-900 tabular-nums mb-1">{inst.count.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Staff</p>
                        </div>
                        <div className="h-24 w-24 -mr-4 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const percentage = inst.count > 0 ? ((data.value / inst.count) * 100).toFixed(0) : 0;
                                    return (
                                      <div className="bg-white p-2 rounded-lg shadow-xl border border-slate-100 text-[10px] font-bold">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${data.name === 'Academic' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                          <span className="text-slate-600">{data.name}: {data.value.toLocaleString()} ({percentage}%)</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Pie
                                data={inst.typeDist}
                                innerRadius={0}
                                outerRadius={28}
                                paddingAngle={0}
                                dataKey="value"
                                labelLine={true}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                  if (value === 0) return null;
                                  const RADIAN = Math.PI / 180;
                                  const radius = outerRadius + 15;
                                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                  return (
                                    <text 
                                      x={x} 
                                      y={y} 
                                      fill="#64748b" 
                                      textAnchor={x > cx ? 'start' : 'end'} 
                                      dominantBaseline="central" 
                                      className="text-[9px] font-black"
                                    >
                                      {value}
                                    </text>
                                  );
                                }}
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#3b82f6" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : !selectedType ? (
            <div className="flex-1 p-8 flex items-center justify-center gap-8">
              <button 
                onClick={() => setSelectedType('Academic')}
                className="w-full max-w-sm p-10 bg-white rounded-[32px] border-2 border-slate-100 hover:border-emerald-500 hover:shadow-2xl transition-all group text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Academic Staff</h3>
                <p className="text-4xl font-black text-emerald-600 mb-2 tabular-nums">{typeCounts.academic.toLocaleString()}</p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Personnel Count</p>
              </button>

              <button 
                onClick={() => setSelectedType('Non-Academic')}
                className="w-full max-w-sm p-10 bg-white rounded-[32px] border-2 border-slate-100 hover:border-blue-500 hover:shadow-2xl transition-all group text-center"
              >
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Activity size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Non-Academic Staff</h3>
                <p className="text-4xl font-black text-blue-600 mb-2 tabular-nums">{typeCounts.nonAcademic.toLocaleString()}</p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Personnel Count</p>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 px-6 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Faculty/Directorate</label>
                  <select 
                    value={filters.facultyId}
                    onChange={(e) => setFilters(prev => ({ ...prev, facultyId: e.target.value, departmentId: 'ALL' }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-2 outline-none focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm"
                  >
                    <option value="ALL">ALL {selectedType === 'Academic' ? 'FACULTIES' : 'DIRECTORATES'}</option>
                    {availableFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department/Unit</label>
                  <select 
                    value={filters.departmentId}
                    onChange={(e) => setFilters(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-2 outline-none focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm"
                  >
                    <option value="ALL">ALL {selectedType === 'Academic' ? 'DEPARTMENTS' : 'UNITS'}</option>
                    {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Qualification</label>
                  <select 
                    value={filters.qualification}
                    onChange={(e) => setFilters(prev => ({ ...prev, qualification: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-2 outline-none focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm"
                  >
                    <option value="ALL">ALL QUALIFICATIONS</option>
                    {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    value={filters.employmentStatus}
                    onChange={(e) => setFilters(prev => ({ ...prev, employmentStatus: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-2 outline-none focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm"
                  >
                    <option value="ALL">ALL STATUSES</option>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button 
                  onClick={clearFilters}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all h-[34px]"
                >
                  Clear All
                </button>
              </div>

              <div className="flex-1 overflow-hidden bg-slate-50/20 p-4 px-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Records</h4>
                    <p className="text-xs font-bold text-slate-500">Showing {filteredStaff.length} staff members</p>
                  </div>
                  <div className="px-3 py-1 bg-white rounded-lg border border-slate-100 shadow-sm flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Matches:</span>
                    <span className={`text-lg font-black ${selectedType === 'Academic' ? 'text-emerald-600' : 'text-blue-600'}`}>{filteredStaff.length}</span>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-0">
                  <div className="overflow-y-auto h-full custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-50 z-10">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedType === 'Academic' ? 'Faculty' : 'Directorate'}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedType === 'Academic' ? 'Department' : 'Unit'}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Qualification</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStaff.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium">No personnel found matching the active filters</td>
                          </tr>
                        ) : filteredStaff.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50 group transition-colors">
                            <td className="px-6 py-5">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{s.title} {s.surname}, {s.firstName} {s.otherName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {s.staffId}</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-xs font-bold text-slate-700">{s.designation}</span>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{faculties.find(f => f.id === s.facultyId)?.name}</p>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-[10px] font-bold text-slate-400">{departments.find(d => d.id === s.departmentId)?.name}</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">{s.highestQualification}</span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${s.employmentStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                <span className="text-[11px] font-bold text-slate-600">{s.employmentStatus}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const StemDrillDownModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  institutions: Institution[];
  departments: Department[];
  initialInstitutionId?: string | null;
}> = ({ isOpen, onClose, students, institutions, departments, initialInstitutionId }) => {
  const [selectedInstId, setSelectedInstId] = useState<string | null>(initialInstitutionId || null);

  useEffect(() => {
    if (initialInstitutionId) {
      setSelectedInstId(initialInstitutionId);
    }
  }, [initialInstitutionId]);

  const selectedInstitution = institutions.find(i => i.id === selectedInstId);

  const instStats = useMemo(() => {
    return institutions.map(inst => {
      const instStudents = students.filter(s => s.institutionId === inst.id);
      const ratioData = getStemRatioData(instStudents, departments);
      const maleCount = instStudents.filter(s => s.sex === 'Male').length;
      const femaleCount = instStudents.filter(s => s.sex === 'Female').length;
      return {
        ...inst,
        ...ratioData,
        genderDist: [
          { name: 'Male', value: maleCount },
          { name: 'Female', value: femaleCount }
        ]
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [students, institutions, departments]);

  const genderStats = useMemo(() => {
    if (!selectedInstId) return null;
    const instStudents = students.filter(s => s.institutionId === selectedInstId);
    
    const femaleStudents = instStudents.filter(s => s.sex === 'Female');
    const maleStudents = instStudents.filter(s => s.sex === 'Male');
    
    return {
      female: getStemRatioData(femaleStudents, departments),
      male: getStemRatioData(maleStudents, departments),
      overall: getStemRatioData(instStudents, departments)
    };
  }, [students, selectedInstId, departments]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {selectedInstId && (
                <button 
                  onClick={() => setSelectedInstId(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                >
                  <ArrowRight className="rotate-180" size={18} />
                </button>
              )}
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {!selectedInstId ? 'STEM:Non-STEM Ratio By Institution' : `Gender-based STEM Ratio: ${selectedInstitution?.name}`}
              </h2>
            </div>
            <p className="text-slate-400 text-[11px] italic serif">
              {!selectedInstId ? 'Analysis of student enrollment in STEM vs Non-STEM courses' : 'Multidimensional breakdown of STEM compliance by gender'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white hover:shadow-sm rounded-xl transition-all">
            <TrendingUp size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!selectedInstId ? (
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {instStats.map(inst => (
                  <button 
                    key={inst.id}
                    onClick={() => setSelectedInstId(inst.id)}
                    className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left hover:border-purple-300 hover:bg-white hover:shadow-lg transition-all group active:scale-[0.98] flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">
                        {inst.shortName[0]}
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">{inst.name}</h3>
                      
                      <div className="grid grid-cols-2 gap-4 items-center mb-4">
                        <div>
                          <div className="flex items-end justify-between mb-2">
                             <p className="text-2xl font-black text-slate-900 tabular-nums">{inst.ratioString}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${inst.percentage >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {inst.percentage}% STEM
                          </span>
                        </div>
                        <div className="h-24 w-24 -mr-4 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const total = inst.genderDist.reduce((a: any, b: any) => a + b.value, 0);
                                    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(0) : 0;
                                    return (
                                      <div className="bg-white p-2 rounded-lg shadow-xl border border-slate-100 text-[10px] font-bold">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${data.name === 'Male' ? 'bg-indigo-500' : 'bg-pink-500'}`}></div>
                                          <span className="text-slate-600">{data.name}: {data.value.toLocaleString()} ({percentage}%)</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Pie
                                data={inst.genderDist}
                                innerRadius={22}
                                outerRadius={38}
                                paddingAngle={2}
                                dataKey="value"
                                labelLine={false}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                  if (value === 0) return null;
                                  const RADIAN = Math.PI / 180;
                                  const radius = outerRadius + 12;
                                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                  return (
                                    <text 
                                      x={x} 
                                      y={y} 
                                      fill="#64748b" 
                                      textAnchor={x > cx ? 'start' : 'end'} 
                                      dominantBaseline="central" 
                                      className="text-[9px] font-black"
                                    >
                                      {value}
                                    </text>
                                  );
                                }}
                              >
                                <Cell fill="#4f46e5" />
                                <Cell fill="#ec4899" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${inst.percentage >= 60 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                          style={{ width: `${inst.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">STEM Compliance</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{inst.total.toLocaleString()} Students</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Female Card */}
                <div className="p-8 bg-pink-50 rounded-[32px] border border-pink-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-pink-200 -rotate-12 translate-x-4 -translate-y-4">
                    <Users size={120} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-xs font-black text-pink-400 uppercase tracking-[0.2em] mb-4">Female Students</h4>
                    <p className="text-5xl font-black text-pink-900 mb-2 tabular-nums">{genderStats?.female.ratioString}</p>
                    <p className="text-sm font-bold text-pink-600 mb-6">STEM:Non-STEM Ratio</p>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-bold text-pink-700">
                        <span>STEM Percentage</span>
                        <span>{genderStats?.female.percentage}%</span>
                      </div>
                      <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: `${genderStats?.female.percentage}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-pink-400 uppercase tracking-widest">
                        <span>{genderStats?.female.stem.toLocaleString()} STEM</span>
                        <span>{genderStats?.female.total.toLocaleString()} Total</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Male Card */}
                <div className="p-8 bg-indigo-50 rounded-[32px] border border-indigo-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-indigo-200 rotate-12 translate-x-4 -translate-y-4">
                    <Users size={120} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Male Students</h4>
                    <p className="text-5xl font-black text-indigo-900 mb-2 tabular-nums">{genderStats?.male.ratioString}</p>
                    <p className="text-sm font-bold text-indigo-600 mb-6">STEM:Non-STEM Ratio</p>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-bold text-indigo-700">
                        <span>STEM Percentage</span>
                        <span>{genderStats?.male.percentage}%</span>
                      </div>
                      <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${genderStats?.male.percentage}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                        <span>{genderStats?.male.stem.toLocaleString()} STEM</span>
                        <span>{genderStats?.male.total.toLocaleString()} Total</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Summary */}
              <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Combined Institutional Ratio</h4>
                  <p className="text-2xl font-black text-white">{genderStats?.overall.ratioString}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-400">Policy Target: 60:40</p>
                  <p className={`text-sm font-black ${genderStats?.overall.percentage >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {genderStats?.overall.percentage >= 60 ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DrillDownModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  institutions: Institution[];
  faculties: Faculty[];
  departments: Department[];
  initialInstitutionId?: string | null;
}> = ({ isOpen, onClose, students, institutions, faculties, departments, initialInstitutionId }) => {
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(initialInstitutionId || null);

  useEffect(() => {
    if (initialInstitutionId) {
      setSelectedInstitutionId(initialInstitutionId);
    }
  }, [initialInstitutionId]);
  const [filters, setFilters] = useState({
    campus: 'ALL',
    programmeType: 'ALL',
    facultyId: 'ALL',
    departmentId: 'ALL'
  });

  const selectedInstitution = institutions.find(i => i.id === selectedInstitutionId);

  const institutionStats = useMemo(() => {
    return institutions.map(inst => {
      const instStudents = students.filter(s => s.institutionId === inst.id);
      const maleCount = instStudents.filter(s => s.sex === 'Male').length;
      const femaleCount = instStudents.filter(s => s.sex === 'Female').length;
      return {
        ...inst,
        count: instStudents.length,
        genderDist: [
          { name: 'Male', value: maleCount },
          { name: 'Female', value: femaleCount }
        ]
      };
    }).sort((a, b) => b.count - a.count);
  }, [students, institutions]);

  const filteredStudents = useMemo(() => {
    if (!selectedInstitutionId) return [];
    return students.filter(s => {
      if (s.institutionId !== selectedInstitutionId) return false;
      if (filters.campus !== 'ALL' && s.campus !== filters.campus) return false;
      if (filters.programmeType !== 'ALL' && s.programmeType !== filters.programmeType) return false;
      if (filters.facultyId !== 'ALL' && s.facultyId !== filters.facultyId) return false;
      if (filters.departmentId !== 'ALL' && s.departmentId !== filters.departmentId) return false;
      return true;
    });
  }, [students, selectedInstitutionId, filters]);

  const availableCampuses = useMemo(() => {
    if (!selectedInstitutionId) return [];
    const campuses = students
      .filter(s => s.institutionId === selectedInstitutionId && s.campus)
      .map(s => s.campus as string);
    return Array.from(new Set(campuses)).sort();
  }, [students, selectedInstitutionId]);

  const availableFaculties = faculties.filter(f => f.institutionId === selectedInstitutionId);
  const availableDepartments = useMemo(() => {
    if (filters.facultyId === 'ALL') {
      return departments.filter(d => availableFaculties.some(f => f.id === d.facultyId));
    }
    return departments.filter(d => d.facultyId === filters.facultyId);
  }, [departments, filters.facultyId, availableFaculties]);

  const clearFilters = () => {
    setFilters({
      campus: 'ALL',
      programmeType: 'ALL',
      facultyId: 'ALL',
      departmentId: 'ALL'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {selectedInstitutionId && (
                <button 
                  onClick={() => setSelectedInstitutionId(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                >
                  <ArrowRight className="rotate-180" size={18} />
                </button>
              )}
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {selectedInstitutionId ? `Drill Down: ${selectedInstitution?.name}` : 'Student Enrollment By Institution'}
              </h2>
            </div>
            <p className="text-slate-400 text-[11px] italic serif">
              {selectedInstitutionId ? 'Filter and explore detailed student records' : 'Total enrollment breakdown by institution'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white hover:shadow-sm rounded-xl transition-all">
            <Users size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {!selectedInstitutionId ? (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {institutionStats.map(inst => (
                  <button 
                    key={inst.id}
                    onClick={() => setSelectedInstitutionId(inst.id)}
                    className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left hover:border-blue-300 hover:bg-white hover:shadow-lg transition-all group active:scale-[0.98] flex flex-col h-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                        {inst.shortName[0]}
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">{inst.name}</h3>
                      <div className="flex items-center justify-between gap-4 mt-2">
                        <div>
                          <p className="text-3xl font-black text-slate-900 tabular-nums mb-1">{inst.count.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollment</p>
                        </div>
                        <div className="h-16 w-16 -mr-2 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const percentage = inst.count > 0 ? ((data.value / inst.count) * 100).toFixed(0) : 0;
                                    return (
                                      <div className="bg-white p-2 rounded-lg shadow-xl border border-slate-100 text-[10px] font-bold">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${data.name === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                                          <span className="text-slate-600">{data.name}: {data.value.toLocaleString()} ({percentage}%)</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Pie
                                data={inst.genderDist}
                                innerRadius={0}
                                outerRadius={24}
                                paddingAngle={0}
                                dataKey="value"
                                labelLine={false}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                  if (value === 0) return null;
                                  const RADIAN = Math.PI / 180;
                                  const radius = outerRadius + 8;
                                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                  return (
                                    <text 
                                      x={x} 
                                      y={y} 
                                      fill="#64748b" 
                                      textAnchor={x > cx ? 'start' : 'end'} 
                                      dominantBaseline="central" 
                                      className="text-[8px] font-black"
                                    >
                                      {value}
                                    </text>
                                  );
                                }}
                              >
                                <Cell fill="#2563eb" />
                                <Cell fill="#ec4899" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-2 px-6 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Campus</label>
                  <select 
                    value={filters.campus}
                    onChange={(e) => setFilters(prev => ({ ...prev, campus: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-1.5 transition-all shadow-sm outline-none focus:ring-2 focus:ring-blue-50"
                  >
                    <option value="ALL">ALL CAMPUSES</option>
                    {availableCampuses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Programme Type</label>
                  <select 
                    value={filters.programmeType}
                    onChange={(e) => setFilters(prev => ({ ...prev, programmeType: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-1.5 transition-all shadow-sm outline-none focus:ring-2 focus:ring-blue-50"
                  >
                    <option value="ALL">ALL TYPES</option>
                    <option value="Full-time">FULL-TIME</option>
                    <option value="Part-time">PART-TIME</option>
                    <option value="Sandwich">SANDWICH</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Faculty</label>
                  <select 
                    value={filters.facultyId}
                    onChange={(e) => setFilters(prev => ({ ...prev, facultyId: e.target.value, departmentId: 'ALL' }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-1.5 transition-all shadow-sm outline-none focus:ring-2 focus:ring-blue-50"
                  >
                    <option value="ALL">ALL FACULTIES</option>
                    {availableFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
                  <select 
                    value={filters.departmentId}
                    onChange={(e) => setFilters(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-1.5 transition-all shadow-sm outline-none focus:ring-2 focus:ring-blue-50"
                  >
                    <option value="ALL">ALL DEPARTMENTS</option>
                    {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <button 
                  onClick={clearFilters}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all h-[28px]"
                >
                  Clear All
                </button>
              </div>

              <div className="flex-1 overflow-hidden bg-slate-50/20 p-2 px-6 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Records</h4>
                    <p className="text-[10px] font-bold text-slate-500">Showing {filteredStudents.length} students</p>
                  </div>
                  <div className="px-2 py-0.5 bg-white rounded-lg border border-slate-100 shadow-sm flex items-center gap-2">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Count:</span>
                    <span className="text-xs font-black text-blue-600">{filteredStudents.length}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-0">
                  <div className="overflow-y-auto h-full custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-50 z-10">
                        <tr>
                          <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                          <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Matric No</th>
                          <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Faculty</th>
                          <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                          <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Campus</th>
                          <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Gender</th>
                          <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">DOB</th>
                          <th className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Programme</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-slate-400 italic font-medium">No students found for this selection</td>
                          </tr>
                        ) : filteredStudents.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-2">
                              <p className="text-xs font-bold text-slate-900">{s.firstName} {s.lastName}</p>
                              <p className="text-[9px] text-blue-500 font-mono">LASRRA: {s.lasrraId}</p>
                            </td>
                            <td className="px-6 py-2">
                              <span className="text-[10px] font-mono text-slate-600">{s.matricNumber}</span>
                            </td>
                            <td className="px-6 py-2">
                              <p className="text-[9px] font-bold text-slate-700 line-clamp-1">{faculties.find(f => f.id === s.facultyId)?.name}</p>
                            </td>
                            <td className="px-6 py-2">
                              <p className="text-[9px] text-slate-400 font-medium line-clamp-1">{departments.find(d => d.id === s.departmentId)?.name}</p>
                            </td>
                            <td className="px-6 py-2">
                              <p className="text-[9px] text-slate-400 uppercase tracking-tighter font-bold">{s.campus || 'Main'}</p>
                            </td>
                            <td className="px-6 py-2 text-[10px] font-bold text-slate-600">{s.sex || 'N/A'}</td>
                            <td className="px-6 py-2 text-[10px] font-mono text-slate-600">{s.dob || 'N/A'}</td>
                            <td className="px-6 py-2">
                              <p className="text-[10px] font-bold text-slate-600">{s.programmeType}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Executive Dashboard Component
 * 
 * The primary entry point for high-level oversight.
 * Aggregates data from multiple Firestore collections to provide
 * real-time statistics on students, staff, facilities, and academic impact.
 */
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [globalInstFilter, setGlobalInstFilter] = useState<string>('ALL');
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [isStaffDrillDownOpen, setIsStaffDrillDownOpen] = useState(false);
  const [isFacilityDrillDownOpen, setIsFacilityDrillDownOpen] = useState(false);
  const [isStemDrillDownOpen, setIsStemDrillDownOpen] = useState(false);
  const [rawData, setRawData] = useState<{
    students: Student[];
    staff: Staff[];
    publications: Publication[];
    trainings: Training[];
    institutions: Institution[];
    faculties: Faculty[];
    facilities: Facility[];
    departments: Department[];
    loading: boolean;
  }>({
    students: [],
    staff: [],
    publications: [],
    trainings: [],
    institutions: [],
    faculties: [],
    facilities: [],
    departments: [],
    loading: true
  });

  useEffect(() => {
    const performGlobalPurge = async () => {
      const hasPurgedMain = localStorage.getItem('global_purge_completed');
      const hasPurgedLeadership = localStorage.getItem('leadership_purge_completed');
      const hasPurgedAlumni = localStorage.getItem('alumni_purge_completed');
      const hasPurgedStaffNew = localStorage.getItem('staff_purge_fresh_v1');
      const hasPurgedFacilsNew = localStorage.getItem('facils_purge_fresh_v1');
      const hasPurgedFinalRequest = localStorage.getItem('purge_research_training_users_v1');
      
      if (hasPurgedMain && hasPurgedLeadership && hasPurgedAlumni && hasPurgedStaffNew && hasPurgedFacilsNew && hasPurgedFinalRequest) return;

      console.log('Starting global purge...');
      const collectionsToPurge = [];
      if (!hasPurgedMain) collectionsToPurge.push('publications', 'trainings', 'logs');
      if (!hasPurgedLeadership) collectionsToPurge.push('leadership_tenures');
      if (!hasPurgedAlumni || !hasPurgedMain) collectionsToPurge.push('students');
      if (!hasPurgedStaffNew) collectionsToPurge.push('staff');
      if (!hasPurgedFacilsNew) {
        collectionsToPurge.push('facilities');
        collectionsToPurge.push('maintenance_logs');
      }
      if (!hasPurgedFinalRequest) {
        collectionsToPurge.push('publications');
        collectionsToPurge.push('trainings');
        collectionsToPurge.push('users');
      }
      
      // Remove duplicates
      const uniqueCollections = Array.from(new Set(collectionsToPurge));
      
      try {
        for (const coll of uniqueCollections) {
          console.log(`Checking collection: ${coll}`);
          let snap;
          try {
            snap = await getDocs(collection(db, coll));
          } catch (e) {
            console.error(`Failed to list collection ${coll}:`, e);
            continue; // Continue to next collection if list fails
          }
          
          if (snap.empty) {
            console.log(`Collection ${coll} is empty.`);
            continue;
          }

          console.log(`Purging ${snap.size} records from ${coll}...`);
          
          // Delete in batches
          for (let i = 0; i < snap.docs.length; i += 500) {
            const batch = writeBatch(db);
            const chunk = snap.docs.slice(i, i + 500);
            chunk.forEach(d => {
              // Special case: preserve current user if purging 'users'
              if (coll === 'users' && d.id === user?.id) return;
              batch.delete(d.ref);
            });
            try {
              await batch.commit();
            } catch (e) {
              console.error(`Failed to delete batch for ${coll}:`, e);
              // Don't break completely, try other collections
            }
          }
        }
        localStorage.setItem('global_purge_completed', 'true');
        localStorage.setItem('leadership_purge_completed', 'true');
        localStorage.setItem('alumni_purge_completed', 'true');
        localStorage.setItem('staff_purge_fresh_v1', 'true');
        localStorage.setItem('facils_purge_fresh_v1', 'true');
        localStorage.setItem('purge_research_training_users_v1', 'true');
        console.log('Purge completed.');
        window.location.reload();
      } catch (error) {
        console.error('Purge totally failed:', error);
      }
    };

    if (user?.role === 'SuperUser') {
      performGlobalPurge();
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsSnap, staffSnap, instSnap, facultiesSnap, facilitiesSnap, deptSnap, pubSnap, trainSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'staff')),
          getDocs(collection(db, 'institutions')),
          getDocs(collection(db, 'faculties')),
          getDocs(collection(db, 'facilities')),
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'publications')),
          getDocs(collection(db, 'trainings'))
        ]);

        setRawData({
          students: studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)),
          staff: staffSnap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)),
          publications: pubSnap.docs.map(d => ({ id: d.id, ...d.data() } as Publication)),
          trainings: trainSnap.docs.map(d => ({ id: d.id, ...d.data() } as Training)),
          institutions: instSnap.docs.map(d => ({ id: d.id, ...d.data() } as Institution)),
          faculties: facultiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Faculty)),
          facilities: facilitiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Facility)),
          departments: deptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Department)),
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const processedData = useMemo(() => {
    const { students, staff, institutions, faculties, facilities, departments, publications, trainings } = rawData;

    const filteredRawStudents = globalInstFilter === 'ALL' ? students : students.filter(s => s.institutionId === globalInstFilter);
    const filteredRawStaff = globalInstFilter === 'ALL' ? staff : staff.filter(s => s.institutionId === globalInstFilter);
    const filteredRawFacilities = globalInstFilter === 'ALL' ? facilities : facilities.filter(f => f.institutionId === globalInstFilter);
    const filteredRawPubs = globalInstFilter === 'ALL' ? publications : publications.filter(p => {
      const author = staff.find(s => s.id === p.staffId);
      return author?.institutionId === globalInstFilter;
    });
    const filteredRawTrainings = globalInstFilter === 'ALL' ? trainings : trainings.filter(t => {
      const member = staff.find(s => s.id === t.staffId);
      return member?.institutionId === globalInstFilter;
    });

    const realStudents = filteredRawStudents.filter(s => s.lasrraId); // Better check than isSeed
    const realStaff = filteredRawStaff.filter(s => s.lasrraId);
    const realPublications = filteredRawPubs;
    const realTrainings = filteredRawTrainings;
    const realInstitutions = [...institutions].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
    const realFaculties = globalInstFilter === 'ALL' ? faculties : faculties.filter(f => f.institutionId === globalInstFilter);
    const realFacilities = filteredRawFacilities;
    const realDepts = globalInstFilter === 'ALL' ? departments : departments.filter(d => {
      const faculty = faculties.find(f => f.id === d.facultyId);
      return faculty?.institutionId === globalInstFilter;
    });

    const stemRatioData = getStemRatioData(realStudents, realDepts);

    // Staff Distribution
    const staffDist: Record<string, number> = realStaff.reduce((acc: Record<string, number>, curr) => {
      acc[curr.staffType] = (acc[curr.staffType] || 0) + 1;
      return acc;
    }, {});
    const staffDistribution = Object.entries(staffDist).map(([name, value]) => ({ name, value }));

    // Facility Distribution
    const facilityDist: Record<string, number> = realFacilities.reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});
    const facilityDistribution = Object.entries(facilityDist).map(([name, value]) => ({ name, value }));

    // STEM Distribution
    const stemDistribution = [
      { name: 'STEM', value: stemRatioData.stem },
      { name: 'Non-STEM', value: stemRatioData.total - stemRatioData.stem }
    ];

    // Gender Distribution
    const genderDist: Record<string, number> = realStudents.reduce((acc: Record<string, number>, curr) => {
      acc[curr.sex] = (acc[curr.sex] || 0) + 1;
      return acc;
    }, {});
    const genderDistribution = Object.entries(genderDist).map(([name, value]) => ({ name, value }));

    const lastUpdatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const lastUpdated = `Last Updated: ${lastUpdatedDate}`;
    const selectedInstitution = globalInstFilter === 'ALL' ? null : institutions.find(i => i.id === globalInstFilter);

    // Enrollment trends
    const enrollmentYears = Array.from(new Set(realStudents.map(s => s.admissionYear?.split('-')[0]).filter(Boolean) as string[])).sort();
    const enrollmentData = enrollmentYears.map(year => ({
      year,
      students: realStudents.filter(s => s.admissionYear?.startsWith(year)).length,
      graduates: 0
    }));

    // Institution distribution
    const dist: Record<string, number> = (globalInstFilter === 'ALL' ? realInstitutions : realInstitutions.filter(i => i.id === globalInstFilter)).reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});
    const institutionDistribution = Object.entries(dist).map(([name, value]) => ({ name, value }));

    // Age Distribution
    const ageGroups = [
      { name: 'Under 18', value: 0 },
      { name: '18-22', value: 0 },
      { name: '23-27', value: 0 },
      { name: '28-35', value: 0 },
      { name: 'Over 35', value: 0 },
      { name: 'Unknown', value: 0 }
    ];

    realStudents.forEach(s => {
      if (s.dob) {
        try {
          const birthDate = new Date(s.dob);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          if (age < 18) ageGroups[0].value++;
          else if (age <= 22) ageGroups[1].value++;
          else if (age <= 27) ageGroups[2].value++;
          else if (age <= 35) ageGroups[3].value++;
          else ageGroups[4].value++;
        } catch (e) {
          ageGroups[5].value++;
        }
      } else {
        ageGroups[5].value++;
      }
    });
    const ageDistribution = ageGroups.filter(g => g.value > 0);

    return {
      stats: {
        students: realStudents.length,
        staff: realStaff.length,
        institutions: globalInstFilter === 'ALL' ? realInstitutions.length : 1,
        facilities: realFacilities.length,
        publications: realPublications.length,
        trainings: realTrainings.length,
        stemRatio: stemRatioData.percentage,
        stemRatioString: stemRatioData.ratioString
      },
      enrollmentData: enrollmentData.length > 0 ? enrollmentData : [{ year: '2024', students: 0, graduates: 0 }],
      institutionDistribution,
      genderDistribution,
      ageDistribution,
      staffDistribution,
      facilityDistribution,
      stemDistribution,
      recentFacilities: realFacilities.slice(0, 5),
      recentPublications: realPublications.slice(0, 5),
      realInstitutions,
      realFaculties,
      realDepts,
      realStudents,
      lastUpdated,
      selectedInstitution
    };
  }, [rawData, globalInstFilter]);

  const canDrillDown = useMemo(() => {
    return ['SuperUser', 'DirectorAdminHR', 'DirectorStandards', 'DirectorInspection', 'DirectorInfrastructure', 'DirectorResearch'].includes(user?.role || '');
  }, [user]);

  if (rawData.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-8 flex-1">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
            <p className="text-slate-500 italic serif">Real-time oversight of Lagos State Tertiary Education</p>
          </div>
          
          {user?.role === 'SuperUser' && (
            <div className="flex-1 max-w-sm">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Institution focus</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <School size={16} />
                </div>
                <select 
                  value={globalInstFilter}
                  onChange={(e) => setGlobalInstFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none transition-all text-sm font-bold text-slate-700 shadow-sm group-hover:shadow"
                >
                  <option value="ALL">ALL INSTITUTIONS (GLOBAL)</option>
                  {processedData.realInstitutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
            title="Download Report"
          >
            <TrendingDown size={20} className="rotate-180" />
          </button>
          <Link 
            to="/analytics"
            className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-100"
          >
            <BarChart2 size={18} />
            Analytics
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <StatCard 
          title="Total Students" 
          value={processedData.stats.students.toLocaleString()} 
          icon={<GraduationCap size={24} />} 
          color="bg-blue-600"
          onClick={canDrillDown ? () => setIsDrillDownOpen(true) : undefined}
          drillable={canDrillDown}
          footer={processedData.lastUpdated}
          extra={
            <div className="h-full w-full flex flex-col items-center justify-center">
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const total = processedData.stats.students;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return [`${value.toLocaleString()} (${percentage}%)`, name];
                      }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Pie
                      data={processedData.genderDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
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
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="900" className="drop-shadow-md">
                            {value.toLocaleString()}
                          </text>
                        );
                      }}
                    >
                      <Cell fill="#2563eb" stroke="#fff" strokeWidth={2} />
                      <Cell fill="#ec4899" stroke="#fff" strokeWidth={2} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-600"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Male</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-pink-500"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Female</span>
                </div>
              </div>
            </div>
          }
        />
        <StatCard 
          title="Staff Strength" 
          value={processedData.stats.staff.toLocaleString()} 
          icon={<Users size={24} />} 
          color="bg-emerald-600"
          onClick={canDrillDown ? () => setIsStaffDrillDownOpen(true) : undefined}
          drillable={canDrillDown}
          footer={processedData.lastUpdated}
          extra={
            <div className="h-full w-full flex flex-col items-center justify-center">
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const total = processedData.stats.staff;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return [`${value.toLocaleString()} (${percentage}%)`, name];
                      }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Pie
                      data={processedData.staffDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
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
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="900" className="drop-shadow-md">
                            {value.toLocaleString()}
                          </text>
                        );
                      }}
                    >
                      <Cell fill="#10b981" stroke="#fff" strokeWidth={2} />
                      <Cell fill="#3b82f6" stroke="#fff" strokeWidth={2} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Academic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Non-Acad</span>
                </div>
              </div>
            </div>
          }
        />
        <StatCard 
          title="Total Facilities" 
          value={processedData.stats.facilities.toLocaleString()} 
          icon={<Building2 size={24} />} 
          color="bg-amber-600"
          onClick={canDrillDown ? () => setIsFacilityDrillDownOpen(true) : undefined}
          drillable={canDrillDown}
          footer={processedData.lastUpdated}
          extra={
            <div className="h-full w-full flex flex-col items-center justify-center">
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const total = processedData.stats.facilities;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return [`${value.toLocaleString()} (${percentage}%)`, name];
                      }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Pie
                      data={processedData.facilityDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
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
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="900" className="drop-shadow-md">
                            {value.toLocaleString()}
                          </text>
                        );
                      }}
                    >
                      {processedData.facilityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                {processedData.facilityDistribution.slice(0, 3).map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[60px]">{entry.name}</span>
                  </div>
                ))}
                {processedData.facilityDistribution.length > 3 && (
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">+{processedData.facilityDistribution.length - 3} More</span>
                )}
              </div>
            </div>
          }
        />
        <StatCard 
          title="STEM:Non-STEM Ratio" 
          value={processedData.stats.stemRatioString} 
          icon={<TrendingUp size={24} />} 
          color="bg-purple-600"
          onClick={canDrillDown ? () => setIsStemDrillDownOpen(true) : undefined}
          drillable={canDrillDown}
          footer={processedData.lastUpdated}
          label="Compliance"
          extra={
            <div className="h-full w-full flex flex-col items-center justify-center">
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const total = processedData.stats.students;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return [`${value.toLocaleString()} (${percentage}%)`, name];
                      }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Pie
                      data={processedData.stemDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
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
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="900" className="drop-shadow-md">
                            {value.toLocaleString()}
                          </text>
                        );
                      }}
                    >
                      <Cell fill="#9333ea" stroke="#fff" strokeWidth={2} />
                      <Cell fill="#cbd5e1" stroke="#fff" strokeWidth={2} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-600"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">STEM</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-300"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Non-STEM</span>
                </div>
              </div>
            </div>
          }
        />
        <StatCard 
          title="Research Outputs" 
          value={processedData.stats.publications.toLocaleString()} 
          icon={<BookOpen size={24} />} 
          color="bg-indigo-600"
          footer={processedData.lastUpdated}
          label="Total Publications"
        />
        <StatCard 
          title="Staff Trainings" 
          value={processedData.stats.trainings.toLocaleString()} 
          icon={<Activity size={24} />} 
          color="bg-pink-600"
          footer={processedData.lastUpdated}
          label="Conducted Sessions"
        />
      </div>
      
      {/* Demographics Audit Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in slide-in-from-bottom duration-700">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
           <div className="flex items-center justify-between mb-8 w-full">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Gender Distribution</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Equality Audit</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users size={24} />
            </div>
          </div>
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.genderDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {processedData.genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Male' ? '#4f46e5' : '#ec4899'} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const total = processedData.stats.students;
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return [`${value.toLocaleString()} (${percentage}%)`, name];
                  }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Age Demographics</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Enrollment Portfolio</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Activity size={24} />
            </div>
          </div>
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}}
                />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enrollment Trends */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Enrollment & Graduation Trends</h3>
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Historical Data (5 Years)</p>
            </div>
            {processedData.selectedInstitution && (
              <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                <School size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">
                  {processedData.selectedInstitution.shortName} Data Only
                </span>
              </div>
            )}
          </div>
          <div className="h-[350px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={processedData.enrollmentData}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="students" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorStudents)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="graduates" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Institution Distribution */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 lg:col-span-1">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Institution Types</h3>
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-8">Current Distribution</p>
          <div className="h-[250px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={processedData.institutionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {processedData.institutionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const total = processedData.stats.institutions;
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return [`${value.toLocaleString()} (${percentage}%)`, name];
                  }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {processedData.institutionDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-sm font-semibold text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Facilities */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Facilities</h3>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Maintenance & New Builds</p>
          </div>
          <button className="text-blue-600 font-bold text-sm hover:underline">View All Facilities</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility Name</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacity</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funding Source</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {processedData.recentFacilities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">No facilities found</td>
                </tr>
              ) : processedData.recentFacilities.map((project, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-8 py-4">
                    <p className="text-sm font-bold text-slate-900">{project.name}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-semibold text-slate-600">
                      {processedData.realInstitutions.find(inst => inst.id === project.institutionId)?.name || 'Unknown'}
                    </p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-mono text-slate-500">{project.capacity}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">
                      {project.fundingSource}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full bg-green-500`}></span>
                      <span className="text-sm font-semibold text-slate-600">Active</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDrillDownOpen && (
        <DrillDownModal
          isOpen={isDrillDownOpen}
          initialInstitutionId={globalInstFilter === 'ALL' ? null : globalInstFilter}
          onClose={() => setIsDrillDownOpen(false)}
          students={processedData.realStudents}
          institutions={processedData.realInstitutions}
          faculties={processedData.realFaculties}
          departments={processedData.realDepts}
        />
      )}

      {isStaffDrillDownOpen && (
        <StaffDrillDownModal
          isOpen={isStaffDrillDownOpen}
          initialInstitutionId={globalInstFilter === 'ALL' ? null : globalInstFilter}
          onClose={() => setIsStaffDrillDownOpen(false)}
          staff={rawData.staff}
          institutions={processedData.realInstitutions}
          faculties={processedData.realFaculties}
          departments={processedData.realDepts}
        />
      )}

      {isFacilityDrillDownOpen && (
        <FacilityDrillDownModal
          isOpen={isFacilityDrillDownOpen}
          initialInstitutionId={globalInstFilter === 'ALL' ? null : globalInstFilter}
          onClose={() => setIsFacilityDrillDownOpen(false)}
          facilities={rawData.facilities}
          institutions={processedData.realInstitutions}
        />
      )}

      {isStemDrillDownOpen && (
        <StemDrillDownModal
          isOpen={isStemDrillDownOpen}
          initialInstitutionId={globalInstFilter === 'ALL' ? null : globalInstFilter}
          onClose={() => setIsStemDrillDownOpen(false)}
          students={processedData.realStudents}
          institutions={processedData.realInstitutions}
          departments={processedData.realDepts}
        />
      )}
    </div>
  );
};
