import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Download,
  ExternalLink,
  User,
  Calendar,
  DollarSign,
  XCircle,
  Filter,
  Trash2,
  FileText,
  Hash
} from 'lucide-react';
import { orderBy } from 'firebase/firestore';
import { dbService } from '../services/db';
import { Publication, Staff } from '../types';
import { useAuth } from './AuthGuard';
import { ConfirmDialog } from './ConfirmDialog';

export const ResearchPublications: React.FC = () => {
  const { user, canManage, canDelete } = useAuth();
  const [publications, setPublications] = useState<Publication[]>([]);
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

  const INITIAL_PUBLICATION_STATE = {
    staffId: '',
    outputId: '',
    title: '',
    type: 'Journal Article' as const,
    year: new Date().getFullYear(),
    abstract: '',
    fundingSource: 'Self-Sponsored' as const
  };

  const [newPublication, setNewPublication] = useState<Partial<Publication>>(INITIAL_PUBLICATION_STATE);

  const isFormDirty = () => {
    return Object.keys(INITIAL_PUBLICATION_STATE).some(key => {
      const k = key as keyof typeof INITIAL_PUBLICATION_STATE;
      return newPublication[k] !== INITIAL_PUBLICATION_STATE[k];
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
          setNewPublication(INITIAL_PUBLICATION_STATE);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
        isDangerous: true
      });
    } else {
      setIsModalOpen(false);
      setNewPublication(INITIAL_PUBLICATION_STATE);
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
  }, [isModalOpen, newPublication]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [pubData, staffData] = await Promise.all([
        dbService.list<Publication>('publications', [orderBy('year', 'desc')]),
        dbService.list<Staff>('staff')
      ]);

      setPublications(pubData);
      setStaff(staffData);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddPublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage('publications')) return;
    try {
      const id = await dbService.create('publications', newPublication as any, `Added publication: ${newPublication.title} for staff ${newPublication.staffId}`);
      setPublications([{ id, ...newPublication } as Publication, ...publications]);
      setIsModalOpen(false);
      setNewPublication({
        staffId: '',
        outputId: '',
        title: '',
        type: 'Journal Article',
        year: new Date().getFullYear(),
        abstract: '',
        fundingSource: 'Self-Sponsored'
      });
    } catch (error) {
      // Error handled by dbService
    }
  };

  const handleDeletePublication = async (e: React.MouseEvent, p: Publication) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canDelete('publications')) {
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
      title: 'Delete Publication Record',
      message: `Are you sure you want to delete the publication record for "${p.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await dbService.delete('publications', p.id, `Deleted publication: ${p.title}`);
          setPublications(publications.filter(pub => pub.id !== p.id));
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          // Error handled by dbService
        }
      },
      isDangerous: true
    });
  };

  const filteredPublications = publications.filter(p => {
    const staffMember = staff.find(s => s.id === p.staffId);
    const staffName = staffMember ? `${staffMember.firstName} ${staffMember.surname}` : '';
    return (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.outputId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.staffId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const outputTypes = [
    'Journal Article',
    'Monograph',
    'Book/Book Chapter',
    'Conference Paper',
    'Conference Poster',
    'Review Article',
    'Editorial/Commentary',
    'Technical Report'
  ];

  const fundingSources = [
    'Federal Government',
    'Lagos State Government',
    'TETFund',
    'LASRIC',
    'Self-Sponsored',
    'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research & Publications</h1>
          <p className="text-slate-500 italic serif text-sm">Central repository of institutional research and intellectual outputs</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">
            <Download size={20} />
          </button>
          {canManage('publications') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100"
            >
              <Plus size={20} />
              Add Output Record
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by title, Output ID, or Staff Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200 text-sm"
          />
        </div>
      </div>

      {/* Publication List */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
          ))
        ) : filteredPublications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-100">
            No publication records found
          </div>
        ) : filteredPublications.map((p) => {
          const staffMember = staff.find(s => s.id === p.staffId);
          return (
            <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                      {p.type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-bold">{p.outputId}</span>
                    <span className="text-xs text-slate-400 font-mono">{p.year}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {p.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User size={14} className="text-slate-400" />
                      <span className="text-sm font-semibold">{staffMember ? `${staffMember.firstName} ${staffMember.surname}` : 'Unknown Author'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign size={14} className="text-slate-400" />
                      <span className="text-sm font-semibold">{p.fundingSource}</span>
                    </div>
                  </div>
                  {p.abstract && (
                    <p className="text-sm text-slate-500 line-clamp-2 mt-2 italic">
                      {p.abstract}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 self-end md:self-start">
                  {canDelete('publications') && (
                    <button
                      type="button"
                      onClick={(e) => handleDeletePublication(e, p)}
                      className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Publication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add Output Record</h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddPublication} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Staff Member</label>
                  <select
                    required
                    value={newPublication.staffId}
                    onChange={(e) => setNewPublication({ ...newPublication, staffId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.surname} ({s.staffId})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Output ID</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. PUB-2024-001"
                    value={newPublication.outputId}
                    onChange={(e) => setNewPublication({ ...newPublication, outputId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Output Title</label>
                  <input
                    required
                    type="text"
                    value={newPublication.title}
                    onChange={(e) => setNewPublication({ ...newPublication, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Output Type</label>
                  <select
                    required
                    value={newPublication.type}
                    onChange={(e) => setNewPublication({ ...newPublication, type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    {outputTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Year</label>
                  <input
                    required
                    type="number"
                    value={newPublication.year}
                    onChange={(e) => setNewPublication({ ...newPublication, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Abstract</label>
                  <textarea
                    required
                    rows={4}
                    value={newPublication.abstract}
                    onChange={(e) => setNewPublication({ ...newPublication, abstract: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Funding Source</label>
                  <select
                    required
                    value={newPublication.fundingSource}
                    onChange={(e) => setNewPublication({ ...newPublication, fundingSource: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    {fundingSources.map(source => <option key={source} value={source}>{source}</option>)}
                  </select>
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
