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

  const filteredLogs = logs.filter(log => 
    log.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.workPerformed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Facility Maintenance</h1>
        <p className="text-slate-500 italic serif text-sm">Tracking repairs and preventive maintenance logs</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by facility or work description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200 text-sm"
          />
        </div>
      </div>

      {/* Maintenance Logs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility Asset</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
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
                      log.maintenanceType === 'Preventive' || log.maintenanceType === 'Routine' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      log.maintenanceType === 'Corrective' || log.maintenanceType === 'Repair' || log.maintenanceType === 'Emergency' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {(log.maintenanceType === 'Preventive' || log.maintenanceType === 'Routine') && <CheckCircle2 size={10} />}
                      {(log.maintenanceType === 'Corrective' || log.maintenanceType === 'Repair' || log.maintenanceType === 'Emergency') && <AlertTriangle size={10} />}
                      {(log.maintenanceType === 'Predictive' || log.maintenanceType === 'Inspection') && <Activity size={10} />}
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
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock size={10} />
                        {new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
