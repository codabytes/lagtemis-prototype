import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Database } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, logAudit } from '../firebase';
import { Institution, Faculty, Department, Student } from '../types';
import { useAuth } from './AuthGuard';
import { calculateStemRatio } from '../lib/academicUtils';
import { ConfirmDialog } from './ConfirmDialog';
import { InstitutionCard } from './institution/InstitutionCard';
import { InstitutionInsights } from './institution/InstitutionInsights';
import { InstitutionModals } from './institution/InstitutionModals';

import { ACADEMIC_DATA } from '../constants/academicData';

export const InstitutionManagement: React.FC = () => {
  const { user, canManage, canDelete } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInst, setExpandedInst] = useState<string | null>(null);
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

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
  
  const initialInstState: Partial<Institution> = {
    name: '',
    shortName: '',
    type: 'Public',
    address: '',
    website: '',
    logoUrl: ''
  };

  const initialFacultyState: Partial<Faculty> = {
    name: '',
    institutionId: '',
    type: 'directorate'
  };

  const initialDeptState: Partial<Department> = {
    name: '',
    facultyId: '',
    isSTEM: false,
    type: 'unit'
  };

  const [newInst, setNewInst] = useState<Partial<Institution>>(initialInstState);
  const [newFaculty, setNewFaculty] = useState<Partial<Faculty>>(initialFacultyState);
  const [newDept, setNewDept] = useState<Partial<Department>>(initialDeptState);

  const isInstDirty = () => {
    return Object.keys(initialInstState).some(key => {
      const k = key as keyof Institution;
      return newInst[k] !== (editingInst ? editingInst[k] : initialInstState[k]);
    });
  };

  const isFacultyDirty = () => {
    return Object.keys(initialFacultyState).some(key => {
      const k = key as keyof Faculty;
      if (k === 'institutionId') return false;
      return newFaculty[k] !== initialFacultyState[k];
    });
  };

  const isDeptDirty = () => {
    return Object.keys(initialDeptState).some(key => {
      const k = key as keyof Department;
      if (k === 'facultyId') return false;
      return newDept[k] !== initialDeptState[k];
    });
  };

  const handleCloseInstModal = () => {
    if (isInstDirty()) {
      setConfirmState({
        isOpen: true,
        title: 'Discard Changes',
        message: 'You have unsaved changes. Are you sure you want to close the form?',
        onConfirm: () => {
          setIsModalOpen(false);
          setEditingInst(null);
          setNewInst(initialInstState);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
        isDangerous: true
      });
    } else {
      setIsModalOpen(false);
      setEditingInst(null);
      setNewInst(initialInstState);
    }
  };

  const handleCloseFacultyModal = () => {
    if (isFacultyDirty()) {
      setConfirmState({
        isOpen: true,
        title: 'Discard Changes',
        message: 'You have unsaved changes. Are you sure you want to close the form?',
        onConfirm: () => {
          setIsFacultyModalOpen(false);
          setNewFaculty(initialFacultyState);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
        isDangerous: true
      });
    } else {
      setIsFacultyModalOpen(false);
      setNewFaculty(initialFacultyState);
    }
  };

  const handleCloseDeptModal = () => {
    if (isDeptDirty()) {
      setConfirmState({
        isOpen: true,
        title: 'Discard Changes',
        message: 'You have unsaved changes. Are you sure you want to close the form?',
        onConfirm: () => {
          setIsDeptModalOpen(false);
          setNewDept(initialDeptState);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
        isDangerous: true
      });
    } else {
      setIsDeptModalOpen(false);
      setNewDept(initialDeptState);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) handleCloseInstModal();
        else if (isFacultyModalOpen) handleCloseFacultyModal();
        else if (isDeptModalOpen) handleCloseDeptModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, isFacultyModalOpen, isDeptModalOpen, newInst, newFaculty, newDept]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instSnap, facultySnap, deptSnap, studentsSnap] = await Promise.all([
          getDocs(collection(db, 'institutions')),
          getDocs(collection(db, 'faculties')),
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'students'))
        ]);

        const sortedInsts = instSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Institution))
          .sort((a, b) => a.name.localeCompare(b.name));

        setInstitutions(sortedInsts);
        setFaculties(facultySnap.docs.map(d => ({ id: d.id, ...d.data() } as Faculty)));
        setDepartments(deptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Department)));
        setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'institutions');
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewInst({ ...newInst, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage('institutions')) return;
    try {
      if (editingInst) {
        await updateDoc(doc(db, 'institutions', editingInst.id), newInst);
        await logAudit('UPDATE', 'institutions', editingInst.id, `Updated institution: ${newInst.name}`);
        setInstitutions(institutions.map(i => i.id === editingInst.id ? { ...i, ...newInst } as Institution : i));
      } else {
        const docRef = await addDoc(collection(db, 'institutions'), newInst);
        await logAudit('CREATE', 'institutions', docRef.id, `Added institution: ${newInst.name}`);
        setInstitutions([...institutions, { id: docRef.id, ...newInst } as Institution]);
        setExpandedInst(docRef.id);
      }
      setIsModalOpen(false);
      setEditingInst(null);
      setNewInst(initialInstState);
    } catch (error) {
      handleFirestoreError(error, editingInst ? OperationType.UPDATE : OperationType.CREATE, 'institutions');
    }
  };

  const handleEditInstitution = (e: React.MouseEvent, inst: Institution) => {
    e.stopPropagation();
    setEditingInst(inst);
    setNewInst(inst);
    setIsModalOpen(true);
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage('faculties') || !selectedInstId) return;
    try {
      const facultyData = { ...newFaculty, institutionId: selectedInstId };
      const docRef = await addDoc(collection(db, 'faculties'), facultyData);
      await logAudit('CREATE', 'faculties', docRef.id, `Added ${newFaculty.type}: ${newFaculty.name} to institution ${selectedInstId}`);
      setFaculties([...faculties, { id: docRef.id, ...facultyData } as Faculty]);
      setExpandedFaculty(docRef.id);
      setIsFacultyModalOpen(false);
      setNewFaculty(initialFacultyState);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'faculties');
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage('departments') || !selectedFacultyId) return;
    try {
      const deptData = { ...newDept, facultyId: selectedFacultyId };
      const docRef = await addDoc(collection(db, 'departments'), deptData);
      await logAudit('CREATE', 'departments', docRef.id, `Added ${newDept.type}: ${newDept.name} to faculty ${selectedFacultyId}`);
      setDepartments([...departments, { id: docRef.id, ...deptData } as Department]);
      setIsDeptModalOpen(false);
      setNewDept(initialDeptState);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'departments');
    }
  };

  const handleDeleteInstitution = async (e: React.MouseEvent, instId: string, instName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDelete('institutions')) {
      setConfirmState({
        isOpen: true,
        title: 'Access Denied',
        message: 'You do not have permission to delete records.',
        onConfirm: () => setConfirmState(prev => ({ ...prev, isOpen: false })),
        isDangerous: false
      });
      return;
    }

    const instFaculties = faculties.filter(f => f.institutionId === instId);
    if (instFaculties.length > 0) {
      setConfirmState({
        isOpen: true,
        title: 'Cascade Delete',
        message: `This institution has ${instFaculties.length} faculties. Delete all associated data?`,
        onConfirm: () => performCascadeDelete(instId, instName),
        isDangerous: true
      });
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Delete Institution',
      message: `Are you sure you want to delete "${instName}"?`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'institutions', instId));
          await logAudit('DELETE', 'institutions', instId, `Deleted institution: ${instName}`);
          setInstitutions(institutions.filter(i => i.id !== instId));
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'institutions');
        }
      },
      isDangerous: true
    });
  };

  const performCascadeDelete = async (instId: string, instName: string) => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'institutions', instId));
      const instFaculties = faculties.filter(f => f.institutionId === instId);
      const facultyIds = instFaculties.map(f => f.id);
      const facultyDepts = departments.filter(d => facultyIds.includes(d.facultyId));
      instFaculties.forEach(f => batch.delete(doc(db, 'faculties', f.id)));
      facultyDepts.forEach(d => batch.delete(doc(db, 'departments', d.id)));
      await batch.commit();
      await logAudit('PURGE', 'institutions', instId, `Purged institution: ${instName}`);
      setInstitutions(institutions.filter(i => i.id !== instId));
      setFaculties(faculties.filter(f => f.institutionId !== instId));
      setDepartments(departments.filter(d => !facultyIds.includes(d.facultyId)));
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'institutions');
    }
  };

  const handleDeleteFaculty = async (e: React.MouseEvent, facultyId: string, facultyName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDelete('faculties')) {
      setConfirmState({
        isOpen: true,
        title: 'Access Denied',
        message: 'You do not have permission to delete records.',
        onConfirm: () => setConfirmState(prev => ({ ...prev, isOpen: false })),
        isDangerous: false
      });
      return;
    }

    const facultyDepts = departments.filter(d => d.facultyId === facultyId);
    if (facultyDepts.length > 0) {
      setConfirmState({
        isOpen: true,
        title: 'Cascade Delete',
        message: `This faculty has ${facultyDepts.length} departments. Delete all associated data?`,
        onConfirm: async () => {
          try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'faculties', facultyId));
            facultyDepts.forEach(d => batch.delete(doc(db, 'departments', d.id)));
            await batch.commit();
            await logAudit('PURGE', 'faculties', facultyId, `Purged faculty: ${facultyName}`);
            setFaculties(faculties.filter(f => f.id !== facultyId));
            setDepartments(departments.filter(d => d.facultyId !== facultyId));
            setConfirmState(prev => ({ ...prev, isOpen: false }));
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'faculties');
          }
        },
        isDangerous: true
      });
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Delete Faculty',
      message: `Are you sure you want to delete "${facultyName}"?`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'faculties', facultyId));
          await logAudit('DELETE', 'faculties', facultyId, `Deleted faculty: ${facultyName}`);
          setFaculties(faculties.filter(f => f.id !== facultyId));
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'faculties');
        }
      },
      isDangerous: true
    });
  };

  const handleDeleteDepartment = async (e: React.MouseEvent, deptId: string, deptName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDelete('departments')) {
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
      title: 'Delete Department',
      message: `Are you sure you want to delete "${deptName}"?`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'departments', deptId));
          await logAudit('DELETE', 'departments', deptId, `Deleted department: ${deptName}`);
          setDepartments(departments.filter(d => d.id !== deptId));
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'departments');
        }
      },
      isDangerous: true
    });
  };

  const handleDeleteAllFacultyDepartments = async (e: React.MouseEvent, facultyId: string, facultyName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDelete('departments')) {
      setConfirmState({
        isOpen: true,
        title: 'Access Denied',
        message: 'You do not have permission to delete records.',
        onConfirm: () => setConfirmState(prev => ({ ...prev, isOpen: false })),
        isDangerous: false
      });
      return;
    }

    const facultyDepts = departments.filter(d => d.facultyId === facultyId);
    if (facultyDepts.length === 0) return;

    setConfirmState({
      isOpen: true,
      title: 'Delete All Departments',
      message: `Delete ALL ${facultyDepts.length} departments in "${facultyName}"?`,
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          facultyDepts.forEach(dept => batch.delete(doc(db, 'departments', dept.id)));
          await batch.commit();
          await logAudit('DELETE', 'departments', facultyId, `Deleted all departments in faculty: ${facultyName}`);
          setDepartments(departments.filter(d => d.facultyId !== facultyId));
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'departments');
        }
      },
      isDangerous: true
    });
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredInstitutions = useMemo(() => {
    return institutions.filter(inst => 
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [institutions, searchTerm]);

  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    if (user?.role !== 'SuperUser') return;
    setIsSeeding(true);
    setLoading(true);
    try {
      const instCollection = collection(db, 'institutions');
      const facultyCollection = collection(db, 'faculties');
      const deptCollection = collection(db, 'departments');

      for (const instData of ACADEMIC_DATA) {
        const instDoc = await addDoc(instCollection, {
          name: instData.name,
          shortName: instData.shortName,
          type: 'Public',
          website: '',
          address: ''
        });
        const instId = instDoc.id;

        for (const facData of instData.faculties) {
          const facDoc = await addDoc(facultyCollection, {
            name: facData.name,
            institutionId: instId,
            type: facData.type || 'faculty'
          });
          const facId = facDoc.id;

          for (const dept of facData.departments) {
            const deptName = typeof dept === 'string' ? dept : dept.name;
            const isSTEM = typeof dept === 'string' ? (facData.allSTEM ?? true) : dept.isSTEM;

            await addDoc(deptCollection, {
              name: deptName,
              facultyId: facId,
              isSTEM: isSTEM,
              type: 'department'
            });
          }
        }
      }
      await logAudit('CREATE', 'system', 'seeding', 'Initial academic data seed completed');
      
      // Refresh data
      const [instSnap, facultySnap, deptSnap] = await Promise.all([
        getDocs(collection(db, 'institutions')),
        getDocs(collection(db, 'faculties')),
        getDocs(collection(db, 'departments'))
      ]);
      setInstitutions(instSnap.docs.map(d => ({ id: d.id, ...d.data() } as Institution)).sort((a, b) => a.name.localeCompare(b.name)));
      setFaculties(facultySnap.docs.map(d => ({ id: d.id, ...d.data() } as Faculty)));
      setDepartments(deptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Department)));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'system/seeding');
    } finally {
      setIsSeeding(false);
      setLoading(false);
    }
  };

  const stemRatio = useMemo(() => {
    return calculateStemRatio(students, departments);
  }, [students, departments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutional Hierarchy</h1>
          <p className="text-slate-500 italic serif text-sm">Mapping Faculties/Directorates and Departments/Units</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Filter institutions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            {canManage('institutions') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-100"
              >
                <Plus size={20} />
                Add Institution
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
            ))
          ) : filteredInstitutions.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 flex flex-col items-center gap-4">
              <p className="text-slate-400 italic">No institutions found matching your search</p>
              {institutions.length === 0 && user?.role === 'SuperUser' && (
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 flex items-center gap-2"
                >
                  <Database size={20} />
                  {isSeeding ? 'Seeding Data...' : 'Populate Initial Academic Data'}
                </button>
              )}
            </div>
          ) : filteredInstitutions.map((inst) => (
            <InstitutionCard
              key={inst.id}
              inst={inst}
              expandedInst={expandedInst}
              setExpandedInst={setExpandedInst}
              user={user}
              faculties={faculties}
              departments={departments}
              expandedFaculty={expandedFaculty}
              setExpandedFaculty={setExpandedFaculty}
              handleEditInstitution={handleEditInstitution}
              handleDeleteInstitution={handleDeleteInstitution}
              handleDeleteAllFacultyDepartments={handleDeleteAllFacultyDepartments}
              handleDeleteFaculty={handleDeleteFaculty}
              handleDeleteDepartment={handleDeleteDepartment}
              setSelectedInstId={setSelectedInstId}
              setIsFacultyModalOpen={setIsFacultyModalOpen}
              setSelectedFacultyId={setSelectedFacultyId}
              setIsDeptModalOpen={setIsDeptModalOpen}
            />
          ))}
        </div>

        <InstitutionInsights 
          institutions={institutions}
          faculties={faculties}
          departments={departments}
          students={students}
          stemRatio={stemRatio}
        />
      </div>

      <InstitutionModals
        isModalOpen={isModalOpen}
        editingInst={editingInst}
        handleCloseInstModal={handleCloseInstModal}
        handleAddInstitution={handleAddInstitution}
        newInst={newInst}
        setNewInst={setNewInst}
        handleFileChange={handleFileChange}
        isFacultyModalOpen={isFacultyModalOpen}
        handleCloseFacultyModal={handleCloseFacultyModal}
        handleAddFaculty={handleAddFaculty}
        newFaculty={newFaculty}
        setNewFaculty={setNewFaculty}
        isDeptModalOpen={isDeptModalOpen}
        handleCloseDeptModal={handleCloseDeptModal}
        handleAddDepartment={handleAddDepartment}
        newDept={newDept}
        setNewDept={setNewDept}
      />

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
