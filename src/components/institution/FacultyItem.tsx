import React from 'react';
import { Building, Layers, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Institution, Faculty, Department } from '../../types';

import { useAuth } from '../AuthGuard';

interface FacultyItemProps {
  faculty: Faculty;
  inst: Institution;
  expandedFaculty: string | null;
  setExpandedFaculty: (id: string | null) => void;
  user: any;
  departments: Department[];
  handleDeleteAllFacultyDepartments: (e: React.MouseEvent, id: string, name: string) => void;
  handleDeleteFaculty: (e: React.MouseEvent, id: string, name: string) => void;
  setSelectedFacultyId: (id: string | null) => void;
  setIsDeptModalOpen: (open: boolean) => void;
  handleDeleteDepartment: (e: React.MouseEvent, id: string, name: string) => void;
}

export const FacultyItem: React.FC<FacultyItemProps> = ({ 
  faculty, inst, expandedFaculty, setExpandedFaculty, user, departments, 
  handleDeleteAllFacultyDepartments, handleDeleteFaculty, setSelectedFacultyId, 
  setIsDeptModalOpen, handleDeleteDepartment 
}) => {
  const { canManage, canDelete } = useAuth();
  const facultyDepts = departments.filter(d => d.facultyId === faculty.id);
  
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <div 
        className="p-4 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setExpandedFaculty(expandedFaculty === faculty.id ? null : faculty.id);
        }}
      >
        <div className="flex items-center gap-3">
          {inst.logoUrl ? (
            <img src={inst.logoUrl} alt="Logo" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
          ) : (
            <Building size={18} className="text-slate-400" />
          )}
          <span className="text-sm font-bold text-slate-700">{faculty.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {canDelete('faculties') && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => handleDeleteAllFacultyDepartments(e, faculty.id, faculty.name)}
                className="p-1 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                title="Delete all departments/units in this faculty/directorate"
              >
                <Layers size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteFaculty(e, faculty.id, faculty.name)}
                className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="Delete Faculty/Directorate"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
          {expandedFaculty === faculty.id ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </div>
      </div>

      {expandedFaculty === faculty.id && (
        <div className="p-4 bg-white space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departments/Units</h5>
            {canManage('departments') && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFacultyId(faculty.id);
                  setIsDeptModalOpen(true);
                }}
                className="text-blue-600 font-bold text-[10px] hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Add Dept/Unit
              </button>
            )}
          </div>

          <div className="space-y-4">
            {facultyDepts.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No departments/units defined</p>
            ) : (
              <>
                {/* Departments Group */}
                {facultyDepts.filter(d => d.type === 'department' || !d.type).length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">Departments</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {facultyDepts.filter(d => d.type === 'department' || !d.type).map(dept => (
                        <div key={dept.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2">
                            <Layers size={14} className="text-slate-400" />
                            <span className="text-sm font-semibold text-slate-600">{dept.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {dept.isSTEM && (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded uppercase tracking-wider">
                                STEM
                              </span>
                            )}
                            {canDelete('departments') && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteDepartment(e, dept.id, dept.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Delete Department"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Units Group */}
                {facultyDepts.filter(d => d.type === 'unit').length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">Units</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {facultyDepts.filter(d => d.type === 'unit').map(dept => (
                        <div key={dept.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2">
                            <Layers size={14} className="text-slate-400" />
                            <span className="text-sm font-semibold text-slate-600">{dept.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {canDelete('departments') && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteDepartment(e, dept.id, dept.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Delete Unit"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
