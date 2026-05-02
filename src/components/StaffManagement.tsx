import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  UserX, 
  Trash2,
  XCircle,
  Mail,
  Phone,
  Building2,
  GraduationCap
} from 'lucide-react';
import { where, orderBy } from 'firebase/firestore';
import { dbService } from '../services/db';
import { Staff, Institution, Department, Faculty } from '../types';
import { useAuth } from './AuthGuard';
import { ConfirmDialog } from './ConfirmDialog';
import { ExportButton } from './ExportButton';

const INITIAL_STAFF_STATE: Partial<Staff> = {
  lasrraId: '',
  staffId: '',
  title: '',
  surname: '',
  firstName: '',
  otherName: '',
  gender: 'Male',
  dob: '',
  institutionId: '',
  departmentId: '',
  facultyId: '',
  designation: '',
  gradeLevel: '',
  dateOfFirstAppointment: '',
  dateOfConfirmation: '',
  dateOfLastPromotion: '',
  highestQualification: '',
  specialization: '',
  employmentStatus: 'Active',
  staffType: 'Academic',
  email: '',
  mobilePhone: '',
  picture: ''
};

interface StaffManagementProps {
  type: 'Academic' | 'Non-Academic';
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ type }) => {
  const { canManage, canDelete } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    institutionId: 'all',
    facultyId: 'all',
    departmentId: 'all',
    qualification: 'all',
    employmentStatus: 'all'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [newStaff, setNewStaff] = useState<Partial<Staff>>({ ...INITIAL_STAFF_STATE, staffType: type });
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);

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

  useEffect(() => {
    setNewStaff(prev => ({ ...prev, staffType: type }));
  }, [type]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [staffData, instData, deptData, facultyData] = await Promise.all([
        dbService.list<Staff>('staff', [where('staffType', '==', type), orderBy('surname')]),
        dbService.list<Institution>('institutions'),
        dbService.list<Department>('departments'),
        dbService.list<Faculty>('faculties')
      ]);

      setStaff(staffData);
      setInstitutions(instData.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return a.name.localeCompare(b.name);
      }));
      setDepartments(deptData);
      setFaculties(facultyData);
      setLoading(false);
    };

    fetchData();
  }, [type]);

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const nameStr = `${s.firstName} ${s.surname} ${s.otherName || ''} ${s.staffId} ${s.designation}`.toLowerCase();
      const matchesSearch = nameStr.includes(searchTerm.toLowerCase());
      
      const matchesInst = filters.institutionId === 'all' || s.institutionId === filters.institutionId;
      const matchesFaculty = filters.facultyId === 'all' || s.facultyId === filters.facultyId;
      const matchesDept = filters.departmentId === 'all' || s.departmentId === filters.departmentId;
      const matchesQual = filters.qualification === 'all' || s.highestQualification === filters.qualification;
      const matchesStatus = filters.employmentStatus === 'all' || s.employmentStatus === filters.employmentStatus;

      return matchesSearch && matchesInst && matchesFaculty && matchesDept && matchesQual && matchesStatus;
    });
  }, [staff, searchTerm, filters]);

  const processPictureFile = (file: File) => {
    if (file.size > 500000) {
      setConfirmState({
        isOpen: true,
        title: 'File Too Large',
        message: 'The photograph must be less than 500KB.',
        onConfirm: () => setConfirmState(prev => ({ ...prev, isOpen: false })),
        isDangerous: false
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewStaff({ ...newStaff, picture: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPictureFile(file);
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPhotoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processPictureFile(file);
    }
  };

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPhotoDragging(true);
  };

  const handlePhotoDragLeave = () => {
    setIsPhotoDragging(false);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage('staff')) return;
    try {
      if (editingStaff) {
        await dbService.update('staff', editingStaff.id, newStaff, `Updated ${type.toLowerCase()} staff: ${newStaff.firstName} ${newStaff.surname}`);
        setStaff(staff.map(s => s.id === editingStaff.id ? { ...editingStaff, ...newStaff } as Staff : s));
      } else {
        const id = await dbService.create('staff', newStaff as any, `Added ${type.toLowerCase()} staff: ${newStaff.firstName} ${newStaff.surname}`);
        setStaff([...staff, { id, ...newStaff } as Staff]);
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      setNewStaff({ ...INITIAL_STAFF_STATE, staffType: type });
    } catch (error) {
      // Error handled by dbService
    }
  };

  const handleDeleteStaff = async (member: Staff) => {
    if (!canDelete('staff')) return;
    setConfirmState({
      isOpen: true,
      title: 'Delete Staff Record',
      message: `Are you sure you want to delete the record for ${member.firstName} ${member.surname}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await dbService.delete('staff', member.id, `Deleted staff: ${member.firstName} ${member.surname}`);
          setStaff(staff.filter(s => s.id !== member.id));
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          // Error handled by dbService
        }
      },
      isDangerous: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{type} Staff Management</h1>
          <p className="text-slate-500 italic serif text-sm">Comprehensive digital nominal roll and credentials tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredStaff} fileName={`TEMIS_${type.replace(' ', '')}_Staff_${new Date().getFullYear()}`} />
          {canManage('staff') && (
            <button 
              onClick={() => {
                setEditingStaff(null);
                setNewStaff({ ...INITIAL_STAFF_STATE, staffType: type });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100"
            >
              <Plus size={20} />
              Add Staff
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by Name, Staff ID, or Rank"
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
              onChange={(e) => setFilters(prev => ({ ...prev, institutionId: e.target.value, facultyId: 'all', departmentId: 'all' }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ALL INSTITUTIONS</option>
              {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Faculty/Directorate</label>
            <select 
              value={filters.facultyId}
              onChange={(e) => setFilters(prev => ({ ...prev, facultyId: e.target.value, departmentId: 'all' }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ALL FACULTIES</option>
              {faculties
                .filter(f => filters.institutionId === 'all' || f.institutionId === filters.institutionId)
                .map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department/Unit</label>
            <select 
              value={filters.departmentId}
              onChange={(e) => setFilters(prev => ({ ...prev, departmentId: e.target.value }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ALL DEPARTMENTS</option>
              {departments
                .filter(d => filters.facultyId === 'all' || d.facultyId === filters.facultyId)
                .map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Qualification</label>
            <select 
              value={filters.qualification}
              onChange={(e) => setFilters(prev => ({ ...prev, qualification: e.target.value }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ALL QUALIFICATIONS</option>
              {[...new Set(staff.map(s => s.highestQualification))].sort().map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Employment Status</label>
            <select 
              value={filters.employmentStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, employmentStatus: e.target.value }))}
              className="w-full bg-slate-50 border-transparent text-[11px] font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ALL STATUSES</option>
              {["Active", "On Study Leave", "On Sabbatical", "On Leave of Absence", "On Suspension", "Appointment Terminated", "Dismissed", "Retired"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchTerm || filters.institutionId !== 'all' || filters.facultyId !== 'all' || filters.departmentId !== 'all' || filters.qualification !== 'all' || filters.employmentStatus !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Showing {filteredStaff.length} matching staff result{filteredStaff.length !== 1 ? 's' : ''}
            </p>
            <button 
              onClick={() => {
                setFilters({
                  institutionId: 'all',
                  facultyId: 'all',
                  departmentId: 'all',
                  qualification: 'all',
                  employmentStatus: 'all'
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty/Directorate</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department/Unit</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qualification</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employment Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={11} className="px-6 py-4 h-16 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400 italic">No staff records found</td>
                </tr>
              ) : filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.picture ? (
                        <img 
                          src={member.picture} 
                          alt="Staff" 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                          {member.firstName[0]}{member.surname[0]}
                        </div>
                      )}
                      <div>
                        <Link 
                          to={`/staff/${member.id}`}
                          className="text-sm font-black text-slate-900 hover:text-blue-600 transition-colors uppercase"
                        >
                          {member.surname}, {member.firstName}
                        </Link>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">LASRRA: {member.lasrraId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-slate-600">{member.staffId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700">{member.designation}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">
                      {institutions.find(i => i.id === member.institutionId)?.shortName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">{faculties.find(f => f.id === member.facultyId)?.name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-500">{departments.find(d => d.id === member.departmentId)?.name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-blue-600 uppercase">{member.highestQualification}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={12} className="text-slate-400" />
                      <span className="text-xs font-medium">{member.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={12} className="text-slate-400" />
                      <span className="text-xs font-medium">{member.mobilePhone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      member.employmentStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      member.employmentStatus === 'Retired' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {member.employmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canManage('staff') && (
                        <button 
                          onClick={() => {
                            setEditingStaff(member);
                            setNewStaff(member);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <MoreVertical size={18} />
                        </button>
                      )}
                      {canDelete('staff') && (
                        <button 
                          onClick={() => handleDeleteStaff(member)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingStaff ? 'Update Staff Record' : `Register ${type} Staff`}
                </h2>
                <p className="text-slate-500 text-sm italic serif">Personnel data must be verified against LASRRA records</p>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingStaff(null); setNewStaff({ ...INITIAL_STAFF_STATE, staffType: type }); }}
                className="p-3 bg-white text-slate-400 hover:text-rose-500 hover:shadow-md rounded-2xl transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Photo & Identity Section */}
              <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <div className="relative group mx-auto lg:mx-0 w-48 aspect-square lg:w-full">
                    <div 
                      className={`w-full h-full rounded-[40px] border-4 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all relative ${isPhotoDragging ? 'bg-blue-50 border-blue-400 ring-4 ring-blue-100' : 'bg-slate-50 border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50/50'}`}
                      onDragOver={handlePhotoDragOver}
                      onDragLeave={handlePhotoDragLeave}
                      onDrop={handlePhotoDrop}
                    >
                      {newStaff.picture ? (
                        <img src={newStaff.picture} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-6">
                          <Plus className="mx-auto text-slate-300 mb-4" size={48} />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload Passport</p>
                          <p className="text-[8px] text-slate-400 mt-2 uppercase tracking-tight font-black">Drop file here</p>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    {newStaff.picture && (
                      <button 
                        type="button" 
                        onClick={() => setNewStaff({ ...newStaff, picture: '' })}
                        className="absolute -top-3 -right-3 p-2 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-transform hover:scale-110 active:scale-95"
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-center text-slate-400 italic">Preferred: Square JPG/PNG, &lt; 500KB</p>
                </div>

                <div className="lg:col-span-3 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">LASRRA ID Number</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. LA-12345678"
                        value={newStaff.lasrraId}
                        onChange={(e) => setNewStaff({ ...newStaff, lasrraId: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Institution Staff ID</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. LASU/ST/2024/001"
                        value={newStaff.staffId}
                        onChange={(e) => setNewStaff({ ...newStaff, staffId: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Title</label>
                      <select
                        required
                        value={newStaff.title}
                        onChange={(e) => setNewStaff({ ...newStaff, title: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                      >
                        <option value="">Title</option>
                        {['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Engr.', 'Barr.', 'Chief'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Surname</label>
                        <input
                          required
                          type="text"
                          value={newStaff.surname}
                          onChange={(e) => setNewStaff({ ...newStaff, surname: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all text-sm font-bold uppercase"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">First Name</label>
                        <input
                          required
                          type="text"
                          value={newStaff.firstName}
                          onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all text-sm font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bio & Professional Data */}
              <div className="h-px bg-slate-100" />

              <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contact Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      required
                      type="email"
                      placeholder="email@institution.edu.ng"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all text-sm font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      required
                      type="tel"
                      placeholder="+234 ..."
                      value={newStaff.mobilePhone}
                      onChange={(e) => setNewStaff({ ...newStaff, mobilePhone: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all text-sm font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Gender</label>
                  <select
                    required
                    value={newStaff.gender}
                    onChange={(e) => setNewStaff({ ...newStaff, gender: e.target.value as any })}
                    className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Current Rank (Designation)</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Senior Lecturer"
                      value={newStaff.designation}
                      onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Date of Birth</label>
                  <input
                    required
                    type="date"
                    value={newStaff.dob}
                    onChange={(e) => setNewStaff({ ...newStaff, dob: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all text-sm font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Highest Qualification</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select
                      required
                      value={newStaff.highestQualification}
                      onChange={(e) => setNewStaff({ ...newStaff, highestQualification: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold capitalize"
                    >
                      <option value="">Select Qualification</option>
                      {['HND', 'B.Sc', 'B.A', 'B.Eng', 'M.Sc', 'M.A', 'M.Phil', 'PhD', 'Professor'].map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Institution</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select
                      required
                      value={newStaff.institutionId}
                      onChange={(e) => setNewStaff({ ...newStaff, institutionId: e.target.value, departmentId: '', facultyId: '' })}
                      className="w-full pl-12 pr-6 py-4 bg-slate-100 border-transparent focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                    >
                      <option value="">Select Institution</option>
                      {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Faculty/Directorate</label>
                  <select
                    required
                    value={newStaff.facultyId}
                    onChange={(e) => setNewStaff({ ...newStaff, facultyId: e.target.value, departmentId: '' })}
                    className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                  >
                    <option value="">Select Faculty/Directorate</option>
                    {faculties
                      .filter(f => f.institutionId === newStaff.institutionId)
                      .map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Department/Unit</label>
                  <select
                    required
                    value={newStaff.departmentId}
                    onChange={(e) => setNewStaff({ ...newStaff, departmentId: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                    disabled={!newStaff.facultyId}
                  >
                    <option value="">Select Department/Unit</option>
                    {departments
                      .filter(d => d.facultyId === newStaff.facultyId)
                      .map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Employment Status</label>
                  <select
                    required
                    value={newStaff.employmentStatus}
                    onChange={(e) => setNewStaff({ ...newStaff, employmentStatus: e.target.value as any })}
                    className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                  >
                    {["Active", "On Study Leave", "On Sabbatical", "On Leave of Absence", "On Suspension", "Appointment Terminated", "Dismissed", "Retired"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Grade Level</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. CONUASS 7"
                    value={newStaff.gradeLevel}
                    onChange={(e) => setNewStaff({ ...newStaff, gradeLevel: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-100 border-transparent text-slate-500 rounded-2xl outline-none transition-all text-sm font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">First Appointment Date</label>
                  <input
                    required
                    type="date"
                    value={newStaff.dateOfFirstAppointment}
                    onChange={(e) => setNewStaff({ ...newStaff, dateOfFirstAppointment: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all text-sm font-bold"
                  />
                </div>
              </section>

              <div className="pt-10 flex justify-end gap-4 pb-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all active:scale-[0.98]"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className="px-12 py-4 bg-blue-600 text-white font-black rounded-[20px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 hover:shadow-blue-200 active:scale-[0.98]"
                >
                  {editingStaff ? 'Update Verification' : 'Finalize Registration'}
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

const Briefcase = ({ className, size }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
