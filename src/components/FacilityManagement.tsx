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
import { Facility, Institution, Faculty, Department } from '../types';
import { useAuth } from './AuthGuard';
import { ConfirmDialog } from './ConfirmDialog';

export const FacilityManagement: React.FC = () => {
  const { user, canManage, canDelete } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    custodianId: '',
    capacity: 0,
    dateCompleted: new Date().toISOString().split('T')[0],
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
        const [infraSnap, instSnap, facSnap, deptSnap] = await Promise.all([
          getDocs(query(collection(db, 'facilities'), orderBy('name'))),
          getDocs(query(collection(db, 'institutions'), orderBy('name'))),
          getDocs(query(collection(db, 'faculties'), orderBy('name'))),
          getDocs(query(collection(db, 'departments'), orderBy('name')))
        ]);

        const fetchedFacilities = infraSnap.docs.map(d => ({ id: d.id, ...d.data() } as Facility));
        const fetchedInstitutions = instSnap.docs.map(d => ({ id: d.id, ...d.data() } as Institution));
        const fetchedFaculties = facSnap.docs.map(d => ({ id: d.id, ...d.data() } as Faculty));
        const fetchedDepartments = deptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Department));

        console.log(`Loaded: ${fetchedFacilities.length} facilities, ${fetchedInstitutions.length} institutions, ${fetchedFaculties.length} faculties, ${fetchedDepartments.length} departments`);

        setFacilities(fetchedFacilities);
        setInstitutions(fetchedInstitutions);
        setFaculties(fetchedFaculties);
        setDepartments(fetchedDepartments);
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

  const filteredFacilities = facilities.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.campus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustodianName = (id: string) => {
    const faculty = faculties.find(f => f.id === id);
    if (faculty) return `${faculty.type === 'faculty' ? 'Faculty' : 'Directorate'}: ${faculty.name}`;
    const dept = departments.find(d => d.id === id);
    if (dept) return `${dept.type === 'department' ? 'Dept' : 'Unit'}: ${dept.name}`;
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facility Management</h1>
          <p className="text-slate-500 italic serif text-sm">Inventory tracking and capacity mapping</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">
            <Download size={20} />
          </button>
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
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, asset ID or campus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200 text-sm"
          />
        </div>
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
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custodian</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Completed</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funding Source</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maintenance History</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={12} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-400 italic">No facility records found</td>
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
                      {facility.name}
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
                    <span className="text-sm text-slate-600">{getCustodianName(facility.custodianId)}</span>
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
                  <td className="px-6 py-4">
                    <Link 
                      to={`/facilities/profile/${facility.id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Wrench size={12} />
                      View History
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
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
                    onChange={(e) => setFormData({ ...formData, institutionId: e.target.value, custodianId: '' })}
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custodian</label>
                  <select
                    required
                    value={formData.custodianId}
                    onChange={(e) => setFormData({ ...formData, custodianId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                  >
                    <option value="">Select Custodian</option>
                    {formData.institutionId && faculties.filter(f => f.institutionId === formData.institutionId).map(fac => (
                      <option key={fac.id} value={fac.id}>{fac.type === 'faculty' ? 'Faculty' : 'Directorate'}: {fac.name}</option>
                    ))}
                    {formData.institutionId && departments.filter(d => {
                      const faculty = faculties.find(f => f.id === d.facultyId);
                      return faculty?.institutionId === formData.institutionId;
                    }).map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.type === 'department' ? 'Dept' : 'Unit'}: {dept.name}</option>
                    ))}
                  </select>
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
