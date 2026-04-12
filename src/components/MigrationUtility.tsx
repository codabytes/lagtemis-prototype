import React, { useState } from 'react';
import { collection, getDocs, writeBatch, doc, deleteField } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, logAudit } from '../firebase';
import { useAuth } from './AuthGuard';
import { ShieldAlert, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const MigrationUtility: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [stats, setStats] = useState({ staff: 0, students: 0 });

  const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  const runMigration = async () => {
    if (user?.role !== 'SuperUser') return;
    
    setStatus('running');
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
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
                <strong>Warning:</strong> This operation modifies live production data. Ensure you have verified the current state before proceeding. The process is logged for auditing.
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
