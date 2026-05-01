import React from 'react';
import { XCircle, Image as ImageIcon, Plus } from 'lucide-react';
import { Institution, Faculty, Department } from '../../types';

interface InstitutionModalsProps {
  isModalOpen: boolean;
  editingInst: Institution | null;
  handleCloseInstModal: () => void;
  handleAddInstitution: (e: React.FormEvent) => void;
  newInst: Partial<Institution>;
  setNewInst: (inst: Partial<Institution>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  isFacultyModalOpen: boolean;
  editingFaculty: Faculty | null;
  handleCloseFacultyModal: () => void;
  handleAddFaculty: (e: React.FormEvent) => void;
  newFaculty: Partial<Faculty>;
  setNewFaculty: (faculty: Partial<Faculty>) => void;
  
  isDeptModalOpen: boolean;
  editingDept: Department | null;
  handleCloseDeptModal: () => void;
  handleAddDepartment: (e: React.FormEvent) => void;
  newDept: Partial<Department>;
  setNewDept: (dept: Partial<Department>) => void;
}

export const InstitutionModals: React.FC<InstitutionModalsProps> = ({
  isModalOpen, editingInst, handleCloseInstModal, handleAddInstitution, newInst, setNewInst, handleFileChange,
  isFacultyModalOpen, editingFaculty, handleCloseFacultyModal, handleAddFaculty, newFaculty, setNewFaculty,
  isDeptModalOpen, editingDept, handleCloseDeptModal, handleAddDepartment, newDept, setNewDept
}) => {
  return (
    <>
      {/* Institution Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingInst ? 'Update Institution' : 'Register Institution'}</h2>
              <button onClick={handleCloseInstModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddInstitution} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institution Logo</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                      {newInst.logoUrl ? (
                        <img src={newInst.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon className="text-slate-300" size={24} />
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Plus size={20} />
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">Click the box to upload institution logo (PNG, JPG)</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institution Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Full Institution Name"
                      value={newInst.name}
                      onChange={(e) => setNewInst({ ...newInst, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Short Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. LASU"
                      value={newInst.shortName}
                      onChange={(e) => setNewInst({ ...newInst, shortName: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institution Type</label>
                    <select
                      required
                      value={newInst.type}
                      onChange={(e) => setNewInst({ ...newInst, type: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm font-semibold"
                    >
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institution Category</label>
                    <select
                      required
                      value={newInst.category}
                      onChange={(e) => setNewInst({ ...newInst, category: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm font-semibold"
                    >
                      <option value="University">University</option>
                      <option value="Polytechnic/Monotechnic">Polytechnic/Monotechnic</option>
                      <option value="College of Education">College of Education</option>
                      <option value="Vocational School">Vocational School</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Website</label>
                  <input
                    type="url"
                    value={newInst.website}
                    onChange={(e) => setNewInst({ ...newInst, website: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseInstModal}
                  className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  {editingInst ? 'Update' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Modal */}
      {isFacultyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingFaculty ? 'Update Faculty/Directorate' : 'Add Faculty/Directorate'}</h2>
              <button onClick={handleCloseFacultyModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddFaculty} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faculty/Directorate Name</label>
                  <input
                    required
                    type="text"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isFaculty"
                    checked={newFaculty.type === 'faculty'}
                    onChange={(e) => setNewFaculty({ ...newFaculty, type: e.target.checked ? 'faculty' : 'directorate' })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isFaculty" className="text-sm font-semibold text-slate-700">Is Faculty?</label>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseFacultyModal}
                  className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  {editingFaculty ? 'Update' : 'Add Faculty/Directorate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingDept ? 'Update Department/Unit' : 'Add Department/Unit'}</h2>
              <button onClick={handleCloseDeptModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddDepartment} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department/Unit Name</label>
                  <input
                    required
                    type="text"
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isDepartment"
                    checked={newDept.type === 'department'}
                    onChange={(e) => {
                      const isDept = e.target.checked;
                      setNewDept({ 
                        ...newDept, 
                        type: isDept ? 'department' : 'unit',
                        isSTEM: isDept ? newDept.isSTEM : false 
                      });
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isDepartment" className="text-sm font-semibold text-slate-700">Is Department?</label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isSTEM"
                    disabled={newDept.type !== 'department'}
                    checked={newDept.isSTEM}
                    onChange={(e) => setNewDept({ ...newDept, isSTEM: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <label htmlFor="isSTEM" className={`text-sm font-semibold ${newDept.type !== 'department' ? 'text-slate-400' : 'text-slate-700'}`}>STEM Program</label>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseDeptModal}
                  className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  {editingDept ? 'Update' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
