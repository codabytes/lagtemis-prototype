import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Download,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  BarChart2,
  Trash2,
  MapPin,
  Globe,
  Clock,
  Building
} from 'lucide-react';
import { where, orderBy } from 'firebase/firestore';
import { dbService } from '../services/db';
import { Training, Staff } from '../types';
import { useAuth } from './AuthGuard';
import { ConfirmDialog } from './ConfirmDialog';

export const TrainingManagement: React.FC = () => {
  const { user, canManage, canDelete } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Confirm Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const initialTrainingState: Partial<Training> = {
    trainingId: '',
    staffId: '',
    title: '',
    type: 'Workshop',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    location: '',
    isInternational: false,
    provider: '',
    fundingSource: 'Self-Sponsored',
    description: ''
  };

  const [newTraining, setNewTraining] = useState<Partial<Training>>(initialTrainingState);

  const isFormDirty = () => {
    return Object.keys(initialTrainingState).some(key => {
      const k = key as keyof Training;
      return newTraining[k] !== initialTrainingState[k];
    });
  };

  const handleCloseModal = () => {
    if (isFormDirty()) {
      setConfirmState({
        isOpen: true,
        title: 'Discard Changes',
        message: 'You have unsaved changes. Are you sure you want to close the form?',
        onConfirm: () => {
          setIsModalOpen(false);
          setNewTraining(initialTrainingState);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
        isDangerous: true
      });
    } else {
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, newTraining]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [trainingData, staffData] = await Promise.all([
        dbService.list<Training>('trainings', [orderBy('date', 'desc')]),
        dbService.list<Staff>('staff')
      ]);

      setTrainings(trainingData);
      setStaff(staffData);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage('trainings')) return;
    try {
      const id = await dbService.create('trainings', newTraining as any, `Added training: ${newTraining.title} for staff ${newTraining.staffId}`);
      setTrainings([{ id, ...newTraining } as Training, ...trainings]);
      setIsModalOpen(false);
      setNewTraining(initialTrainingState);
    } catch (error) {
      // Error handled by dbService
    }
  };

  const handleDeleteTraining = async (e: React.MouseEvent, t: Training) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canDelete('trainings')) {
      setConfirmState({
        isOpen: true,
        title: 'Access Denied',
        message: 'You do not have permission to delete records.',
        onConfirm: () => setConfirmState(prev => ({ ...prev, isOpen: false })),
        isDangerous: false
      });
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Delete Training Record',
      message: `Are you sure you want to delete the training record for "${t.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await dbService.delete('trainings', t.id, `Deleted training: ${t.title}`);
          setTrainings(trainings.filter(train => train.id !== t.id));
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          // Error handled by dbService
        }
      },
      isDangerous: true
    });
  };

  const filteredTrainings = trainings.filter(t => {
    const staffMember = staff.find(s => s.id === t.staffId);
    const staffName = staffMember ? `${staffMember.firstName} ${staffMember.surname}` : '';
    return (
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.trainingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.staffId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training Management</h1>
          <p className="text-slate-500 italic serif text-sm">Track professional development, seminars, and workshops</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">
            <Download size={20} />
          </button>
          {canManage('trainings') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100"
            >
              <Plus size={20} />
              Add Training Record
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by title, Training ID, or Staff Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200 text-sm"
          />
        </div>
      </div>

      {/* Training List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
          ))
        ) : filteredTrainings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-100">
            No training records found
          </div>
        ) : filteredTrainings.map((training) => {
          const staffMember = staff.find(s => s.id === training.staffId);
          return (
            <div key={training.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{training.trainingId}</span>
                  {canDelete('trainings') && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTraining(e, training)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{training.title}</h3>
              <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">{training.type}</p>
              
              {training.description && (
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 italic">{training.description}</p>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <User size={14} className="text-slate-400" />
                  <span className="text-sm font-semibold">{staffMember ? `${staffMember.firstName} ${staffMember.surname}` : 'Unknown Staff'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-sm font-semibold">{training.date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-sm font-semibold">{training.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="text-sm font-semibold">{training.location} {training.isInternational && <span className="ml-1 px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded font-bold uppercase tracking-widest">International</span>}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Building size={14} className="text-slate-400" />
                  <span className="text-sm font-semibold">{training.provider}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funding</span>
                  <span className="text-xs font-bold text-slate-700">{training.fundingSource}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Training Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add Training Record</h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddTraining} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Training ID</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. TRN-2024-001"
                    value={newTraining.trainingId}
                    onChange={(e) => setNewTraining({ ...newTraining, trainingId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Staff Member</label>
                  <select
                    required
                    value={newTraining.staffId}
                    onChange={(e) => setNewTraining({ ...newTraining, staffId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.surname} ({s.staffId})</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Training Title</label>
                  <input
                    required
                    type="text"
                    value={newTraining.title}
                    onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Training Type</label>
                  <select
                    required
                    value={newTraining.type}
                    onChange={(e) => setNewTraining({ ...newTraining, type: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    <option value="">Select Type</option>
                    {[
                      'Conference',
                      'Workshop',
                      'Seminar',
                      'Symposium',
                      'Colloquium',
                      'In-Service Training',
                      'Professional Certification Training',
                      'Technical Clinic',
                      'Laboratory/Equipment Training',
                      'Fieldwork Training',
                      'Study Fellowship'
                    ].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</label>
                  <input
                    required
                    type="date"
                    value={newTraining.date}
                    onChange={(e) => setNewTraining({ ...newTraining, date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 5 Days, 2 Weeks"
                    value={newTraining.duration}
                    onChange={(e) => setNewTraining({ ...newTraining, duration: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</label>
                  <input
                    required
                    type="text"
                    value={newTraining.location}
                    onChange={(e) => setNewTraining({ ...newTraining, location: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scope</label>
                  <div className="flex items-center gap-4 h-10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!newTraining.isInternational}
                        onChange={() => setNewTraining({ ...newTraining, isInternational: false })}
                        className="text-blue-600"
                      />
                      <span className="text-sm font-semibold text-slate-600">Local</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={newTraining.isInternational}
                        onChange={() => setNewTraining({ ...newTraining, isInternational: true })}
                        className="text-blue-600"
                      />
                      <span className="text-sm font-semibold text-slate-600">International</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Training Provider</label>
                  <input
                    required
                    type="text"
                    value={newTraining.provider}
                    onChange={(e) => setNewTraining({ ...newTraining, provider: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Funding Source</label>
                  <select
                    required
                    value={newTraining.fundingSource}
                    onChange={(e) => setNewTraining({ ...newTraining, fundingSource: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    <option value="Federal Government">Federal Government</option>
                    <option value="Lagos State Government">Lagos State Government</option>
                    <option value="TETFund">TETFund</option>
                    <option value="LASRIC">LASRIC</option>
                    <option value="Self-Sponsored">Self-Sponsored</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Training Description (Max 250 words)</label>
                  <textarea
                    placeholder="Provide a brief description of the training..."
                    value={newTraining.description}
                    onChange={(e) => {
                      const words = e.target.value.trim().split(/\s+/);
                      if (words.length <= 250 || e.target.value.length < (newTraining.description?.length || 0)) {
                        setNewTraining({ ...newTraining, description: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all h-32 overflow-y-auto resize-none"
                  />
                  <p className="text-[10px] text-slate-400 text-right">
                    {newTraining.description?.trim().split(/\s+/).filter(Boolean).length || 0} / 250 words
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        isDangerous={confirmState.isDangerous}
      />
    </div>
  );
};
