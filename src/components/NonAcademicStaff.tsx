import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  UserX, 
  Users,
  Download,
  Trash2,
  MoreVertical,
  XCircle
} from 'lucide-react';
import { where, orderBy } from 'firebase/firestore';
import { dbService } from '../services/db';
import { Staff, Institution, Department, Faculty } from '../types';
import { useAuth } from './AuthGuard';
import { ConfirmDialog } from './ConfirmDialog';
import { exportData } from '../lib/exportUtils';

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
  designation: '',
  gradeLevel: '',
  dateOfFirstAppointment: '',
  dateOfConfirmation: '',
  dateOfLastPromotion: '',
  highestQualification: '',
  employmentStatus: 'Active',
  staffType: 'Non-Academic',
  picture: ''
};

export const NonAcademicStaff: React.FC = () => {
  const { user, canManage, canDelete } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Filters
  const [filterRank, setFilterRank] = useState('All Ranks');
  const [filterQual, setFilterQual] = useState('All Qualifications');
  const [filterInst, setFilterInst] = useState('All Institutions');
  const [filterStatus, setFilterStatus] = useState('All Statuses');

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
  const [newStaff, setNewStaff] = useState<Partial<Staff>>(INITIAL_STAFF_STATE);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [staffData, instData, deptData, facultyData] = await Promise.all([
        dbService.list<Staff>('staff', [where('staffType', '==', 'Non-Academic'), orderBy('surname')]),
        dbService.list<Institution>('institutions'),
        dbService.list<Department>('departments'),
        dbService.list<Faculty>('faculties')
      ]);

      setStaff(staffData);
      setInstitutions(instData);
      setDepartments(deptData);
      setFaculties(facultyData);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit for base64
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
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage('staff')) return;
    try {
      const staffData = { ...newStaff, staffType: 'Non-Academic' };
      if (editingStaff) {
        await dbService.update('staff', editingStaff.id, staffData, `Updated non-academic staff: ${newStaff.firstName} ${newStaff.surname}`);
        setStaff(staff.map(s => s.id === editingStaff.id ? { ...editingStaff, ...staffData } as Staff : s));
      } else {
        const id = await dbService.create('staff', staffData as any, `Added non-academic staff: ${newStaff.firstName} ${newStaff.surname}`);
        setStaff([...staff, { id, ...staffData } as Staff]);
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      setNewStaff(INITIAL_STAFF_STATE);
    } catch (error) {
      // Error handled by dbService
    }
  };

  const handleEditStaff = (member: Staff) => {
    if (!canManage('staff')) return;
    setEditingStaff(member);
    setNewStaff(member);
    setIsModalOpen(true);
  };

  const handleDeleteStaff = async (e: React.MouseEvent, member: Staff) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDelete('staff')) {
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

  const filteredStaff = React.useMemo(() => 
    staff.filter(s => {
      const matchesSearch = `${s.firstName} ${s.surname} ${s.otherName || ''} ${s.designation} ${institutions.find(i => i.id === s.institutionId)?.name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = filterRank === 'All Ranks' || s.designation === filterRank;
      const matchesQual = filterQual === 'All Qualifications' || s.highestQualification === filterQual;
      const matchesInst = filterInst === 'All Institutions' || s.institutionId === filterInst;
      const matchesStatus = filterStatus === 'All Statuses' || s.employmentStatus === filterStatus;
      
      return matchesSearch && matchesRank && matchesQual && matchesInst && matchesStatus;
    }), [staff, searchTerm, filterRank, filterQual, filterInst, filterStatus, institutions]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Non-Academic Staff Management</h1>
          <p className="text-slate-500 italic serif text-sm">Digital nominal roll and credentials tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportData(filteredStaff, `TEMIS_NonAcademic_Staff_${new Date().getFullYear()}`, 'csv')}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Export Records"
          >
            <Download size={20} />
          </button>
          {canManage('staff') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100"
            >
              <Plus size={20} />
              Add Staff
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, rank or institution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select 
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value)}
            className="bg-slate-50 border-none text-xs font-semibold rounded-xl px-4 py-2 text-slate-600 outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option>All Ranks</option>
            {[...new Set(staff.map(s => s.designation))].sort().map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select 
            value={filterQual}
            onChange={(e) => setFilterQual(e.target.value)}
            className="bg-slate-50 border-none text-xs font-semibold rounded-xl px-4 py-2 text-slate-600 outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option>All Qualifications</option>
            {[...new Set(staff.map(s => s.highestQualification))].sort().map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <select 
            value={filterInst}
            onChange={(e) => setFilterInst(e.target.value)}
            className="bg-slate-50 border-none text-xs font-semibold rounded-xl px-4 py-2 text-slate-600 outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option>All Institutions</option>
            {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border-none text-xs font-semibold rounded-xl px-4 py-2 text-slate-600 outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option>All Statuses</option>
            {["Active", "On Study Leave", "On Sabbatical", "On Leave of Absence", "On Suspension", "Appointment Terminated", "Dismissed", "Retired"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">LASRRA ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qualification</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employment Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="px-6 py-4 h-16 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic">No staff records found</td>
                </tr>
              ) : filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-slate-600">{member.lasrraId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-slate-600">{member.staffId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.picture ? (
                        <img 
                          src={member.picture} 
                          alt="Staff" 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {member.firstName[0]}{member.surname[0]}
                        </div>
                      )}
                      <Link 
                        to={`/staff/${member.id}`}
                        className="text-sm text-left hover:text-blue-600 transition-colors"
                      >
                        <span className="font-bold uppercase">{member.surname}</span>, {member.firstName} {member.otherName || ''}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{member.designation}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {institutions.find(i => i.id === member.institutionId)?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {departments.find(d => d.id === member.departmentId)?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600">{member.highestQualification}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      member.employmentStatus === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                      member.employmentStatus === 'Retired' ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {member.employmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {canManage('staff') && (
                        <button 
                          onClick={() => handleEditStaff(member)}
                          className="p-1 text-blue-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                      )}
                      {canDelete('staff') && (
                        <button 
                          type="button"
                          onClick={(e) => handleDeleteStaff(e, member)}
                          className="p-1 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingStaff ? 'Update Non-Academic Staff Record' : 'Add New Non-Academic Staff Record'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingStaff(null); setNewStaff(INITIAL_STAFF_STATE); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <UserX size={24} />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-1/3 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload Picture</label>
                  <div className="relative group">
                    <div className="w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:bg-blue-50/30">
                      {newStaff.picture ? (
                        <img 
                          src={newStaff.picture} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Plus className="mx-auto text-slate-300 mb-2" size={32} />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passport Photo</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    {newStaff.picture && (
                      <button
                        type="button"
                        onClick={() => setNewStaff({ ...newStaff, picture: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Max size: 500KB. Passport size preferred.</p>
                </div>

                <div className="flex-1 space-y-6 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">LASRRA ID Number</label>
                      <input
                        required
                        type="text"
                        value={newStaff.lasrraId}
                        onChange={(e) => setNewStaff({ ...newStaff, lasrraId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Staff ID Number</label>
                      <input
                        required
                        type="text"
                        value={newStaff.staffId}
                        onChange={(e) => setNewStaff({ ...newStaff, staffId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Title</label>
                      <select
                        required
                        value={newStaff.title}
                        onChange={(e) => setNewStaff({ ...newStaff, title: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                      >
                        <option value="">Select Title</option>
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Prof.">Prof.</option>
                        <option value="Engr.">Engr.</option>
                        <option value="Barr.">Barr.</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Surname</label>
                      <input
                        required
                        type="text"
                        value={newStaff.surname}
                        onChange={(e) => setNewStaff({ ...newStaff, surname: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">First Name</label>
                      <input
                        required
                        type="text"
                        value={newStaff.firstName}
                        onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Other Name</label>
                  <input
                    type="text"
                    value={newStaff.otherName}
                    onChange={(e) => setNewStaff({ ...newStaff, otherName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gender</label>
                  <select
                    required
                    value={newStaff.gender}
                    onChange={(e) => setNewStaff({ ...newStaff, gender: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date of Birth</label>
                  <input
                    required
                    type="date"
                    value={newStaff.dob}
                    onChange={(e) => setNewStaff({ ...newStaff, dob: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institution</label>
                  <select
                    required
                    value={newStaff.institutionId}
                    onChange={(e) => setNewStaff({ ...newStaff, institutionId: e.target.value, departmentId: '' })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    <option value="">Select Institution</option>
                    {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department</label>
                  <select
                    required
                    value={newStaff.departmentId}
                    onChange={(e) => setNewStaff({ ...newStaff, departmentId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    <option value="">Select Department</option>
                    {departments
                      .filter(d => {
                        const faculty = faculties.find(f => f.id === d.facultyId);
                        return faculty && faculty.institutionId === newStaff.institutionId;
                      })
                      .map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)
                    }
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Designation/Rank</label>
                  <input
                    required
                    type="text"
                    value={newStaff.designation}
                    onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grade Level</label>
                  <input
                    required
                    type="text"
                    value={newStaff.gradeLevel}
                    onChange={(e) => setNewStaff({ ...newStaff, gradeLevel: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date of First Appointment</label>
                  <input
                    required
                    type="date"
                    value={newStaff.dateOfFirstAppointment}
                    onChange={(e) => setNewStaff({ ...newStaff, dateOfFirstAppointment: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date of Confirmation</label>
                  <input
                    required
                    type="date"
                    value={newStaff.dateOfConfirmation}
                    onChange={(e) => setNewStaff({ ...newStaff, dateOfConfirmation: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date of Last Promotion</label>
                  <input
                    required
                    type="date"
                    value={newStaff.dateOfLastPromotion}
                    onChange={(e) => setNewStaff({ ...newStaff, dateOfLastPromotion: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Highest Qualification</label>
                  <input
                    required
                    type="text"
                    value={newStaff.highestQualification}
                    onChange={(e) => setNewStaff({ ...newStaff, highestQualification: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Employment Status</label>
                  <select
                    required
                    value={newStaff.employmentStatus}
                    onChange={(e) => setNewStaff({ ...newStaff, employmentStatus: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    {["Active", "On Study Leave", "On Sabbatical", "On Leave of Absence", "On Suspension", "Appointment Terminated", "Dismissed", "Retired"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
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
