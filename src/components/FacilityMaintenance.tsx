import React, { useEffect, useState } from 'react';
import { 
  Wrench, 
  Search, 
  Calendar, 
  Clock, 
  FileText,
  CheckCircle2,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MaintenanceLog } from '../types';

export const FacilityMaintenance: React.FC = () => {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    maintenanceType: 'all',
    completionDate: ''
  });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsSnap = await getDocs(query(collection(db, 'maintenance_logs'), orderBy('completedAt', 'desc')));
        setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceLog)));
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'maintenance_logs');
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const searchStr = `${log.id} ${log.facilityName} ${log.workPerformed}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      
      const matchesType = filters.maintenanceType === 'all' || log.maintenanceType === filters.maintenanceType;
      const matchesDate = !filters.completionDate || log.completedAt === filters.completionDate;

      return matchesSearch && matchesType && matchesDate;
    });
  }, [logs, searchTerm, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Facility Maintenance</h1>
        <p className="text-slate-500 italic serif text-sm">Tracking repairs and preventive maintenance logs</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by Job ID, Facility Name, or Work Performed"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl transition-all duration-200 text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Maintenance Type</label>
            <select 
              value={filters.maintenanceType}
              onChange={(e) => setFilters(prev => ({ ...prev, maintenanceType: e.target.value }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
            >
              <option value="all">ALL TYPES</option>
              {['Inspection', 'Routine', 'Repair/Replacement'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Completion Date</label>
            <input
              type="date"
              value={filters.completionDate}
              onChange={(e) => setFilters(prev => ({ ...prev, completionDate: e.target.value }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
            />
          </div>

          <button 
            onClick={() => {
              setFilters({
                maintenanceType: 'all',
                completionDate: ''
              });
              setSearchTerm('');
            }}
            className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all h-[42px] flex items-center justify-center gap-2"
          >
            Clear All
          </button>
        </div>

        <div className="pt-2 border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {searchTerm || filters.maintenanceType !== 'all' || filters.completionDate ? 
              `Showing ${filteredLogs.length} matching record${filteredLogs.length !== 1 ? 's' : ''}` : 
              `Total Maintenance Logs: ${filteredLogs.length}`
            }
          </p>
        </div>
      </div>

      {/* Maintenance Logs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maintenance Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Performed</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4 h-16 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No maintenance records found</td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Wrench size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 leading-tight">{log.facilityName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {log.facilityId.slice(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit border ${
                      log.maintenanceType === 'Routine' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      log.maintenanceType === 'Repair/Replacement' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {log.maintenanceType === 'Routine' && <CheckCircle2 size={10} />}
                      {log.maintenanceType === 'Repair/Replacement' && <AlertTriangle size={10} />}
                      {log.maintenanceType === 'Inspection' && <Activity size={10} />}
                      {log.maintenanceType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 leading-relaxed max-w-md">{log.workPerformed}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 whitespace-nowrap">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(log.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
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
