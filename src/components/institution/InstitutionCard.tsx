import React from 'react';
import { School, Edit2, Trash2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Institution, Faculty, Department } from '../../types';
import { FacultyItem } from './FacultyItem';

import { useAuth } from '../AuthGuard';

interface InstitutionCardProps {
  inst: Institution;
  expandedInst: string | null;
  setExpandedInst: (id: string | null) => void;
  user: any;
  faculties: Faculty[];
  departments: Department[];
  expandedFaculty: string | null;
  setExpandedFaculty: (id: string | null) => void;
  handleEditInstitution: (e: React.MouseEvent, inst: Institution) => void;
  handleDeleteInstitution: (e: React.MouseEvent, id: string, name: string) => void;
  handleDeleteAllFacultyDepartments: (e: React.MouseEvent, id: string, name: string) => void;
  handleDeleteFaculty: (e: React.MouseEvent, id: string, name: string) => void;
  handleDeleteDepartment: (e: React.MouseEvent, id: string, name: string) => void;
  setSelectedInstId: (id: string | null) => void;
  setIsFacultyModalOpen: (open: boolean) => void;
  setSelectedFacultyId: (id: string | null) => void;
  setIsDeptModalOpen: (open: boolean) => void;
}

export const InstitutionCard: React.FC<InstitutionCardProps> = ({
  inst, expandedInst, setExpandedInst, user, faculties, departments,
  expandedFaculty, setExpandedFaculty, handleEditInstitution, handleDeleteInstitution,
  handleDeleteAllFacultyDepartments, handleDeleteFaculty, handleDeleteDepartment,
  setSelectedInstId, setIsFacultyModalOpen, setSelectedFacultyId, setIsDeptModalOpen
}) => {
  const { canManage, canDelete } = useAuth();
  const instFaculties = faculties.filter(f => f.institutionId === inst.id);
  const facultyIds = instFaculties.map(f => f.id);
  const instDepts = departments.filter(d => facultyIds.includes(d.facultyId));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div 
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpandedInst(expandedInst === inst.id ? null : inst.id)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center overflow-hidden">
            {inst.logoUrl ? (
              <img src={inst.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <School size={24} />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{inst.name}</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">
                  {inst.type}
                </span>
                <p className="text-xs text-slate-400">{inst.website || 'No website'}</p>
              </div>
              <div className="flex items-center gap-2 h-4 border-l border-slate-200 pl-3">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{instFaculties.length} Faculties</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{instDepts.length} Departments</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canManage('institutions') && (
            <button
              type="button"
              onClick={(e) => handleEditInstitution(e, inst)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title="Edit Institution"
            >
              <Edit2 size={20} />
            </button>
          )}
          {canDelete('institutions') && (
            <button
              type="button"
              onClick={(e) => handleDeleteInstitution(e, inst.id, inst.name)}
              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Delete Institution"
            >
              <Trash2 size={20} />
            </button>
          )}
          {expandedInst === inst.id ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
        </div>
      </div>

      {expandedInst === inst.id && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-50 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faculties/Directorates</h4>
            {canManage('faculties') && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInstId(inst.id);
                  setIsFacultyModalOpen(true);
                }}
                className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Faculty/Directorate
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {instFaculties.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-2">No faculties/directorates defined</p>
            ) : (
              <>
                {/* Faculties Group */}
                {instFaculties.filter(f => f.type === 'faculty' || !f.type).length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Faculties</h5>
                    {instFaculties.filter(f => f.type === 'faculty' || !f.type).map(faculty => (
                      <FacultyItem 
                        key={faculty.id} 
                        faculty={faculty} 
                        inst={inst}
                        expandedFaculty={expandedFaculty}
                        setExpandedFaculty={setExpandedFaculty}
                        user={user}
                        departments={departments}
                        handleDeleteAllFacultyDepartments={handleDeleteAllFacultyDepartments}
                        handleDeleteFaculty={handleDeleteFaculty}
                        setSelectedFacultyId={setSelectedFacultyId}
                        setIsDeptModalOpen={setIsDeptModalOpen}
                        handleDeleteDepartment={handleDeleteDepartment}
                      />
                    ))}
                  </div>
                )}

                {/* Directorates Group */}
                {instFaculties.filter(f => f.type === 'directorate').length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Directorates</h5>
                    {instFaculties.filter(f => f.type === 'directorate').map(faculty => (
                      <FacultyItem 
                        key={faculty.id} 
                        faculty={faculty} 
                        inst={inst}
                        expandedFaculty={expandedFaculty}
                        setExpandedFaculty={setExpandedFaculty}
                        user={user}
                        departments={departments}
                        handleDeleteAllFacultyDepartments={handleDeleteAllFacultyDepartments}
                        handleDeleteFaculty={handleDeleteFaculty}
                        setSelectedFacultyId={setSelectedFacultyId}
                        setIsDeptModalOpen={setIsDeptModalOpen}
                        handleDeleteDepartment={handleDeleteDepartment}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
