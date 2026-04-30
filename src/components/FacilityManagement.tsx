import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Building2, 
  Download,
  MapPin,
  Users,
  Calendar,
  Wrench,
  XCircle,
  Trash2,
  Edit2,
  ExternalLink,
  User
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, logAudit } from '../firebase';
import { Facility, Institution } from '../types';
import { useAuth } from './AuthGuard';
import { ConfirmDialog } from './ConfirmDialog';
import { ExportButton } from './ExportButton';

/**
 * FacilityManagement Component
 * 
 * Handles institutional infrastructure inventory, asset tracking, 
 * and maintenance history management.
 */
export const FacilityManagement: React.FC = () => {
  const { user, canManage, canDelete } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    institutionId: 'all',
    campus: 'all',
    type: 'all',
    capacity: 'all',
    fundingSource: 'all'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  const INITIAL_STATE: Partial<Facility> = {
    assetId: '',
    name: '',
    type: 'Lecture Theater',
    description: '',
    institutionId: '',
    campus: '',
    location: '',
    capacity: 0,
    dateCompleted: new Date().toISOString().split('T')[0],
    acquisitionCost: 0,
    fundingSource: 'Lagos State Government'
  };

  const [formData, setFormData] = useState<Partial<Facility>>(INITIAL_STATE);

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

  const isFormDirty = () => {
    return Object.keys(INITIAL_STATE).some(key => {
      const k = key as keyof Facility;
      const initialValue = editingFacility ? editingFacility[k] : INITIAL_STATE[k];
      return formData[k] !== initialValue;
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
          setEditingFacility(null);
          setFormData(INITIAL_STATE);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
        isDangerous: true
      });
    } else {
      setIsModalOpen(false);
      setEditingFacility(null);
      setFormData(INITIAL_STATE);
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
  }, [isModalOpen, formData, editingFacility]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Fetching facility management data...');
        const [infraSnap, instSnap] = await Promise.all([
          getDocs(query(collection(db, 'facilities'), orderBy('name'))),
          getDocs(query(collection(db, 'institutions'), orderBy('name')))
        ]);

        const fetchedFacilities = infraSnap.docs.map(d => ({ id: d.id, ...d.data() } as Facility));
        const fetchedInstitutions = instSnap.docs.map(d => ({ id: d.id, ...d.data() } as Institution));

        console.log(`Loaded: ${fetchedFacilities.length} facilities, ${fetchedInstitutions.length} institutions`);

        setFacilities(fetchedFacilities);
        setInstitutions(fetchedInstitutions);
      } catch (error) {
        console.error('Error fetching facility management data:', error);
        handleFirestoreError(error, OperationType.LIST, 'facilities');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage('facilities')) return;
    
    // Validate date completed
    const today = new Date().toISOString().split('T')[0];
    if (formData.dateCompleted && formData.dateCompleted > today) {
      setConfirmState({
        isOpen: true,
        title: 'Invalid Date',
        message: 'The Date Completed cannot be in the future.',
        onConfirm: () => setConfirmState(prev => ({ ...prev, isOpen: false })),
        isDangerous: false
      });
      return;
    }

    try {
      if (editingFacility) {
        await updateDoc(doc(db, 'facilities', editingFacility.id), formData);
        await logAudit('UPDATE', 'facilities', editingFacility.id, `Updated facility: ${formData.name}`);
        setFacilities(facilities.map(f => f.id === editingFacility.id ? { ...f, ...formData } as Facility : f));
      } else {
        const docRef = await addDoc(collection(db, 'facilities'), formData);
        await logAudit('CREATE', 'facilities', docRef.id, `Added facility: ${formData.name}`);
        setFacilities([...facilities, { id: docRef.id, ...formData } as Facility]);
      }
      setIsModalOpen(false);
      setEditingFacility(null);
      setFormData(INITIAL_STATE);
    } catch (error) {
      handleFirestoreError(error, editingFacility ? OperationType.UPDATE : OperationType.CREATE, 'facilities');
    }
  };

  const handleEdit = (facility: Facility) => {
    if (!canManage('facilities')) return;
    setEditingFacility(facility);
    setFormData(facility);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, facility: Facility) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canDelete('facilities')) {
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
      title: 'Delete Facility',
      message: `Are you sure you want to delete the facility record for "${facility.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'facilities', facility.id));
          await logAudit('DELETE', 'facilities', facility.id, `Deleted facility: ${facility.name}`);
          setFacilities(facilities.filter(f => f.id !== facility.id));
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `facilities/${facility.id}`);
        }
      },
      isDangerous: true
    });
  };

  const filteredFacilities = React.useMemo(() => {
    return facilities.filter(f => {
      const searchStr = `${f.assetId} ${f.name}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      
      const matchesInst = filters.institutionId === 'all' || f.institutionId === filters.institutionId;
      const matchesCampus = filters.campus === 'all' || f.campus === filters.campus;
      const matchesType = filters.type === 'all' || f.type === filters.type;
      const matchesSource = filters.fundingSource === 'all' || f.fundingSource === filters.fundingSource;
      
      let matchesCapacity = true;
      if (filters.capacity !== 'all') {
        const cap = f.capacity;
        if (filters.capacity === '0-50') matchesCapacity = cap <= 50;
        else if (filters.capacity === '51-100') matchesCapacity = cap > 50 && cap <= 100;
        else if (filters.capacity === '101-200') matchesCapacity = cap > 100 && cap <= 200;
        else if (filters.capacity === '201-500') matchesCapacity = cap > 200 && cap <= 500;
        else if (filters.capacity === '501+') matchesCapacity = cap > 500;
      }

      return matchesSearch && matchesInst && matchesCampus && matchesType && matchesSource && matchesCapacity;
    });
  }, [facilities, searchTerm, filters]);

  const availableCampuses = React.useMemo(() => {
    const campuses = facilities
      .filter(f => f.campus && (filters.institutionId === 'all' || f.institutionId === filters.institutionId))
      .map(f => f.campus);
    return Array.from(new Set(campuses)).sort();
  }, [facilities, filters.institutionId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facility Management</h1>
          <p className="text-slate-500 italic serif text-sm">Inventory tracking and capacity mapping</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredFacilities} fileName={`TEMIS_Facilities_${new Date().getFullYear()}`} />
          {canManage('facilities') && (
            <button 
              disabled={loading}
              onClick={() => {
                if (institutions.length === 0) {
                  setConfirmState({
                    isOpen: true,
                    title: 'No Institutions Found',
                    message: 'You must register at least one institution in the Institutional Hierarchy before adding facilities.',
                    onConfirm: () => setConfirmState(prev => ({ ...prev, isOpen: false })),
                    isDangerous: false
                  });
                  return;
                }
                setEditingFacility(null);
                setFormData(INITIAL_STATE);
                setIsModalOpen(true);
              }}
              className={`px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus size={20} />
              Add Facility
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by Asset ID, or Facility Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl transition-all duration-200 text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institution</label>
            <select 
              value={filters.institutionId}
              onChange={(e) => setFilters(prev => ({ ...prev, institutionId: e.target.value, campus: 'all' }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ALL INSTITUTIONS</option>
              {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Campus</label>
            <select 
              value={filters.campus}
              onChange={(e) => setFilters(prev => ({ ...prev, campus: e.target.value }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ALL CAMPUSES</option>
              {availableCampuses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Facility Type</label>
            <select 
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ALL TYPES</option>
              {['Lecture Theater', 'Lecture Hall', 'Lecture Room', 'Library', 'Laboratory', 'Workshop', 'Studio'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Capacity</label>
            <select 
              value={filters.capacity}
              onChange={(e) => setFilters(prev => ({ ...prev, capacity: e.target.value }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ANY CAPACITY</option>
              <option value="0-50">Up to 50</option>
              <option value="51-100">51 - 100</option>
              <option value="101-200">101 - 200</option>
              <option value="201-500">201 - 500</option>
              <option value="501+">Above 500</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Funding Source</label>
            <select 
              value={filters.fundingSource}
              onChange={(e) => setFilters(prev => ({ ...prev, fundingSource: e.target.value }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ALL SOURCES</option>
              {[
                'Lagos State Government', 
                'TETFund', 
                'Special Intervention', 
                'Corporate Social Responsibility', 
                'Philanthropy', 
                'Public-Private Partnership'
              ].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchTerm || filters.institutionId !== 'all' || filters.campus !== 'all' || filters.type !== 'all' || filters.capacity !== 'all' || filters.fundingSource !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Showing {filteredFacilities.length} matching facility result{filteredFacilities.length !== 1 ? 's' : ''}
            </p>
            <button 
              onClick={() => {
                setFilters({
                  institutionId: 'all',
                  campus: 'all',
                  type: 'all',
                  capacity: 'all',
                  fundingSource: 'all'
                });
                setSearchTerm('');
              }}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Facility List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campus</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Completed</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funding Source</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={10} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">No facility records found</td>
                </tr>
              ) : filteredFacilities.map((facility) => (
                <tr key={facility.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-slate-500">{facility.assetId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{institutions.find(inst => inst.id === facility.institutionId)?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      to={`/facilities/profile/${facility.id}`}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      {facility.name || 'Unnamed Facility'}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">{facility.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{facility.campus}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{facility.location}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900">{facility.capacity}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{facility.dateCompleted}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-500">{facility.fundingSource}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canManage('facilities') && (
                        <button
                          onClick={() => handleEdit(facility)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDelete('facilities') && (
                        <button
                          onClick={(e) => handleDelete(e, facility)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Update Facility Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingFacility ? 'Update Facility' : 'Add New Facility'}</h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveFacility} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset ID</label>
                  <input
                    required
                    type="text"
                    value={formData.assetId}
                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution</label>
                  <select
                    required
                    value={formData.institutionId}
                    onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                  >
                    <option value="">Select Institution</option>
                    {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility Type</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                  >
                    {['Lecture Theater', 'Lecture Hall', 'Lecture Room', 'Library', 'Laboratory', 'Workshop', 'Studio'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm h-20 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campus</label>
                  <input
                    required
                    type="text"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</label>
                  <input
                    required
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacity</label>
                  <input
                    required
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Completed</label>
                  <input
                    required
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.dateCompleted}
                    onChange={(e) => setFormData({ ...formData, dateCompleted: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acquisition Cost (in Naira)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.acquisitionCost || ''}
                    onChange={(e) => setFormData({ ...formData, acquisitionCost: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funding Source</label>
                  <select
                    required
                    value={formData.fundingSource}
                    onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                  >
                    {[
                      'Lagos State Government', 
                      'TETFund', 
                      'Special Intervention', 
                      'Corporate Social Responsibility', 
                      'Philanthropy', 
                      'Public-Private Partnership'
                    ].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
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
                  {editingFacility ? 'Update Facility' : 'Save Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Dialog */}
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
