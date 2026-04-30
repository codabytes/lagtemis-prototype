import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  Wrench, 
  ArrowLeft,
  Plus,
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  User,
  Info
} from 'lucide-react';
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, logAudit } from '../firebase';
import { Facility, Institution, MaintenanceLog } from '../types';

import { useAuth } from './AuthGuard';

export const FacilityProfile: React.FC = () => {
  const { canManage } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newLog, setNewLog] = useState<Partial<MaintenanceLog>>({
    maintenanceType: 'Inspection',
    workPerformed: '',
    completedAt: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const facilityDoc = await getDoc(doc(db, 'facilities', id));
        if (facilityDoc.exists()) {
          const facilityData = { id: facilityDoc.id, ...facilityDoc.data() } as Facility;
          setFacility(facilityData);

          const [instDoc, logsSnap] = await Promise.all([
            getDoc(doc(db, 'institutions', facilityData.institutionId)),
            getDocs(query(collection(db, 'maintenance_logs'), where('facilityId', '==', id), orderBy('completedAt', 'desc')))
          ]);

          if (instDoc.exists()) setInstitution({ id: instDoc.id, ...instDoc.data() } as Institution);
          setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceLog)));
        }
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `facilities/${id}`);
      }
    };

    fetchData();
  }, [id]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility || !id || !canManage('facilities')) return;

    try {
      const logData = {
        ...newLog,
        facilityId: id,
        facilityName: facility.name,
      };
      const docRef = await addDoc(collection(db, 'maintenance_logs'), logData);
      await logAudit('CREATE', 'maintenance_logs', docRef.id, `Added maintenance log for: ${facility.name}`);
      
      setLogs([{ id: docRef.id, ...logData } as MaintenanceLog, ...logs]);
      setIsModalOpen(false);
      setNewLog({
        maintenanceType: 'Inspection',
        workPerformed: '',
        completedAt: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'maintenance_logs');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Facility not found</h2>
        <button onClick={() => navigate('/facilities/management')} className="mt-4 text-blue-600 font-bold flex items-center gap-2 mx-auto">
          <ArrowLeft size={20} /> Back to Management
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/facilities/management')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm"
        >
          <ArrowLeft size={20} />
          Back to Facilities
        </button>
        {canManage('facilities') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100"
          >
            <Plus size={20} />
            Add Maintenance Record
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Consolidated Facility Details Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Building2 size={48} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{facility.name}</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{facility.assetId}</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Institution</p>
                <p className="text-sm font-bold text-slate-700">{institution?.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type</p>
                  <p className="text-sm font-bold text-slate-700">{facility.type}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                  <p className="text-sm font-bold text-slate-700">{facility.capacity}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                <p className="text-sm font-bold text-slate-700">{facility.campus} - {facility.location}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                  <p className="text-sm font-bold text-slate-700">{facility.dateCompleted}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Funding</p>
                  <p className="text-sm font-bold text-slate-700">{facility.fundingSource}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900">Maintenance History</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Wrench size={16} />
                {logs.length} Records
              </div>
            </div>

            <div className="space-y-6">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic">
                  No maintenance records found for this facility.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-6 relative group">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center z-10 ${
                        log.maintenanceType === 'Routine' ? 'bg-emerald-50 text-emerald-600' :
                        log.maintenanceType === 'Repair/Replacement' ? 'bg-rose-50 text-rose-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {log.maintenanceType === 'Routine' && <CheckCircle2 size={20} />}
                        {log.maintenanceType === 'Repair/Replacement' && <AlertTriangle size={20} />}
                        {log.maintenanceType === 'Inspection' && <Activity size={20} />}
                      </div>
                      <div className="w-0.5 flex-1 bg-slate-100 my-2"></div>
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900">{log.maintenanceType} Maintenance</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Clock size={12} />
                          {new Date(log.completedAt).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{log.workPerformed}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Maintenance Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add Maintenance Record</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddLog} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Facility Name</label>
                <input
                  disabled
                  type="text"
                  value={facility.name}
                  className="w-full px-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm font-bold text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maintenance Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {['Inspection', 'Routine', 'Repair/Replacement'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewLog({ ...newLog, maintenanceType: type as any })}
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                        newLog.maintenanceType === type 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                      {newLog.maintenanceType === type && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Work Performed</label>
                <textarea
                  required
                  placeholder="Describe the task performed..."
                  value={newLog.workPerformed}
                  onChange={(e) => setNewLog({ ...newLog, workPerformed: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm h-32 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Completed</label>
                <input
                  required
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={newLog.completedAt}
                  onChange={(e) => setNewLog({ ...newLog, completedAt: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm font-bold"
                />
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
