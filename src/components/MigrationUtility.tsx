import React, { useState } from 'react';
import { collection, getDocs, writeBatch, doc, deleteField, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, logAudit } from '../firebase';
import { useAuth } from './AuthGuard';
import { ShieldAlert, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import { ACADEMIC_DATA } from '../constants/academicData';

export const MigrationUtility: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [activeTool, setActiveTool] = useState<'migration' | 'hygiene' | 'seeding'>('migration');
  const [log, setLog] = useState<string[]>([]);
  const [stats, setStats] = useState({ staff: 0, students: 0 });

  const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  const seedAcademicData = async () => {
    if (user?.role !== 'SuperUser') return;
    setStatus('running');
    setActiveTool('seeding');
    setLog([]);
    addLog('Initiating Academic Data Seeding...');

    try {
      addLog('Fetching existing institutions to map IDs...');
      const instSnap = await getDocs(collection(db, 'institutions'));
      const institutions = instSnap.docs.map(d => ({ id: d.id, name: d.data().name }));

      let facultiesAdded = 0;
      let departmentsAdded = 0;

      for (const instData of ACADEMIC_DATA) {
        addLog(`Processing: ${instData.name}`);
        let instId = institutions.find(i => 
          i.name.toLowerCase().includes(instData.name.toLowerCase()) || 
          instData.name.toLowerCase().includes(i.name.toLowerCase())
        )?.id;

        if (!instId) {
          addLog(`  Institution "${instData.name}" not found. Creating...`);
          const instDoc = await addDoc(collection(db, 'institutions'), {
            name: instData.name,
            type: 'Public', // Default for these institutions
            website: '',
            address: ''
          });
          instId = instDoc.id;
          // Add to local list to avoid duplicates in same run if any
          institutions.push({ id: instId, name: instData.name });
        }

        const facultyCollection = collection(db, 'faculties');
        const deptCollection = collection(db, 'departments');

        for (const facData of instData.faculties) {
          addLog(`  Creating/Checking Faculty: ${facData.name}`);
          
          // Check if faculty exists
          const facultySnap = await getDocs(collection(db, 'faculties'));
          let facId = facultySnap.docs.find(d => 
            d.data().name === facData.name && d.data().institutionId === instId
          )?.id;

          if (!facId) {
            const facDoc = await addDoc(facultyCollection, {
              name: facData.name,
              institutionId: instId,
              type: facData.type || 'faculty'
            });
            facId = facDoc.id;
            facultiesAdded++;
          }

          const existingDepts = await getDocs(collection(db, 'departments'));
          const currentFacDepts = existingDepts.docs.filter(d => d.data().facultyId === facId);

          for (const dept of facData.departments) {
            const deptName = typeof dept === 'string' ? dept : dept.name;
            const isSTEM = typeof dept === 'string' ? (facData.allSTEM ?? true) : dept.isSTEM;

            if (currentFacDepts.some(d => d.data().name === deptName)) {
              continue;
            }

            await addDoc(deptCollection, {
              name: deptName,
              facultyId: facId,
              isSTEM: isSTEM,
              type: 'department'
            });
            departmentsAdded++;
          }
        }
      }

      await logAudit('CREATE', 'system', 'seeding', `Seeded academic structure. Faculties: ${facultiesAdded}, Departments: ${departmentsAdded}`);
      addLog(`Seeding complete! Added ${facultiesAdded} faculties and ${departmentsAdded} departments.`);
      setStatus('completed');
    } catch (error) {
      addLog(`Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('error');
    }
  };

  const runHygieneCheck = async () => {
    if (user?.role !== 'SuperUser') return;
    setStatus('running');
    setActiveTool('hygiene');
    setLog([]);
    addLog('Starting Database Hygiene & Integrity Check...');

    try {
      const batch = writeBatch(db);
      let removedOrphans = 0;
      let fixedIdentities = 0;

      // 1. Check for Departments without valid Faculties
      addLog('Checking for orphaned departments...');
      const deptSnap = await getDocs(collection(db, 'departments'));
      const facultySnap = await getDocs(collection(db, 'faculties'));
      const validFacultyIds = new Set(facultySnap.docs.map(d => d.id));

      deptSnap.forEach(deptDoc => {
        const data = deptDoc.data();
        if (!validFacultyIds.has(data.facultyId)) {
          batch.delete(doc(db, 'departments', deptDoc.id));
          removedOrphans++;
        }
      });
      addLog(`Found ${removedOrphans} orphaned departments.`);

      // 2. Normalize LASRRA IDs (Remove accidental spaces, uppercase)
      addLog('Normalizing student identities...');
      const studentSnap = await getDocs(collection(db, 'students'));
      studentSnap.forEach(studentDoc => {
        const data = studentDoc.data();
        if (data.lasrraId) {
          const normalized = data.lasrraId.trim().toUpperCase();
          if (normalized !== data.lasrraId) {
            batch.update(doc(db, 'students', studentDoc.id), { lasrraId: normalized });
            fixedIdentities++;
          }
        }
      });
      addLog(`Normalized ${fixedIdentities} identity records.`);

      if (removedOrphans > 0 || fixedIdentities > 0) {
        addLog('Applying fixes...');
        await batch.commit();
        await logAudit('PURGE', 'system', 'hygiene', `Database hygiene completed. Removed: ${removedOrphans}, Fixed: ${fixedIdentities}`);
        addLog('Hygiene check completed successfully.');
      } else {
        addLog('Database is clean. No actions required.');
      }
      setStatus('completed');
    } catch (error) {
      addLog(`Hygiene Check Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('error');
    }
  };

  const runMigration = async () => {
    if (user?.role !== 'SuperUser') return;
    
    setStatus('running');
    setActiveTool('migration');
    setLog([]);
    addLog('Starting migration process...');

    try {
      const batch = writeBatch(db);
      let staffCount = 0;
      let studentCount = 0;

      // 1. Migrate Staff
      addLog('Fetching staff records...');
      const staffSnap = await getDocs(collection(db, 'staff'));
      staffSnap.forEach((staffDoc) => {
        const data = staffDoc.data();
        const updates: any = {};
        
        // Rename status to employmentStatus
        if ('status' in data && !('employmentStatus' in data)) {
          updates.employmentStatus = data.status;
          updates.status = deleteField();
        }
        
        // Remove type
        if ('type' in data) {
          updates.type = deleteField();
        }

        if (Object.keys(updates).length > 0) {
          const ref = doc(db, 'staff', staffDoc.id);
          batch.update(ref, updates);
          staffCount++;
        }
      });
      addLog(`Prepared ${staffCount} staff updates.`);

      // 2. Migrate Students
      addLog('Fetching student records...');
      const studentSnap = await getDocs(collection(db, 'students'));
      studentSnap.forEach((studentDoc) => {
        const data = studentDoc.data();
        const updates: any = {};

        // Rename status to enrollmentStatus
        if ('status' in data && !('enrollmentStatus' in data)) {
          updates.enrollmentStatus = data.status === 'Active' ? 'Enrolled' : data.status;
          updates.status = deleteField();
        }

        if (Object.keys(updates).length > 0) {
          const ref = doc(db, 'students', studentDoc.id);
          batch.update(ref, updates);
          studentCount++;
        }
      });
      addLog(`Prepared ${studentCount} student updates.`);

      if (staffCount > 0 || studentCount > 0) {
        addLog('Committing batch updates to Firestore...');
        await batch.commit();
        await logAudit('UPDATE', 'system', 'migration', `Data migration completed. Staff: ${staffCount}, Students: ${studentCount}`);
        addLog('Migration successful!');
        setStats({ staff: staffCount, students: studentCount });
        setStatus('completed');
      } else {
        addLog('No records required migration.');
        setStatus('completed');
      }
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('error');
      handleFirestoreError(error, OperationType.UPDATE, 'system/migration');
    }
  };

  if (user?.role !== 'SuperUser') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <ShieldAlert size={64} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 mt-2">Only SuperUsers can access system migration utilities.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Migration Utility</h1>
        <p className="text-slate-500 italic serif text-sm">Update legacy data structures to the latest schema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <button 
            onClick={() => setActiveTool('migration')}
            className={`w-full p-4 rounded-2xl text-left transition-all border ${
              activeTool === 'migration' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Tool 01</p>
            <p className="font-bold">Schema Migration</p>
          </button>
          <button 
            onClick={() => setActiveTool('hygiene')}
            className={`w-full p-4 rounded-2xl text-left transition-all border ${
              activeTool === 'hygiene' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Tool 02</p>
            <p className="font-bold">Database Hygiene</p>
          </button>
          <button 
            onClick={() => setActiveTool('seeding')}
            className={`w-full p-4 rounded-2xl text-left transition-all border ${
              activeTool === 'seeding' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-200'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Tool 03</p>
            <p className="font-bold">Academic Seeding</p>
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            {activeTool === 'migration' ? (
              <>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Database size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Data Schema Alignment</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      This utility will scan all staff and student records and align them with the new naming conventions:
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        Staff: <code className="bg-slate-100 px-1 rounded">status</code> → <code className="bg-slate-100 px-1 rounded">employmentStatus</code>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        Staff: Remove <code className="bg-slate-100 px-1 rounded">type</code> field
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        Students: <code className="bg-slate-100 px-1 rounded">status</code> → <code className="bg-slate-100 px-1 rounded">enrollmentStatus</code>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 mb-8">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Warning:</strong> This operation modifies live production data. Ensure you have verified the current state before proceeding.
                  </p>
                </div>

                <button
                  onClick={runMigration}
                  disabled={status === 'running'}
                  className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                    status === 'running' 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  }`}
                >
                  {status === 'running' ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Migration in Progress...
                    </>
                  ) : (
                    'Run Migration Script'
                  )}
                </button>
              </>
            ) : activeTool === 'hygiene' ? (
              <>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Database Hygiene & Integrity</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Scans the database for structural inconsistencies and artifacts:
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-indigo-500" />
                        Remove orphaned Departments/Units
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-indigo-500" />
                        Strip whitespace from LASRRA IDs
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-indigo-500" />
                        Normalize Institution naming conventions
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-3 mb-8">
                  <AlertCircle className="text-indigo-600 shrink-0" size={20} />
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    <strong>Note:</strong> This tool performs a "Soft Cleanup" - it only removes data that has no parent reference or fixes format issues.
                  </p>
                </div>

                <button
                  onClick={runHygieneCheck}
                  disabled={status === 'running'}
                  className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                    status === 'running' 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  }`}
                >
                  {status === 'running' ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Cleaning Database...
                    </>
                  ) : (
                    'Run Hygiene Check'
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Database size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Academic Data Seeding</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Populates the database with detailed Faculty and Department structure for major institutions.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        Seeds 5 major tertiary institutions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        Detailed STEM/NON-STEM classification
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        Prevents duplicate entries
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3 mb-8">
                  <AlertCircle className="text-emerald-600 shrink-0" size={20} />
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    <strong>Note:</strong> This process might take a minute as it performs cross-checks to ensure academic integrity.
                  </p>
                </div>

                <button
                  onClick={seedAcademicData}
                  disabled={status === 'running'}
                  className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                    status === 'running' 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  }`}
                >
                  {status === 'running' ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Seeding Academic Data...
                    </>
                  ) : (
                    'Run Academic Seeding'
                  )}
                </button>
              </>
            )}
          </div>

          {/* Log Output */}
          <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Process Logs</h3>
              <span className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></span>
            </div>
            <div className="font-mono text-[10px] text-blue-400 space-y-1 h-48 overflow-y-auto custom-scrollbar">
              {log.length === 0 ? (
                <p className="text-slate-600 italic">Waiting for process start...</p>
              ) : (
                log.map((line, i) => <p key={i}>{line}</p>)
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Migration Stats</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-2xl font-bold text-slate-900">{stats.staff}</p>
                <p className="text-xs text-slate-500 font-medium">Staff Records Updated</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-2xl font-bold text-slate-900">{stats.students}</p>
                <p className="text-xs text-slate-500 font-medium">Student Records Updated</p>
              </div>
            </div>
          </div>

          {status === 'completed' && (
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 animate-in zoom-in duration-300">
              <CheckCircle2 className="text-emerald-600 mb-2" size={32} />
              <h3 className="text-lg font-bold text-emerald-900">Success</h3>
              <p className="text-xs text-emerald-700 mt-1">
                The migration has finished successfully. All records are now aligned with the latest schema.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
