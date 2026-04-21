import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Key,
  RefreshCw
} from 'lucide-react';
import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { initializeApp, deleteApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { db, handleFirestoreError, OperationType, logAudit, auth as mainAuth, resetPassword } from '../firebase';
import { User, UserRole } from '../types';
import { useAuth } from './AuthGuard';
import { ConfirmDialog } from './ConfirmDialog';

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SuperUser: 'Honourable Commissioner / Permanent Secretary - Full System Oversight',
  DirectorAdminHR: 'Director, Administration and Human Resources - Personnel & Allied Matters',
  DirectorStandards: 'Director, Standards and Accreditation - Certificate Verifications',
  DirectorInspection: 'Director, Inspection and Monitoring - Public/Private Institution Monitoring',
  DirectorInfrastructure: 'Director, Infrastructural, Planning and Development - Facilities & Planning',
  DirectorResearch: 'Director, Research - Data Analysis, Reporting, and Quality Control',
  Deactivated: 'Inactive Account - No System Access'
};

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newUser, setNewUser] = useState<{ email: string; role: UserRole; password: string }>({
    email: '',
    role: 'DirectorResearch',
    password: ''
  });

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersList);
      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'SuperUser') return;
    if (newUser.password.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }

    setIsCreating(true);
    let secondaryApp;
    try {
      // Check if user already exists in Firestore
      const existingUser = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
      if (existingUser) {
        alert('A user with this email already exists.');
        setIsCreating(false);
        return;
      }

      // 1. Create the Auth account using a secondary app instance to avoid signing out the SuperUser
      secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      const normalizedEmail = newUser.email.trim().toLowerCase();
      const authResult = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, newUser.password);
      const uid = authResult.user.uid;

      // 2. Create the Firestore record
      const userData = {
        email: normalizedEmail,
        role: newUser.role,
        requiresPasswordChange: true
      };
      
      await setDoc(doc(db, 'users', uid), userData);
      await logAudit('CREATE', 'users', uid, `Added user ${newUser.email} with role ${newUser.role}`);
      
      setUsers([...users, { id: uid, ...userData }]);
      setIsModalOpen(false);
      setNewUser({ email: '', role: 'DirectorResearch', password: '' });
      
      // 3. Cleanup secondary app
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      
      alert('User created successfully. They will be forced to change their password on first login.');
    } catch (error: any) {
      console.error('User creation failed:', error);
      alert(error.message || 'Failed to create user.');
      if (secondaryApp) await deleteApp(secondaryApp);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (currentUser?.role !== 'SuperUser') return;
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      await logAudit('UPDATE', 'users', userId, `Updated user role to ${newRole}`);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleDeleteUser = (userId: string, email: string) => {
    if (currentUser?.role !== 'SuperUser') return;
    if (email === currentUser.email) {
      alert('You cannot delete your own account.');
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to remove access for ${email}? Note: This only deletes their profile record, not their Auth credentials.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', userId));
          await logAudit('DELETE', 'users', userId, `Deleted user profile ${email}`);
          setUsers(users.filter(u => u.id !== userId));
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'users');
        }
      }
    });
  };

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email);
      alert(`Password reset email has been sent to ${email}`);
    } catch (error: any) {
      alert(error.message || 'Failed to send reset email');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== 'SuperUser') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <XCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500">Only SuperUsers can manage system accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">User Account Management</h1>
          <p className="text-slate-500 italic serif text-sm">Centrally managing state-wide administrative access</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-xl shadow-blue-200 transform active:scale-95"
        >
          <UserPlus size={20} />
          Create System Account
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identified User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No users found matching your search</td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-700 block">{u.email}</span>
                        <span className="text-[10px] text-slate-400 font-mono leading-none">{u.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                      disabled={u.email === currentUser.email}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 transition-all"
                    >
                      {Object.keys(ROLE_DESCRIPTIONS).filter(r => r !== 'Deactivated').map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {u.requiresPasswordChange ? (
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100 uppercase">
                          <Lock size={12} /> Pending Setup
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold border border-green-100 uppercase">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResetPassword(u.email)}
                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Send Reset Email"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        disabled={u.email === currentUser.email}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-0"
                        title="Revoke Access"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Assign privileges to a new system administrator</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-3 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-2xl transition-all"
              >
                <XCircle size={28} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Official Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      required
                      type="email"
                      placeholder="name@domain.gov.ng"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 rounded-2xl outline-none transition-all text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Portfolio</label>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <select
                        required
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 rounded-2xl outline-none transition-all appearance-none text-slate-900 font-semibold"
                      >
                        {Object.keys(ROLE_DESCRIPTIONS).filter(r => r !== 'Deactivated').map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Default Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 rounded-2xl outline-none transition-all text-slate-900 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-blue-50 rounded-[24px] border border-blue-100 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                    <Key size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-blue-900 font-bold leading-relaxed">Mandatory Setup Phase</p>
                    <p className="text-[11px] text-blue-700/80 leading-relaxed mt-0.5">
                      This user will be forced to change this default password immediately upon their first sign-in attempt for security compliance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4 bg-white">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 text-slate-500 font-bold hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center gap-3 transform active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Finalize Account
                    </>
                  )}
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
