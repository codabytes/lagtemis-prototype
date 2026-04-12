import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  GraduationCap,
  Download,
  FileCheck,
  History,
  Trash2
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, logAudit } from '../firebase';
import { Student, Institution, Department, Faculty } from '../types';
import { useAuth } from './AuthGuard';
import { format } from 'date-fns';
import { ConfirmDialog } from './ConfirmDialog';

const INITIAL_STUDENT_STATE: Partial<Student> = {
  lasrraId: '',
  firstName: '',
  otherName: '',
  lastName: '',
  sex: 'Male',
  dob: '',
  mobilePhone: '',
  email: '',
  matricNumber: '',
  enrollmentStatus: 'Enrolled',
  certificateVerified: false,
  admissionYear: '',
  graduationYear: null,
  picture: ''
};

export const StudentManagement: React.FC = () => {
  const { user, canManage, canDelete } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

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
  const [newStudent, setNewStudent] = useState<Partial<Student>>(INITIAL_STUDENT_STATE);

  const getMinGraduationDate = (admissionDate: string) => {
    if (!admissionDate) return '';
    const date = new Date(admissionDate);
    date.setFullYear(date.getFullYear() + 2);
    return date.toISOString().split('T')[0];
  };

  const isFormDirty = () => {
    return Object.keys(INITIAL_STUDENT_STATE).some(key => {
      const k = key as keyof Student;
      const initialValue = editingStudent ? editingStudent[k] : INITIAL_STUDENT_STATE[k];
      return newStudent[k] !== initialValue;
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
          setEditingStudent(null);
          setNewStudent(INITIAL_STUDENT_STATE);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
        isDangerous: true
      });
    } else {
      setIsModalOpen(false);
      setEditingStudent(null);
      setNewStudent(INITIAL_STUDENT_STATE);
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
  }, [isModalOpen, newStudent, editingStudent]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsSnap, instSnap, facultySnap, deptSnap] = await Promise.all([
          getDocs(query(collection(db, 'students'), orderBy('lastName'))),
          getDocs(collection(db, 'institutions')),
          getDocs(collection(db, 'faculties')),
          getDocs(collection(db, 'departments'))
        ]);

        setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
        setInstitutions(instSnap.docs.map(d => ({ id: d.id, ...d.data() } as Institution)));
        setFaculties(facultySnap.docs.map(d => ({ id: d.id, ...d.data() } as Faculty)));
        setDepartments(deptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Department)));
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'students');
      }
    };

    fetchData();
  }, []);

  // Auto-populate faculty when department changes
  useEffect(() => {
    if (newStudent.departmentId) {
      const dept = departments.find(d => d.id === newStudent.departmentId);
      if (dept && dept.facultyId) {
        setNewStudent(prev => ({ ...prev, facultyId: dept.facultyId }));
      }
    }
  }, [newStudent.departmentId, departments]);

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
        setNewStudent({ ...newStudent, picture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage('students')) return;
    try {
      if (editingStudent) {
        const studentRef = doc(db, 'students', editingStudent.id);
        await updateDoc(studentRef, newStudent);
        await logAudit('UPDATE', 'students', editingStudent.id, `Updated student: ${newStudent.firstName} ${newStudent.lastName}`);
        setStudents(students.map(s => s.id === editingStudent.id ? { ...editingStudent, ...newStudent } as Student : s));
      } else {
        const docRef = await addDoc(collection(db, 'students'), newStudent);
        await logAudit('CREATE', 'students', docRef.id, `Added student: ${newStudent.firstName} ${newStudent.lastName}`);
        setStudents([...students, { id: docRef.id, ...newStudent } as Student]);
      }
      setIsModalOpen(false);
      setEditingStudent(null);
      setNewStudent(INITIAL_STUDENT_STATE);
    } catch (error) {
      handleFirestoreError(error, editingStudent ? OperationType.UPDATE : OperationType.CREATE, 'students');
    }
  };

  const handleEditStudent = (student: Student) => {
    if (!canManage('students')) return;
    setEditingStudent(student);
    setNewStudent(student);
    setIsModalOpen(true);
  };

  const toggleVerification = async (student: Student) => {
    if (!canManage('students')) return;
    try {
      const studentRef = doc(db, 'students', student.id);
      const newValue = !student.certificateVerified;
      await updateDoc(studentRef, { certificateVerified: newValue });
      await logAudit('UPDATE', 'students', student.id, `Toggled verification to ${newValue}`);
      setStudents(students.map(s => s.id === student.id ? { ...s, certificateVerified: newValue } : s));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${student.id}`);
    }
  };

  const handleDeleteStudent = async (e: React.MouseEvent, student: Student) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canDelete('students')) {
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
      title: 'Delete Student Record',
      message: `Are you sure you want to delete the record for ${student.firstName} ${student.lastName}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'students', student.id));
          await logAudit('DELETE', 'students', student.id, `Deleted student: ${student.firstName} ${student.lastName}`);
          setStudents(students.filter(s => s.id !== student.id));
          console.log(`Successfully deleted student: ${student.firstName} ${student.lastName}`);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting student:', error);
          handleFirestoreError(error, OperationType.DELETE, `students/${student.id}`);
        }
      },
      isDangerous: true
    });
  };

  const filteredStudents = React.useMemo(() => 
    students.filter(s => 
      `${s.firstName} ${s.lastName} ${s.otherName || ''} ${s.matricNumber} ${s.lasrraId} ${s.enrollmentStatus}`.toLowerCase().includes(searchTerm.toLowerCase())
    ), [students, searchTerm]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
          <p className="text-slate-500 italic serif text-sm">Centralized database for student lifecycle tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">
            <Download size={20} />
          </button>
          {canManage('students') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100"
            >
              <Plus size={20} />
              Add Student
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
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-slate-50 border-none text-sm font-semibold rounded-xl px-4 py-2 text-slate-600 outline-none focus:ring-2 focus:ring-blue-100">
            <option>All Institutions</option>
            {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
          </select>
          <select className="bg-slate-50 border-none text-sm font-semibold rounded-xl px-4 py-2 text-slate-600 outline-none focus:ring-2 focus:ring-blue-100">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Graduated</option>
            <option>Archived</option>
          </select>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matric Number</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty/Directorate</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department/Unit</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admission</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollment Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No student records found</td>
                </tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {student.picture ? (
                        <img 
                          src={student.picture} 
                          alt="Student" 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                      )}
                      <div>
                        <Link 
                          to={`/students/${student.id}`}
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors text-left"
                        >
                          {student.firstName} {student.otherName ? `${student.otherName} ` : ''}{student.lastName}
                        </Link>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">ID: {student.id.slice(0, 8)}</p>
                          <p className="text-[10px] text-blue-500 font-mono uppercase tracking-tighter">LASRRA: {student.lasrraId}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-600">{student.matricNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-600">
                      {institutions.find(i => i.id === student.institutionId)?.name || 'Unknown'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {faculties.find(f => f.id === student.facultyId)?.name || 'Unknown'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {departments.find(d => d.id === student.departmentId)?.name || 'Unknown'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-slate-600">
                      <div className="flex items-center gap-2">
                        <History size={14} className="text-slate-400" />
                        <span className="text-sm font-mono">
                          {student.admissionYear ? new Date(student.admissionYear).getFullYear() : 'N/A'}
                        </span>
                      </div>
                      {student.graduationYear && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <GraduationCap size={12} />
                          <span>Grad: {new Date(student.graduationYear).getFullYear()}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleVerification(student)}
                      disabled={!canManage('students')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        student.certificateVerified 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-amber-50 text-amber-600'
                      } ${!canManage('students') ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-80'}`}
                    >
                      {student.certificateVerified ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {student.certificateVerified ? 'Verified' : 'Pending'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      student.enrollmentStatus === 'Enrolled' ? 'bg-blue-50 text-blue-600' :
                      student.enrollmentStatus === 'Graduated' ? 'bg-emerald-50 text-emerald-600' :
                      student.enrollmentStatus === 'Withdrawn' ? 'bg-amber-50 text-amber-600' :
                      student.enrollmentStatus === 'Suspended' ? 'bg-rose-50 text-rose-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {student.enrollmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold text-slate-600">{student.email}</p>
                      <p className="text-[10px] text-slate-400">{student.mobilePhone}</p>
                      <p className="text-[10px] text-slate-400">DOB: {student.dob}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {canManage('students') && (
                        <button 
                          onClick={() => handleEditStudent(student)}
                          className="p-1 text-blue-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Student"
                        >
                          <MoreVertical size={18} />
                        </button>
                      )}
                      {canDelete('students') && (
                        <button 
                          type="button"
                          onClick={(e) => handleDeleteStudent(e, student)}
                          className="p-1 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Student"
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

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingStudent ? 'Update Student Record' : 'Add New Student Record'}</h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-1/3 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload Picture</label>
                  <div className="relative group">
                    <div className="w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:bg-blue-50/30">
                      {newStudent.picture ? (
                        <img 
                          src={newStudent.picture} 
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
                    {newStudent.picture && (
                      <button
                        type="button"
                        onClick={() => setNewStudent({ ...newStudent, picture: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Max size: 500KB. Passport size preferred.</p>
                </div>

                <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">LASRRA ID NUMBER</label>
                    <input
                      required
                      type="text"
                      placeholder="Enter LASRRA ID"
                      value={newStudent.lasrraId}
                      onChange={(e) => setNewStudent({ ...newStudent, lasrraId: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">First Name</label>
                      <input
                        required
                        type="text"
                        value={newStudent.firstName}
                        onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Other Name</label>
                      <input
                        type="text"
                        value={newStudent.otherName}
                        onChange={(e) => setNewStudent({ ...newStudent, otherName: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Surname</label>
                      <input
                        required
                        type="text"
                        value={newStudent.lastName}
                        onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Matriculation Number</label>
                  <input
                    required
                    type="text"
                    value={newStudent.matricNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, matricNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sex</label>
                  <div className="flex gap-4 h-10 items-center">
                    {['Male', 'Female'].map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sex"
                          value={option}
                          checked={newStudent.sex === option}
                          onChange={(e) => setNewStudent({ ...newStudent, sex: e.target.value as any })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-slate-600">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date of Birth</label>
                  <input
                    required
                    type="date"
                    value={newStudent.dob}
                    onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mobile Phone</label>
                  <input
                    required
                    type="tel"
                    placeholder="08012345678"
                    value={newStudent.mobilePhone}
                    onChange={(e) => setNewStudent({ ...newStudent, mobilePhone: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="student@example.com"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institution</label>
                  <select
                    required
                    value={newStudent.institutionId}
                    onChange={(e) => setNewStudent({ ...newStudent, institutionId: e.target.value, departmentId: '', facultyId: '' })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    <option value="">Select Institution</option>
                    {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department/Unit</label>
                  <select
                    required
                    value={newStudent.departmentId}
                    onChange={(e) => setNewStudent({ ...newStudent, departmentId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    <option value="">Select Department/Unit</option>
                    {departments
                      .filter(d => {
                        const faculty = faculties.find(f => f.id === d.facultyId);
                        return faculty && faculty.institutionId === newStudent.institutionId;
                      })
                      .map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)
                    }
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faculty/Directorate (Auto)</label>
                  <input
                    readOnly
                    type="text"
                    value={faculties.find(f => f.id === newStudent.facultyId)?.name || ''}
                    placeholder="Auto-populated"
                    className="w-full px-4 py-2 bg-slate-100 border-transparent text-slate-500 rounded-xl outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date of Admission</label>
                  <input
                    required
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={newStudent.admissionYear}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setNewStudent(prev => {
                        const updated = { ...prev, admissionYear: newDate };
                        // Clear graduation year if it's now before the new min date
                        if (prev.graduationYear && newDate) {
                          const minGrad = getMinGraduationDate(newDate);
                          if (prev.graduationYear < minGrad) {
                            updated.graduationYear = null;
                          }
                        }
                        return updated;
                      });
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date of Graduation</label>
                  <input
                    type="date"
                    disabled={!newStudent.admissionYear}
                    min={getMinGraduationDate(newStudent.admissionYear || '')}
                    value={newStudent.graduationYear || ''}
                    onChange={(e) => {
                      const gradDate = e.target.value;
                      setNewStudent({ 
                        ...newStudent, 
                        graduationYear: gradDate,
                        enrollmentStatus: gradDate ? 'Graduated' : newStudent.enrollmentStatus
                      });
                    }}
                    placeholder="Optional"
                    className={`w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all ${!newStudent.admissionYear ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {!newStudent.admissionYear && (
                    <p className="text-[10px] text-amber-600 font-medium italic">Please select admission date first</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrollment Status</label>
                  <select
                    disabled={!editingStudent}
                    value={newStudent.enrollmentStatus}
                    onChange={(e) => setNewStudent({ ...newStudent, enrollmentStatus: e.target.value as any })}
                    className={`w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all ${!editingStudent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {['Enrolled', 'Graduated', 'Withdrawn', 'Suspended', 'Rusticated', 'Archived'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {!editingStudent && (
                    <p className="text-[10px] text-slate-400 italic">Status is managed automatically for new records</p>
                  )}
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
