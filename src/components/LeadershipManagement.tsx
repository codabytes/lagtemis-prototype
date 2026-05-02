import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Trash2, 
  Edit2, 
  User as UserIcon, 
  Camera, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Building2,
  Users as UsersIcon,
  Clock,
  CheckCircle2,
  History
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from './AuthGuard';
import { Institution, LeadershipRecord } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

const POSITION_CATEGORIES = [
  'Visitor', 
  'Chancellor', 
  'Governing Council', 
  'Vice-Chancellor', 
  'Deputy Vice-Chancellor', 
  'Registrar', 
  'Bursar', 
  'Librarian'
];

const DEFAULT_VISITOR_NAME = "Mr. Babajide Sanwoolu";

export const LeadershipManagement: React.FC = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [leadershipRecords, setLeadershipRecords] = useState<LeadershipRecord[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [viewingDate, setViewingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'Political' | 'Management'>('Political');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LeadershipRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<LeadershipRecord>>({
    type: 'Political',
    category: 'Visitor',
    personName: '',
    startDate: '',
    tenureYears: 4,
    endDate: '',
    photoUrl: '',
    councilPosition: '',
    portfolio: ''
  });

  const [isDragging, setIsDragging] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  useEffect(() => {
    const unsubscribeInstitutions = onSnapshot(collection(db, 'institutions'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institution));
      const sortedData = data.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });
      setInstitutions(sortedData);
      if (sortedData.length > 0 && !selectedInstitutionId) {
        setSelectedInstitutionId(sortedData[0].id);
      }
    });

    return () => unsubscribeInstitutions();
  }, []);

  useEffect(() => {
    if (!selectedInstitutionId) return;

    const q = query(
      collection(db, 'leadership'),
      where('institutionId', '==', selectedInstitutionId)
    );

    const unsubscribeLeadership = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeadershipRecord));
      setLeadershipRecords(data);
    });

    return () => unsubscribeLeadership();
  }, [selectedInstitutionId]);

  // Handle endDate calculation
  useEffect(() => {
    if (formData.startDate && formData.tenureYears) {
      const start = new Date(formData.startDate);
      const end = new Date(start);
      end.setFullYear(start.getFullYear() + Number(formData.tenureYears));
      // Adjust to last working day (Friday if Saturday/Sunday)
      // For now, just set the date
      setFormData(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
    }
  }, [formData.startDate, formData.tenureYears]);

  const filteredRecords = useMemo(() => {
    return leadershipRecords.filter(record => {
      // If history is shown, show all of this type
      if (showHistory) return record.type === activeTab;
      
      // Otherwise, filter by viewing date
      const recordStart = new Date(record.startDate);
      const recordEnd = new Date(record.endDate);
      const viewDate = new Date(viewingDate);
      
      return record.type === activeTab && recordStart <= viewDate && recordEnd >= viewDate;
    });
  }, [leadershipRecords, activeTab, viewingDate, showHistory]);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitutionId) return;

    const dataToSave = {
      ...formData,
      institutionId: selectedInstitutionId,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingRecord) {
        await updateDoc(doc(db, 'leadership', editingRecord.id), dataToSave);
      } else {
        await addDoc(collection(db, 'leadership'), dataToSave);
      }
      setIsModalOpen(false);
      setEditingRecord(null);
      resetForm();
    } catch (error) {
      console.error("Error saving leadership record:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      category: activeTab === 'Political' ? 'Visitor' : 'Vice-Chancellor',
      personName: '',
      startDate: '',
      tenureYears: 4,
      endDate: '',
      photoUrl: '',
      councilPosition: '',
      portfolio: ''
    });
  };

  const handleEdit = (record: LeadershipRecord) => {
    setEditingRecord(record);
    setFormData(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'leadership', id));
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const checkExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);
    
    return end <= sixMonthsFromNow && end >= today;
  };

  const selectedInst = institutions.find(i => i.id === selectedInstitutionId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Institutional Leadership</h1>
          <p className="text-slate-500 font-medium tracking-tight">Governors, Chancellors, Councils and Principal Officers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="date"
              value={viewingDate}
              onChange={(e) => setViewingDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-bold text-slate-700 transition-all cursor-pointer"
            />
          </div>
          <button
            onClick={() => {
              setEditingRecord(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Plus size={20} />
            Record Appointment
          </button>
        </div>
      </div>

      {/* Main Filter Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto overflow-hidden">
          <button
            onClick={() => { setActiveTab('Political'); setShowHistory(false); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'Political' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldCheck size={18} />
            Political Leadership
          </button>
          <button
            onClick={() => { setActiveTab('Management'); setShowHistory(false); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'Management' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
             <Building2 size={18} />
            University Management
          </button>
        </div>

        <div className="flex items-center gap-4 flex-1 sm:flex-initial">
          <div className="flex flex-col gap-1 flex-1 sm:w-72">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Institution</label>
            <select
              value={selectedInstitutionId}
              onChange={(e) => setSelectedInstitutionId(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-slate-700 text-sm focus:ring-4 focus:ring-blue-100 cursor-pointer"
            >
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2.5 rounded-xl transition-all border shrink-0 ${showHistory ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}`}
            title="View History / Archived Records"
          >
            <History size={20} />
          </button>
        </div>
      </div>

      {/* Viewing Status Banner */}
      <div className={`px-6 py-3 rounded-2xl border flex items-center justify-between ${showHistory ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
        <div className="flex items-center gap-3">
          {showHistory ? <History size={18} /> : <Clock size={18} />}
          <span className="text-sm font-bold">
            {showHistory ? 'Viewing ARCHIVED & HISTORICAL Appointment Records' : `Viewing ACTIVE Leadership as of ${new Date(viewingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest opacity-60">
          <span>{selectedInst?.shortName}</span>
          <span>•</span>
          <span>{activeTab}</span>
        </div>
      </div>

      {/* Leadership Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords.length > 0 ? (
          filteredRecords.map(record => {
            const isExpiring = checkExpiringSoon(record.endDate);
            const isPast = new Date(record.endDate) < new Date();
            
            return (
              <div 
                key={record.id}
                className={`bg-white rounded-3xl p-6 border transition-all duration-300 relative group overflow-hidden ${isExpiring ? 'border-amber-200 shadow-lg shadow-amber-50' : 'border-slate-100 shadow-sm hover:shadow-md'}`}
              >
                {/* Expiring Warning Overlay (Animated Flash) */}
                {isExpiring && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse"></div>
                )}
                {isPast && (
                    <div className="absolute top-4 right-4 z-20">
                         <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[9px] font-black rounded uppercase tracking-widest border border-slate-200">Archived Record</span>
                    </div>
                )}

                <div className="flex items-start gap-5">
                  <div className="relative group/photo">
                    <div className="w-20 h-20 bg-slate-50 border-2 border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                      {record.photoUrl ? (
                         <img src={record.photoUrl} alt={record.personName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                          <UserIcon size={32} />
                        </div>
                      )}
                    </div>
                    {isExpiring && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-lg shadow-lg animate-bounce">
                        <AlertTriangle size={14} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="mb-0.5">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{record.category}</span>
                      {record.councilPosition && (
                         <span className="ml-2 text-[9px] font-bold text-slate-400 uppercase">({record.councilPosition})</span>
                      )}
                      {record.portfolio && (
                         <span className="ml-2 text-[9px] font-bold text-slate-400 uppercase"> - {record.portfolio}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-3 truncate">{record.personName}</h3>
                    
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 group/date">
                          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover/date:bg-emerald-600 group-hover/date:text-white transition-all">
                             <CheckCircle2 size={12} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Appointed</p>
                            <p className="text-xs font-bold text-slate-700">{new Date(record.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-2 group/date">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isExpiring ? 'bg-amber-50 text-amber-600 group-hover/date:bg-amber-500 group-hover/date:text-white' : 'bg-rose-50 text-rose-600 group-hover/date:bg-rose-600 group-hover/date:text-white'}`}>
                             <Clock size={12} />
                          </div>
                          <div>
                            <p className={`text-[9px] font-black uppercase leading-none mb-0.5 ${isExpiring ? 'text-amber-500' : 'text-slate-400'}`}>Appointment Ends</p>
                            <p className={`text-xs font-bold ${isExpiring ? 'text-amber-600' : 'text-slate-700'}`}>{new Date(record.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tenure Duration</span>
                      <span className="text-sm font-black text-slate-900">{record.tenureYears} Years</span>
                   </div>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(record)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm({ isOpen: true, id: record.id, name: record.personName })}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>

                {isExpiring && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-sm animate-pulse-slow">
                        <AlertTriangle size={14} />
                    </div>
                    <p className="text-[10px] font-bold text-amber-700 leading-tight uppercase tracking-wider">
                      Appointment lapses in {Math.ceil((new Date(record.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))} months. Begin recruitment process.
                    </p>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="col-span-full py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-10">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
               <ShieldCheck size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">No Active {activeTab} Records</h3>
            <p className="text-slate-400 font-medium max-w-sm">No occupants found for this category as of the selected date. Add a new appointment record or view history.</p>
            <button
               onClick={() => { setShowHistory(true); }}
               className="mt-6 text-blue-600 font-bold hover:underline"
            >
               View Historical Records
            </button>
          </div>
        )}
      </div>

      {/* Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingRecord ? 'Modify Appointment' : 'New Appointment Record'}</h2>
                <p className="text-slate-500 text-sm font-medium tracking-tight">Enter details of the institutional leadership member</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Person Basic Info */}
                <div className="space-y-6">
                  <div className={`flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all ${isDragging ? 'bg-blue-50 border-blue-400 border-dashed ring-4 ring-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="relative group">
                       <div 
                         className="w-32 h-32 bg-white rounded-[32px] overflow-hidden border-4 border-white shadow-xl flex items-center justify-center text-slate-200 relative"
                         onDragOver={handleDragOver}
                         onDragLeave={handleDragLeave}
                         onDrop={handleDrop}
                       >
                         {formData.photoUrl ? (
                           <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                         ) : (
                           <UserIcon size={48} />
                         )}
                         <label className="absolute inset-0 bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                           <Camera size={24} />
                           <span className="text-[10px] font-black uppercase mt-1">Upload Photo</span>
                           <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                         </label>
                       </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Passport</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Appointment Type</label>
                      <div className="flex bg-slate-100 p-1 rounded-2xl">
                         <button 
                           type="button"
                           onClick={() => setFormData(prev => ({ ...prev, type: 'Political', category: 'Visitor' }))}
                           className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.type === 'Political' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                         >
                           Political
                         </button>
                         <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: 'Management', category: 'Vice-Chancellor' }))}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.type === 'Management' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                         >
                           Management
                         </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Position</label>
                      <select
                        required
                        value={formData.category} // fixed to match schema
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 font-bold text-slate-700 text-sm focus:ring-4 focus:ring-blue-100"
                      >
                         {formData.type === 'Political' ? (
                           <>
                            <option value="Visitor">Visitor (Proprietor)</option>
                            <option value="Chancellor">Chancellor (Ceremonial)</option>
                            <option value="Pro-Chancellor and Chairman of Council">Pro-Chancellor and Chairman of Council</option>
                            <option value="Chairman of Council">Chairman of Council</option>
                            <option value="Vice-Chancellor">Vice-Chancellor</option>
                            <option value="Registrar and Secretary to Council">Registrar and Secretary to Council</option>
                            <option value="Governing Council">Governing Council Member</option>
                           </>
                         ) : (
                           <>
                            <option value="Vice-Chancellor">Vice-Chancellor</option>
                            <option value="Deputy Vice-Chancellor (Academics)">Deputy Vice-Chancellor (Academics)</option>
                            <option value="Deputy Vice-Chancellor (Administration)">Deputy Vice-Chancellor (Administration)</option>
                            <option value="Deputy Vice-Chancellor (Development)">Deputy Vice-Chancellor (Development)</option>
                            <option value="Rector">Rector</option>
                            <option value="Deputy Rector (Academics)">Deputy Rector (Academics)</option>
                            <option value="Deputy Rector (Administration)">Deputy Rector (Administration)</option>
                            <option value="Deputy Rector (Development)">Deputy Rector (Development)</option>
                            <option value="Provost">Provost</option>
                            <option value="Deputy Provost (Academics)">Deputy Provost (Academics)</option>
                            <option value="Deputy Provost (Administration)">Deputy Provost (Administration)</option>
                            <option value="Deputy Provost (Development)">Deputy Provost (Development)</option>
                            <option value="Registrar">Registrar</option>
                            <option value="Bursar">Bursar</option>
                            <option value="Librarian">Librarian</option>
                           </>
                         )}
                      </select>
                    </div>

                    {formData.category === 'Deputy Vice-Chancellor' && (
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Portfolio</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Academic, Admin"
                          value={formData.portfolio || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                          className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 font-bold text-slate-700 text-sm focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    )}

                    {formData.category === 'Governing Council' && (
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Council Position</label>
                        <select
                          required
                          value={formData.councilPosition || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, councilPosition: e.target.value }))}
                          className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 font-bold text-slate-700 text-sm focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">Select Position</option>
                          <option value="Pro-Chancellor">Pro-Chancellor (Chairman)</option>
                          <option value="Member">Member</option>
                          <option value="Industry Representative">Industry Representative</option>
                          <option value="Community Representative">Community Representative</option>
                          <option value="Government Nominee">Government Nominee</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tenure and Name Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name of Office Occupier</label>
                    <input
                      required
                      type="text"
                      placeholder="Enter full name"
                      value={formData.personName}
                      onChange={(e) => setFormData(prev => ({ ...prev, personName: e.target.value }))}
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 font-bold text-slate-700 text-sm focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 space-y-6">
                     <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <Clock size={12} />
                        Tenure Management
                     </h4>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Commencement Date</label>
                          <input
                            required
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full bg-white border-transparent rounded-xl px-4 py-3 font-bold text-slate-700 text-sm focus:ring-4 focus:ring-blue-100 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Duration (Years)</label>
                          <input
                            required
                            type="number"
                            min="1"
                            max="7"
                            value={formData.tenureYears}
                            onChange={(e) => setFormData(prev => ({ ...prev, tenureYears: parseInt(e.target.value) }))}
                            className="w-full bg-white border-transparent rounded-xl px-4 py-3 font-bold text-slate-700 text-sm focus:ring-4 focus:ring-blue-100 shadow-sm"
                          />
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Anticipated End of Appointment</label>
                        <div className="relative">
                          <input
                            readOnly
                            type="date"
                            value={formData.endDate}
                            className="w-full bg-slate-100/50 border-none rounded-xl px-4 py-3 font-black text-blue-700 text-sm cursor-not-allowed shadow-inner"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                             <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Auto-Calculated</span>
                             <ShieldCheck size={14} className="text-blue-500" />
                          </div>
                        </div>
                        <p className="mt-3 text-[10px] font-medium text-slate-500 leading-relaxed italic">
                           * The system automatically calculates the end date based on duration. Appointments lapse on the last working day of the terminal year.
                        </p>
                     </div>
                  </div>

                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                      Proactive alerting will trigger 6 months prior to appointment end, facilitating organic recruitment of successors.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-end gap-4 pb-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-200 active:scale-95 text-xs uppercase tracking-widest"
                >
                  {editingRecord ? 'Update Appointment' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Revoke/Delete Record"
        message={`Are you sure you want to remove the appointment record for ${deleteConfirm.name}? This action can be audited but the record will be removed from display.`}
        confirmLabel="Remove Record"
        isDangerous={true}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
};

const X: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
