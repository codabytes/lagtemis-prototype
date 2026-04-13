import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  ArrowRight,
  School
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
import { collection, getDocs, addDoc, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Staff, Institution, Facility, Faculty, Department } from '../types';
import { useAuth } from './AuthGuard';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend?: { value: string; positive: boolean };
  color: string;
}> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend.value}
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900 tabular-nums">{value}</h3>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [rawData, setRawData] = useState<{
    students: Student[];
    staff: Staff[];
    institutions: Institution[];
    facilities: Facility[];
    departments: Department[];
    loading: boolean;
  }>({
    students: [],
    staff: [],
    institutions: [],
    facilities: [],
    departments: [],
    loading: true
  });

  useEffect(() => {
    const performGlobalPurge = async () => {
      const hasPurged = localStorage.getItem('global_purge_completed');
      if (hasPurged) return;

      console.log('Starting global purge of non-institutional tables...');
      const collectionsToPurge = ['students', 'staff', 'facilities', 'publications', 'trainings', 'logs', 'maintenance_logs'];
      
      try {
        for (const coll of collectionsToPurge) {
          const snap = await getDocs(collection(db, coll));
          if (snap.empty) continue;

          console.log(`Purging ${snap.size} records from ${coll}...`);
          
          // Delete in batches
          for (let i = 0; i < snap.docs.length; i += 500) {
            const batch = writeBatch(db);
            const chunk = snap.docs.slice(i, i + 500);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
        }
        localStorage.setItem('global_purge_completed', 'true');
        console.log('Global purge completed successfully.');
        window.location.reload();
      } catch (error) {
        console.error('Global purge failed:', error);
      }
    };

    if (user?.role === 'SuperUser') {
      performGlobalPurge();
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsSnap, staffSnap, instSnap, facilitiesSnap, deptSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'staff')),
          getDocs(collection(db, 'institutions')),
          getDocs(collection(db, 'facilities')),
          getDocs(collection(db, 'departments'))
        ]);

        setRawData({
          students: studentsSnap.docs.map(d => d.data() as Student),
          staff: staffSnap.docs.map(d => d.data() as Staff),
          institutions: instSnap.docs.map(d => d.data() as Institution),
          facilities: facilitiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Facility)),
          departments: deptSnap.docs.map(d => d.data() as Department),
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const processedData = useMemo(() => {
    const { students, staff, institutions, facilities, departments } = rawData;

    const realStudents = students.filter(s => !(s as any).isSeed);
    const realStaff = staff.filter(s => !(s as any).isSeed);
    const realInstitutions = institutions.filter(i => !(i as any).isSeed);
    const realFacilities = facilities.filter(i => !i.isSeed);
    const realDepts = departments.filter(d => !(d as any).isSeed);

    const stemStudentsCount = realStudents.filter(s => {
      const dept = departments.find(d => d.id === s.departmentId);
      return dept?.isSTEM;
    }).length;
    
    const stemRatio = realStudents.length > 0 
      ? Math.round((stemStudentsCount / realStudents.length) * 100) 
      : 0;

    // Enrollment trends
    const years = Array.from(new Set(realStudents.map(s => s.admissionYear?.split('-')[0]))).sort();
    const enrollmentData = years.map(year => ({
      year,
      students: realStudents.filter(s => s.admissionYear?.startsWith(year)).length,
      graduates: realStudents.filter(s => s.enrollmentStatus === 'Graduated' && s.graduationYear?.startsWith(year)).length
    }));

    // Institution distribution
    const dist: Record<string, number> = realInstitutions.reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});
    const institutionDistribution = Object.entries(dist).map(([name, value]) => ({ name, value }));

    return {
      stats: {
        students: realStudents.length,
        staff: realStaff.length,
        institutions: realInstitutions.length,
        facilities: realFacilities.length,
        stemRatio
      },
      enrollmentData: enrollmentData.length > 0 ? enrollmentData : [{ year: '2024', students: 0, graduates: 0 }],
      institutionDistribution,
      recentFacilities: realFacilities.slice(0, 5),
      realInstitutions
    };
  }, [rawData]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 italic serif">Real-time oversight of Lagos State Tertiary Education</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={processedData.stats.students.toLocaleString()} 
          icon={<GraduationCap size={24} />} 
          trend={{ value: '12.5%', positive: true }}
          color="bg-blue-500"
        />
        <StatCard 
          title="Academic Staff" 
          value={processedData.stats.staff.toLocaleString()} 
          icon={<Users size={24} />} 
          trend={{ value: '3.2%', positive: true }}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Facilities" 
          value={processedData.stats.facilities} 
          icon={<Building2 size={24} />} 
          color="bg-amber-500"
        />
        <StatCard 
          title="STEM Ratio" 
          value={`${processedData.stats.stemRatio}%`} 
          icon={<TrendingUp size={24} />} 
          trend={{ value: 'Target: 60%', positive: true }}
          color="bg-purple-500"
        />
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
            <select className="bg-slate-50 border-none text-sm font-semibold rounded-lg px-3 py-1 text-slate-600 outline-none focus:ring-2 focus:ring-blue-100">
              <option>All Institutions</option>
              <option>LASU</option>
              <option>LASPOTECH</option>
            </select>
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
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
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
                <Tooltip />
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
    </div>
  );
};
