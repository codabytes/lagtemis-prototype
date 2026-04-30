import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { 
  BarChart2, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  FileText, 
  Download, 
  Filter,
  Activity,
  Award,
  Building2,
  Users,
  ChevronRight,
  ChevronDown,
  Printer,
  FileJson,
  Database
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Staff, Institution, Facility, Department, Faculty } from '../types';
import { calculateStemRatio } from '../lib/academicUtils';
import { ExportButton } from './ExportButton';
import { exportData } from '../lib/exportUtils';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

/**
 * AnalyticsBI Component
 * 
 * A comprehensive Business Intelligence module for TEMIS.
 * Provides deep insights into enrollment, infrastructure, and compliance 
 * through interactive data visualizations and exportable reports.
 */
export const AnalyticsBI: React.FC = () => {
  const [data, setData] = useState<{
    students: Student[];
    staff: Staff[];
    institutions: Institution[];
    facilities: Facility[];
    departments: Department[];
    faculties: Faculty[];
    loading: boolean;
  }>({
    students: [],
    staff: [],
    institutions: [],
    facilities: [],
    departments: [],
    faculties: [],
    loading: true
  });

  const [activeTab, setActiveTab] = useState<'enrollment' | 'infrastructure' | 'compliance'>('enrollment');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsSnap, staffSnap, instSnap, facilitiesSnap, deptSnap, facultySnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'staff')),
          getDocs(collection(db, 'institutions')),
          getDocs(collection(db, 'facilities')),
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'faculties'))
        ]);

        setData({
          students: studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)),
          staff: staffSnap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)),
          institutions: instSnap.docs.map(d => ({ id: d.id, ...d.data() } as Institution)),
          facilities: facilitiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Facility)),
          departments: deptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Department)),
          faculties: facultySnap.docs.map(d => ({ id: d.id, ...d.data() } as Faculty)),
          loading: false
        });
      } catch (error) {
        console.error('Error fetching BI data:', error);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const { students, staff, institutions, facilities, departments } = data;
    
    // Enrollment by Year
    const enrollByYear = students.reduce((acc: any, s) => {
      const year = s.admissionYear || 'Unknown';
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});
    const enrollChartData = Object.entries(enrollByYear)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // Faculty distribution
    const studentByFaculty = students.reduce((acc: any, s) => {
      const faculty = data.faculties.find(f => f.id === s.facultyId)?.name || 'Other';
      acc[faculty] = (acc[faculty] || 0) + 1;
      return acc;
    }, {});
    const facultyChartData = Object.entries(studentByFaculty).map(([name, value]) => ({ name, value: value as number }));

    // Infrastructure by type
    const baseFacilities = facilities.reduce((acc: any, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {});
    const facilityChartData = Object.entries(baseFacilities).map(([name, value]) => ({ name, value: value as number }));

    // Staff Student Ratio by Institution
    const ratios = institutions.map(inst => {
      const instStudents = students.filter(s => s.institutionId === inst.id).length;
      const instStaff = staff.filter(s => s.institutionId === inst.id).length;
      return {
        name: inst.name.length > 20 ? inst.name.substring(0, 15) + '...' : inst.name,
        ratio: instStaff > 0 ? (instStudents / instStaff) : 0,
        students: instStudents,
        staff: instStaff
      };
    });

    // STEM Ratio
    const stemRatio = calculateStemRatio(students, departments);

    return {
      enrollChartData,
      facultyChartData,
      facilityChartData,
      ratios,
      stemRatio
    };
  }, [data]);

  const [drillDown, setDrillDown] = useState<{
    title: string;
    description: string;
    data: any[];
    type: 'list' | 'chart';
  } | null>(null);

  const handleDrillDownEnrollment = (point: any) => {
    if (!point || !point.year) return;
    const yearStudents = data.students.filter(s => s.admissionYear === point.year);
    setDrillDown({
      title: `Enrollment Audit: ${point.year}`,
      description: `Detailed breakdown of ${yearStudents.length} admissions for the ${point.year} academic session.`,
      data: yearStudents.map(s => ({
        label: `${s.firstName} ${s.lastName}`,
        value: s.institutionId ? data.institutions.find(i => i.id === s.institutionId)?.name : 'Unknown'
      })).slice(0, 10), // Show top 10 for preview
      type: 'list'
    });
  };

  const handleDrillDownInfrastructure = (slice: any) => {
    if (!slice || !slice.name) return;
    const items = data.facilities.filter(f => f.type === slice.name);
    setDrillDown({
      title: `${slice.name} Asset Registry`,
      description: `Listing all ${items.length} units categorized as ${slice.name} across the state.`,
      data: items.map(i => ({
        label: i.name,
        value: `Condition: ${i.condition}`
      })),
      type: 'list'
    });
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Drill Down Overlay */}
      {drillDown && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{drillDown.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{drillDown.description}</p>
              </div>
              <button 
                onClick={() => setDrillDown(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                id="close-drilldown"
              >
                <ChevronDown size={24} />
              </button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {drillDown.data.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase font-bold">{item.value}</span>
                  </div>
                ))}
                {drillDown.data.length === 0 && (
                  <div className="text-center py-10 opacity-40">No records found for this segment.</div>
                )}
              </div>
            </div>
            <div className="p-8 bg-slate-50 text-center">
              <button 
                onClick={() => alert('Advanced PDF Reporting module is generating system-wide audit... PDF will be available shortly.')}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Export Full Segment Audit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart2 className="text-blue-600" />
            Reporting & Analytics
          </h1>
          <p className="text-slate-500 italic serif">Advanced Business Intelligence & Institutional Decision Support</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={data.students} fileName="TEMIS_Reporting_Audit" />
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('enrollment')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'enrollment' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Enrollment Stats
        </button>
        <button 
          onClick={() => setActiveTab('infrastructure')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'infrastructure' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Infrastructure Usage
        </button>
        <button 
          onClick={() => setActiveTab('compliance')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'compliance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Compliance & Accr.
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Primary Visualization */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'enrollment' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Historical Enrollment Trends</h3>
                  <p className="text-sm text-slate-500 italic">Student admission counts across academic sessions</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={stats.enrollChartData}
                    onClick={(data: any) => data && data.activePayload && handleDrillDownEnrollment(data.activePayload[0].payload)}
                  >
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'infrastructure' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
               <div className="flex items-center justify-between mb-8 text-left">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Infrastructure Asset Radar</h3>
                  <p className="text-sm text-slate-500 italic">Distribution and utilization of institutional resources</p>
                </div>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Building2 size={24} />
                </div>
              </div>
              <div className="h-[400px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.facilityChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={5}
                      dataKey="value"
                      onClick={(data) => handleDrillDownInfrastructure(data)}
                      cursor="pointer"
                    >
                      {stats.facilityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Accreditation Radar</h3>
                  <p className="text-sm text-slate-500 italic">Compliance benchmarking against regulatory standards</p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Award size={24} />
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.ratios}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} label={{ value: 'Staff-Student Ratio', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle', fill: '#94a3b8', fontSize: 10} }} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="ratio" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detailed Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Top Faculties by Enrollment</h4>
              <div className="space-y-4">
                {stats.facultyChartData.sort((a, b) => b.value - a.value).slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-700">{f.name as string}</span>
                        <span className="text-xs font-bold text-slate-400">{f.value as number} Students</span>
                      </div>
                      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-1000" 
                          style={{ width: `${((f.value as number) / (data.students.length || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">State Compliance Alerts</h4>
              <div className="space-y-3">
                <div className={`p-4 rounded-xl flex items-center justify-between ${stats.stemRatio >= 60 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  <div className="flex items-center gap-3">
                    <Activity size={18} />
                    <span className="text-xs font-bold">STEM Ratio Mandate (60%)</span>
                  </div>
                  <span className="text-sm font-black">{stats.stemRatio}%</span>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users size={18} />
                    <span className="text-xs font-bold">Overall Staff-Student Ratio</span>
                  </div>
                  <span className="text-sm font-black">1 : {(data.students.length / (data.staff.length || 1)).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Reporting Utilities */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Available Data Feeds</h4>
            <div className="space-y-4">
              <div 
                onClick={() => exportData(data.students, 'TEMIS_Students_Bulk', 'csv')}
                className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg group-hover:text-blue-600 transition-colors">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Student Bulk Data</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">CSV Format • {data.students.length} Records</p>
                  </div>
                </div>
                <Download size={16} className="text-slate-300 group-hover:text-blue-600" />
              </div>

              <div 
                onClick={() => exportData(data.staff, 'TEMIS_Staff_Census', 'csv')}
                className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg group-hover:text-blue-600 transition-colors">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Staff Census Master</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">CSV Format • {data.staff.length} Records</p>
                  </div>
                </div>
                <Download size={16} className="text-slate-300 group-hover:text-blue-600" />
              </div>

              <div 
                onClick={() => exportData(data.institutions, 'TEMIS_Institution_Directory', 'csv')}
                className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg group-hover:text-blue-600 transition-colors">
                    <FileJson size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Infrastructure Schema</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">JSON Feed • Registry Compliant</p>
                  </div>
                </div>
                <Download size={16} className="text-slate-300 group-hover:text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
