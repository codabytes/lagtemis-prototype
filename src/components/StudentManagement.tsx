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
import { ExportButton } from './ExportButton';

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
  picture: '',
  campus: '',
  programmeType: 'Full-time'
};

/**
 * StudentManagement Component
 * 
 * Manages student records including enrollment, qualifications, and academic tracking.
 * Adheres to Nigerian educational standards for Universities (Degrees) and
 * other institutions (OND/HND).
 */
export const StudentManagement: React.FC = () => {
  const { user, canManage, canDelete } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    institutionId: 'all',
    campus: 'all',
    programmeType: 'all',
    facultyId: 'all',
    departmentId: 'all',
    enrollmentStatus: 'all'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [selectedLasrraId, setSelectedLasrraId] = useState('');
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
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);

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
        setInstitutions(instSnap.docs.map(d => ({ id: d.id, ...d.data() } as Institution)).sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return a.name.localeCompare(b.name);
        }));
        setFaculties(facultySnap.docs.map(d => ({ id: d.id, ...d.data() } as Faculty)));
        setDepartments(deptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Department)));
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'students');
      }
    };

    fetchData();
  }, []);

  const processPictureFile = (file: File) => {
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
        const studentData = {
          ...newStudent,
          admissionYear: newStudent.admissionYear || new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'students'), studentData);
        await logAudit('CREATE', 'students', docRef.id, `Added student journey: ${newStudent.firstName} ${newStudent.lastName} for LASRRA ${newStudent.lasrraId}`);
        setStudents([...students, { id: docRef.id, ...studentData } as Student]);
      }
      setIsModalOpen(false);
      setIsJourneyModalOpen(false);
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

  const enrollmentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      if (s.lasrraId) {
        counts[s.lasrraId] = (counts[s.lasrraId] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  const filteredStudents = React.useMemo(() => {
    return students.filter(s => {
      const searchStr = `${s.firstName} ${s.lastName} ${s.matricNumber}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      
      const matchesInstitution = filters.institutionId === 'all' || s.institutionId === filters.institutionId;
      const matchesCampus = filters.campus === 'all' || s.campus === filters.campus;
      const matchesProgramme = filters.programmeType === 'all' || s.programmeType === filters.programmeType;
      const matchesFaculty = filters.facultyId === 'all' || s.facultyId === filters.facultyId;
      const matchesDept = filters.departmentId === 'all' || s.departmentId === filters.departmentId;
      const matchesStatus = filters.enrollmentStatus === 'all' || s.enrollmentStatus === filters.enrollmentStatus;
      
      return matchesSearch && matchesInstitution && matchesCampus && matchesProgramme && matchesFaculty && matchesDept && matchesStatus;
    });
  }, [students, searchTerm, filters]);

  const availableCampuses = React.useMemo(() => {
    const campuses = students
      .filter(s => s.campus && (filters.institutionId === 'all' || s.institutionId === filters.institutionId))
      .map(s => s.campus as string);
    return Array.from(new Set(campuses)).sort();
  }, [students, filters.institutionId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
          <p className="text-slate-500 italic serif text-sm">Centralized database for student lifecycle tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredStudents} fileName={`TEMIS_Students_${new Date().getFullYear()}`} />
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, or matric number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl transition-all duration-200 text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institution</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
              <Filter size={14} className="text-slate-400" />
              <select 
                value={filters.institutionId}
                onChange={(e) => setFilters(prev => ({ ...prev, institutionId: e.target.value, facultyId: 'all', departmentId: 'all' }))}
                className="w-full bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none uppercase tracking-wider"
              >
                <option value="all">Institution: ALL</option>
                {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Campus</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
              <Filter size={14} className="text-slate-400" />
              <select 
                value={filters.campus}
                onChange={(e) => setFilters(prev => ({ ...prev, campus: e.target.value }))}
                className="w-full bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none uppercase tracking-wider"
              >
                <option value="all">Campus: ALL</option>
                {availableCampuses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Programme Type</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
              <Filter size={14} className="text-slate-400" />
              <select 
                value={filters.programmeType}
                onChange={(e) => setFilters(prev => ({ ...prev, programmeType: e.target.value }))}
                className="w-full bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none uppercase tracking-wider"
              >
                <option value="all">Type: ALL</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Sandwich">Sandwich</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Faculty</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
              <Filter size={14} className="text-slate-400" />
              <select 
                value={filters.facultyId}
                onChange={(e) => setFilters(prev => ({ ...prev, facultyId: e.target.value, departmentId: 'all' }))}
                className="w-full bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none uppercase tracking-wider"
              >
                <option value="all">Faculty: ALL</option>
                {faculties
                  .filter(f => filters.institutionId === 'all' || f.institutionId === filters.institutionId)
                  .map(f => <option key={f.id} value={f.id}>{f.name}</option>)
                }
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
              <Filter size={14} className="text-slate-400" />
              <select 
                value={filters.departmentId}
                onChange={(e) => setFilters(prev => ({ ...prev, departmentId: e.target.value }))}
                className="w-full bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none uppercase tracking-wider"
              >
                <option value="all">Dept: ALL</option>
                {departments
                  .filter(d => filters.facultyId === 'all' || d.facultyId === filters.facultyId)
                  .map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                }
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Enrollment Status</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
              <GraduationCap size={14} className="text-slate-400" />
              <select 
                value={filters.enrollmentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, enrollmentStatus: e.target.value }))}
                className="w-full bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none uppercase tracking-wider"
              >
                <option value="all">Status: ALL</option>
                <option value="Enrolled">Enrolled</option>
                <option value="Withdrawn">Withdrawn</option>
                <option value="Suspended">Suspended</option>
                <option value="Rusticated">Rusticated</option>
              </select>
            </div>
          </div>

          <button 
            onClick={() => {
              setFilters({
                institutionId: 'all',
                campus: 'all',
                programmeType: 'all',
                facultyId: 'all',
                departmentId: 'all',
                enrollmentStatus: 'all'
              });
              setSearchTerm('');
            }}
            className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all h-[42px] flex items-center justify-center gap-2"
          >
            Clear All
          </button>
        </div>

        <div className="pt-2 border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {filters.institutionId !== 'all' || filters.campus !== 'all' || filters.programmeType !== 'all' || filters.facultyId !== 'all' || filters.departmentId !== 'all' || filters.enrollmentStatus !== 'all' || searchTerm ? 
              `Showing ${filteredStudents.length} matching result${filteredStudents.length !== 1 ? 's' : ''}` : 
              `Total Students: ${filteredStudents.length}`
            }
          </p>
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
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campus</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Programme Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Phone</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollment Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={11} className="px-6 py-4 h-16 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400 italic">No student records found</td>
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
                          {(enrollmentCounts[student.lasrraId] || 0) > 1 && (
                            <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1 rounded inline-block w-fit font-bold uppercase tracking-widest mt-0.5">Multiple Enrollments</span>
                          )}
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
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">{student.campus || 'Main Campus'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600">{student.programmeType}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {faculties.find(f => f.id === student.facultyId)?.name || 'Unknown'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 font-medium">
                      {departments.find(d => d.id === student.departmentId)?.name || 'Unknown'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">
                    {student.mobilePhone}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-blue-600">
                    {student.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      student.enrollmentStatus === 'Enrolled' ? 'bg-blue-50 text-blue-600' :
                      student.enrollmentStatus === 'Withdrawn' ? 'bg-amber-50 text-amber-600' :
                      student.enrollmentStatus === 'Suspended' ? 'bg-rose-50 text-rose-600' :
                      student.enrollmentStatus === 'Rusticated' ? 'bg-rose-600 text-white' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {student.enrollmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {canManage('students') && (
                        <button 
                          onClick={() => {
                            const existing = students.find(s => s.lasrraId === student.lasrraId);
                            if (existing) {
                              setNewStudent({
                                ...INITIAL_STUDENT_STATE,
                                lasrraId: existing.lasrraId,
                                firstName: existing.firstName,
                                lastName: existing.lastName,
                                otherName: existing.otherName,
                                dob: existing.dob,
                                sex: existing.sex,
                                email: existing.email,
                                mobilePhone: existing.mobilePhone,
                                picture: existing.picture
                              });
                              setIsModalOpen(true);
                            }
                          }}
                          className="p-1 text-indigo-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          title="Add New Journey/Enrollment"
                        >
                          <Plus size={18} />
                        </button>
                      )}
                      {canManage('students') && (
                        <button 
                          onClick={() => handleEditStudent(student)}
                          className="p-1 text-blue-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit This Specific Record"
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
            <form onSubmit={handleAddStudent} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-1/3 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload Picture</label>
                  <div className="relative group">
                    <div 
                      className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${isPhotoDragging ? 'bg-blue-50 border-blue-400 ring-4 ring-blue-100' : 'bg-slate-50 border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50/30'}`}
                      onDragOver={handlePhotoDragOver}
                      onDragLeave={handlePhotoDragLeave}
                      onDrop={handlePhotoDrop}
                    >
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
                          <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-tight font-black">Drop file here</p>
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
                    onChange={(e) => setNewStudent({ ...newStudent, institutionId: e.target.value, facultyId: '', departmentId: '' })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    <option value="">Select Institution</option>
                    {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campus</label>
                  <input
                    type="text"
                    placeholder="Main Campus, etc."
                    value={newStudent.campus || ''}
                    onChange={(e) => setNewStudent({ ...newStudent, campus: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Programme Type</label>
                  <select
                    required
                    value={newStudent.programmeType}
                    onChange={(e) => setNewStudent({ ...newStudent, programmeType: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  >
                    {['Full-time', 'Part-time', 'Sandwich'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faculty</label>
                  <select
                    required
                    disabled={!newStudent.institutionId}
                    value={newStudent.facultyId}
                    onChange={(e) => setNewStudent({ ...newStudent, facultyId: e.target.value, departmentId: '' })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">Select Faculty</option>
                    {faculties
                      .filter(f => f.institutionId === newStudent.institutionId)
                      .map(f => <option key={f.id} value={f.id}>{f.name}</option>)
                    }
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department</label>
                  <select
                    required
                    disabled={!newStudent.facultyId}
                    value={newStudent.departmentId}
                    onChange={(e) => setNewStudent({ ...newStudent, departmentId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">Select Department</option>
                    {departments
                      .filter(d => d.facultyId === newStudent.facultyId)
                      .map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)
                    }
                  </select>
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrollment Status</label>
                  <select
                    disabled={!editingStudent}
                    value={newStudent.enrollmentStatus}
                    onChange={(e) => setNewStudent({ ...newStudent, enrollmentStatus: e.target.value as any })}
                    className={`w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all ${!editingStudent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {['Enrolled', 'Withdrawn', 'Suspended', 'Rusticated'].map(opt => (
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
