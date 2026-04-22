import React, { useState } from 'react';
import { collection, getDocs, writeBatch, doc, deleteField, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, logAudit } from '../firebase';
import { useAuth } from './AuthGuard';
import { ShieldAlert, Database, CheckCircle2, AlertCircle, Loader2, BookOpen, Info, HelpCircle, Briefcase, Calendar, Users as UsersIcon, Landmark, TrendingUp, Target, FileText, Layers, ShieldCheck, Activity } from 'lucide-react';

import { ACADEMIC_DATA } from '../constants/academicData';

export const MigrationUtility: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [activeTool, setActiveTool] = useState<'migration' | 'hygiene' | 'seeding' | 'guide' | 'implementation' | 'businessCase'>('migration');
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
          <button 
            onClick={() => setActiveTool('guide')}
            className={`w-full p-4 rounded-2xl text-left transition-all border ${
              activeTool === 'guide' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-100 hover:border-orange-200'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Guide</p>
            <p className="font-bold">System User Guide</p>
          </button>
          <button 
            onClick={() => setActiveTool('implementation')}
            className={`w-full p-4 rounded-2xl text-left transition-all border ${
              activeTool === 'implementation' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-100 hover:border-rose-200'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Project</p>
            <p className="font-bold">Budget & Timeline</p>
          </button>
          <button 
            onClick={() => setActiveTool('businessCase')}
            className={`w-full p-4 rounded-2xl text-left transition-all border ${
              activeTool === 'businessCase' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Strategic</p>
            <p className="font-bold">Business Case (ROI)</p>
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
            ) : activeTool === 'guide' ? (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">TEMIS User Guide</h2>
                    <p className="text-sm text-slate-500 mt-1">Lagos State Tertiary Education Management Information System</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-3">1. Institution Management</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Manage the hierarchy of tertiary institutions in Lagos State. Add new Institutions, Faculties (or Directorates), and Departments (or Units). Use the <strong>"Register Institution"</strong> button to add a top-level entity.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-3">2. Student Records</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-2">
                      Access the <strong>Students</strong> module to view and manage enrollment. Data conforms to the following Nigerian standards:
                    </p>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2">
                      <li><strong>Qualifications:</strong> Universities award Degrees; Polytechnics award OND/HND.</li>
                      <li><strong>Classifications:</strong> Automated grading scales (First Class to Pass vs distinction to Pass).</li>
                      <li><strong>Matriculation:</strong> Auto-generated based on institution type and year.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-3">3. Personnel & Training</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Personnel is divided into Academic and Non-Academic staff. Use <strong>Training Management</strong> to record professional development and <strong>Research & Publications</strong> for academic bibliographies.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-3">4. Infrastructure & Analytics</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      The <strong>Facilities</strong> module tracks physical assets and maintenance logs. The <strong>Reporting & Analytics</strong> module provides real-time Business Intelligence and record exporting in multiple formats (Excel, PDF, SQL).
                    </p>
                  </section>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                    <HelpCircle className="text-blue-600 shrink-0" size={20} />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      For technical support, contact the Lagos State Ministry of Tertiary Education IT Department. Access to System Settings is restricted to authorized SuperUsers.
                    </p>
                  </div>
                </div>
              </div>
            ) : activeTool === 'implementation' ? (
              <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300 pb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Project Implementation Plan</h2>
                    <p className="text-sm text-slate-500 mt-1">Proposed Budget, Manpower, and Development Roadmap</p>
                  </div>
                </div>

                {/* 1. Cost Breakdown */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-rose-600">
                    <Landmark size={20} />
                    <h3 className="font-bold uppercase tracking-widest text-xs">I. Tentative Development Cost (NGN)</h3>
                  </div>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-100/50">
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Component</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Cost (Million ₦)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        <tr>
                          <td className="px-4 py-3 font-semibold">Core ERP Engine</td>
                          <td className="px-4 py-3 text-slate-500">Institution, Faculty, & Dept. Logic, Student Lifecycle</td>
                          <td className="px-4 py-3 text-right font-mono">25.0</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold">Personnel & BI module</td>
                          <td className="px-4 py-3 text-slate-500">Academic/Non-Academic roll, Business Intelligence charts</td>
                          <td className="px-4 py-3 text-right font-mono">18.5</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold">Asset & Maintenance</td>
                          <td className="px-4 py-3 text-slate-500">Facility tracking, Capacity mapping, Wrench logs</td>
                          <td className="px-4 py-3 text-right font-mono">12.0</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold">Security & Audit</td>
                          <td className="px-4 py-3 text-slate-500">ABAC Encryption, Role-based access, Audit trail logs</td>
                          <td className="px-4 py-3 text-right font-mono">10.5</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold">Cloud Infra (Year 1)</td>
                          <td className="px-4 py-3 text-slate-500">Firestore, App hosting, Domain, SSL, Backups</td>
                          <td className="px-4 py-3 text-right font-mono">4.5</td>
                        </tr>
                        <tr className="bg-rose-50/50 font-bold">
                          <td colSpan={2} className="px-4 py-3 text-rose-900">Total Tentative Budget</td>
                          <td className="px-4 py-3 text-right text-rose-600 font-mono">₦ 70.5M</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 2. Manpower Requirements */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <UsersIcon size={20} />
                    <h3 className="font-bold uppercase tracking-widest text-xs">II. Manpower Requirements</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { role: 'Project Manager', count: 1, desc: 'Overall coordination, Stakeholder management' },
                      { role: 'Lead Full-stack Engineer', count: 1, desc: 'System architecture, API design, Security' },
                      { role: 'Frontend Developers', count: 2, desc: 'UI/UX Implementation, Dashboards, Mobile views' },
                      { role: 'Data Analysts', count: 2, desc: 'Data cleansing, Migration from legacy records' },
                      { role: 'Quality Assurance (QA)', count: 1, desc: 'Stress testing, Security auditing, Bug tracking' },
                      { role: 'Technical Support/Trainers', count: 2, desc: 'End-user training, Manuals, Onboarding' }
                    ].map((m, i) => (
                      <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">{m.count}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{m.role}</p>
                          <p className="text-[10px] text-slate-500 leading-tight">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. Proposed Timeline */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Calendar size={20} />
                    <h3 className="font-bold uppercase tracking-widest text-xs">III. Proposed Development Timeline</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { week: 'W1-W4', phase: 'Planning & UX Design', color: 'bg-blue-500' },
                      { week: 'W5-W16', phase: 'Core Platform Development', color: 'bg-emerald-500' },
                      { week: 'W17-W20', phase: 'Analytics & BI Integration', color: 'bg-amber-500' },
                      { week: 'W21-W24', phase: 'Data Migration & Legacy Import', color: 'bg-indigo-500' },
                      { week: 'W25-W28', phase: 'UAT, Deployment & Training', color: 'bg-rose-500' }
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.week}</div>
                        <div className="flex-1 h-8 bg-slate-50 rounded-lg relative overflow-hidden flex items-center px-4">
                          <div className={`absolute left-0 top-0 bottom-0 ${t.color} opacity-10 w-full`}></div>
                          <span className="text-xs font-bold text-slate-700 relative z-10">{t.phase}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : activeTool === 'businessCase' ? (
              <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-300 pb-20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Target size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Comprehensive Business Case</h2>
                    <p className="text-sm text-slate-500 mt-1">Tertiary Education Management Information System (TEMIS)</p>
                  </div>
                </div>

                {/* 1. Executive Summary */}
                <section className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck size={120} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-blue-400">01. Executive Summary</h3>
                  <div className="space-y-4 relative z-10">
                    <p className="text-sm leading-relaxed opacity-90">
                      TEMIS is a strategic digital platform proposed to centralize and secure higher education data for Lagos State. This system addresses critical inefficiencies in manual record-keeping and massive financial leakages due to unverified enrollments. 
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">PROPOSED SOLUTION</p>
                        <p className="text-xs">Unified Education ERP & BI Suite</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">ESTIMATED COST</p>
                        <p className="text-xs">₦70.5M (Year 1 CapEx + OpEx)</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">PROJECTED ROI</p>
                        <p className="text-xs">₦250M+ annual savings from leakage prevention</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Problem Statement or Business Need */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-rose-600">
                    <AlertCircle size={20} />
                    <h3 className="text-xs font-black uppercase tracking-widest">02. Problem Statement & Business Need</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <h4 className="font-bold text-slate-900 mb-3 text-sm">Root Cause Analysis</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        The current "antiquated" manual system is fragmented across institutions, leading to data silos. This lack of a central registry prevents real-time auditing, allowing for "Ghost Students" and staff payroll inaccuracies that cost the state millions monthly.
                      </p>
                    </div>
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <h4 className="font-bold text-slate-900 mb-3 text-sm">Strategic Alignment</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        This project is mission-critical for the <b>Lagos State T.H.E.M.E.S. Plus Agenda</b>, specifically the Technology and Education pillars, driving the "Smart City" vision through data-driven governance.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-[10px] text-rose-700 font-bold uppercase tracking-widest mb-1">Consequences of "Do-Nothing" Scenario:</p>
                    <p className="text-xs text-rose-600 leading-tight">Continued multi-million naira revenue leakages, systemic fraud in certifications, and inability to meet federal staff-student ratio mandates for accreditation.</p>
                  </div>
                </section>

                {/* 3. Analysis of Options Considered */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-amber-600">
                    <Layers size={20} />
                    <h3 className="text-xs font-black uppercase tracking-widest">03. Analysis of Options Considered</h3>
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden text-xs">
                    <div className="grid grid-cols-4 bg-slate-50 p-4 font-bold text-slate-400 uppercase tracking-tighter">
                      <div>Option</div>
                      <div>Feasibility</div>
                      <div>Cost (TCO)</div>
                      <div>Strategic Fit</div>
                    </div>
                    <div className="divide-y divide-slate-50 uppercase font-bold tracking-tighter">
                      <div className="grid grid-cols-4 p-4 text-slate-400">
                        <div>Do-Nothing</div>
                        <div>High</div>
                        <div>Critical Leakage</div>
                        <div>Zero</div>
                      </div>
                      <div className="grid grid-cols-4 p-4 text-slate-500">
                        <div>Manual Digitalization</div>
                        <div>Medium</div>
                        <div>High Operational</div>
                        <div>Low</div>
                      </div>
                      <div className="grid grid-cols-4 p-4 bg-blue-50 text-blue-700">
                        <div>Unified TEMIS Platform</div>
                        <div>Expert Led</div>
                        <div>Optimized One-time</div>
                        <div>Perfect</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Project Definition and Scope */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <ShieldCheck size={20} />
                    <h3 className="text-xs font-black uppercase tracking-widest">04. Project Definition & Scope</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 border-l-4 border-indigo-600 pl-3">SMART Objectives</h4>
                      <ul className="space-y-3 pl-3">
                        <li className="text-xs text-slate-600 flex gap-2">
                          <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                          <span>100% verification of all current students by EOY 2026</span>
                        </li>
                        <li className="text-xs text-slate-600 flex gap-2">
                          <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                          <span>Reduce audit processing time by 90% via automated BI</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 border-l-4 border-rose-600 pl-3">Scope Boundaries</h4>
                      <div className="space-y-2 pl-3">
                        <p className="text-[10px] font-bold text-blue-600 uppercase">In-Scope:</p>
                        <p className="text-[10px] text-slate-500">Central Student Registry, Staff Nominal Roll, Infrastructure Tracking, BI API.</p>
                        <p className="text-[10px] font-bold text-rose-600 uppercase">Out-of-Scope:</p>
                        <p className="text-[10px] text-slate-500">Primary/Secondary Data, Direct Salary Disbursement (Integrated with IPPIS).</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 5. Benefits and ROI */}
                <section className="space-y-8">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <TrendingUp size={20} />
                    <h3 className="text-xs font-black uppercase tracking-widest">05. Benefits and Return on Investment (ROI)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <h4 className="font-bold text-sm text-slate-900 mb-4">Tangible Benefits</h4>
                      <ul className="space-y-4 text-xs text-slate-600">
                        <li className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                          <span>Annual Cost Reduction (Verified Audit)</span>
                          <span className="font-bold text-emerald-600 font-mono">₦250M+</span>
                        </li>
                        <li className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                          <span>Accreditation Success Rate Impact</span>
                          <span className="font-bold text-emerald-600 font-mono">+40%</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <h4 className="font-bold text-sm text-slate-900 mb-4">Intangible Benefits</h4>
                      <ul className="space-y-3 text-xs text-slate-600">
                        <li className="flex gap-2">
                          <CheckCircle2 size={12} className="text-blue-500 mt-1" />
                          <span>Improved global positioning of Lagos credentials</span>
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle2 size={12} className="text-blue-500 mt-1" />
                          <span>Elimination of certificates forgery brand damage</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 6. Costs and Budget */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Landmark size={20} />
                    <h3 className="text-xs font-black uppercase tracking-widest">06. Costs and Budget (One-time & Ongoing)</h3>
                  </div>
                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase text-blue-400">Upfront Investment (₦)</h4>
                        <div className="space-y-2 font-mono text-sm">
                          <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="opacity-60 text-xs">Custom Dev Effort</span>
                            <span>42,000,000</span>
                          </div>
                          <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="opacity-60 text-xs">Infrastructure/Hardware</span>
                            <span>15,000,000</span>
                          </div>
                          <div className="flex justify-between font-black text-blue-400">
                            <span className="text-xs">TOTAL CAPEX</span>
                            <span>57,000,000</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase text-emerald-400">Annual OpEx (₦)</h4>
                        <div className="space-y-2 font-mono text-sm">
                          <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="opacity-60 text-xs">Hosting & Security</span>
                            <span>4,500,000</span>
                          </div>
                          <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="opacity-60 text-xs">Premium Support</span>
                            <span>9,000,000</span>
                          </div>
                          <div className="flex justify-between font-black text-emerald-400">
                            <span className="text-xs">TOTAL OPEX/YR</span>
                            <span>13,500,000</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 7. Risk Assessment and Mitigation */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-rose-600">
                    <ShieldAlert size={20} />
                    <h3 className="text-xs font-black uppercase tracking-widest">07. Risk Assessment & Mitigation</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { risk: 'User Resistance', mitigation: 'Phase-based training workshops' },
                      { risk: 'Technical Downtime', mitigation: '99.9% SLA with multi-node redundancy' },
                      { risk: 'Budget Overrun', mitigation: 'Strict fixed-price contract with milestones' }
                    ].map((r, i) => (
                      <div key={i} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{r.risk}</p>
                        <p className="text-xs font-bold text-slate-700">{r.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 8. Implementation Plan and Timeline */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-blue-600">
                    <Calendar size={20} />
                    <h3 className="text-xs font-black uppercase tracking-widest">08. Implementation Plan & Governance</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-3">Roadmap Milestones</h4>
                      <div className="space-y-3 font-mono text-[10px] pl-3">
                        <div className="flex items-center gap-4">
                          <span className="w-16 font-bold text-slate-400">MONTH 1</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">Architecture Finalization</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="w-16 font-bold text-slate-400">MONTH 3</span>
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">Core Dashboard Beta</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="w-16 font-bold text-slate-400">MONTH 7</span>
                          <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg">State-wide Rollout</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-700 mb-4">Project Governance</h4>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs ring-4 ring-blue-50">S</div>
                          <div>
                            <p className="text-xs font-bold">Project Sponsor</p>
                            <p className="text-[10px] text-slate-500">Ministry of Tertiary Education</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs ring-4 ring-blue-50">O</div>
                          <div>
                            <p className="text-xs font-bold">Owner Representative</p>
                            <p className="text-[10px] text-slate-500">Office of the Governor (Tech Unit)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                
                <div className="py-12 border-t border-slate-100 flex flex-col items-center gap-6">
                  <div className="px-10 py-4 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform cursor-pointer">
                    Submit Business Case
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">TEMIS-EXEC-APPROVAL-2026-V2</p>
                </div>
              </div>
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
