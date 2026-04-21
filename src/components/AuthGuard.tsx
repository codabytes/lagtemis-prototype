import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AlertCircle, LogIn, Key, Loader2, Mail, Lock, ShieldAlert, LogOut } from 'lucide-react';
import { auth, db, loginWithEmail, logout, changeUserPassword, resetPassword, loginWithGoogle } from '../firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  canManage: (collection: string) => boolean;
  canDelete: (collection: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = (collection: string): boolean => {
    if (!user) return false;
    if (user.role === 'SuperUser') return true;

    switch (user.role) {
      case 'DirectorAdminHR':
        return ['staff', 'publications', 'trainings'].includes(collection);
      case 'DirectorStandards':
        return ['students', 'staff'].includes(collection);
      case 'DirectorInspection':
        return ['institutions', 'faculties', 'departments'].includes(collection);
      case 'DirectorInfrastructure':
        return ['facilities', 'maintenance_logs'].includes(collection);
      default:
        return false;
    }
  };

  const canDelete = (collection: string): boolean => {
    if (!user) return false;
    return user.role === 'SuperUser';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
        } else if (firebaseUser.email === 'olurantidiyan@gmail.com') {
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'SuperUser',
            requiresPasswordChange: false
          };
          await setDoc(userDocRef, { 
            email: newUser.email, 
            role: newUser.role,
            requiresPasswordChange: false 
          });
          setUser(newUser);
        } else {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'Deactivated'
          } as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    try {
      await loginWithEmail(email.trim().toLowerCase(), pass);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid credentials');
      throw err;
    }
  };

  const updateUserPassword = async (newPass: string) => {
    if (!user) return;
    try {
      await changeUserPassword(newPass);
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, { requiresPasswordChange: false });
      setUser(prev => prev ? { ...prev, requiresPasswordChange: false } : null);
    } catch (err: any) {
      console.error('Password update failed:', err);
      setError(err.message || 'Failed to update password');
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      signIn, 
      signOut: signOutUser, 
      updateUserPassword,
      canManage, 
      canDelete 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthGuard: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, loading, error, signIn, updateUserPassword, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      await updateUserPassword(newPassword);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 overflow-hidden relative">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>

        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 z-10 border border-slate-100 flex flex-col items-center transform transition-all duration-500 hover:scale-[1.02]">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-200">
            <LogIn size={32} />
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">TEMIS</h1>
          <p className="text-slate-500 mb-8 font-medium">Lagos State Tertiary Education</p>
          
          {(error || localError) && (
            <div className="w-full mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-left animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-rose-500 shrink-0" size={20} />
              <p className="text-sm text-rose-700 font-semibold">{error || localError}</p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="w-full space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl transition-all duration-200 outline-none text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl transition-all duration-200 outline-none text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all duration-200 shadow-xl shadow-blue-200 flex items-center justify-center gap-2 transform active:scale-[0.98]"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>Sign In</>
              )}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4 w-full">
            <button 
              onClick={() => {
                if (!email) {
                  setLocalError('Please enter your email to reset password.');
                  return;
                }
                resetPassword(email)
                  .then(() => alert('Password reset email sent!'))
                  .catch((err: any) => setLocalError(err.message));
              }}
              className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
            >
              Forgot Password?
            </button>

            <div className="relative w-full flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <span className="relative px-4 bg-white text-[10px] font-bold text-slate-300 uppercase tracking-widest">or</span>
            </div>

            <button
              onClick={async () => {
                try {
                  await loginWithGoogle();
                } catch (err: any) {
                  setLocalError(err.message);
                }
              }}
              className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 border border-slate-200"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'Deactivated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500 rounded-full blur-[150px]"></div>
        </div>

        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 z-10 border border-slate-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-rose-200">
            <ShieldAlert size={32} />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight text-center">Access Restricted</h1>
          <p className="text-slate-500 mb-6 font-medium text-center">
            The TEMIS profile for <strong>{user.email}</strong> is currently deactivated or does not exist.
          </p>
          
          <div className="w-full p-4 bg-slate-50 rounded-2xl mb-8">
            <p className="text-xs text-slate-500 leading-relaxed text-center">
              Your authentication credentials are valid, but you do not have an active system profile. Please contact the <strong>Honourable Commissioner</strong> or a <strong>SuperUser</strong> to reactivate your access.
            </p>
          </div>
          
          <button
            onClick={() => signOut()}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (user.requiresPasswordChange) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500 rounded-full blur-[150px] animate-pulse"></div>
        </div>

        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 z-10 border border-slate-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-200">
            <Key size={32} />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight text-center">Change Password</h1>
          <p className="text-slate-500 mb-8 font-medium text-center">Your account requires a password change upon first login.</p>
          
          {localError && (
            <div className="w-full mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-left">
              <AlertCircle className="text-rose-500 shrink-0" size={20} />
              <p className="text-sm text-rose-700 font-semibold">{localError}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="w-full space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password (min 8 chars)"
                required
                className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl transition-all duration-200 outline-none text-slate-900 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl transition-all duration-200 outline-none text-slate-900 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all duration-200 shadow-xl shadow-orange-100 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={24} /> : 'Update & Continue'}
            </button>
            
            <button
              type="button"
              onClick={signOut}
              className="w-full py-3 text-sm text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Access Restricted</h1>
          <p className="text-slate-600 mb-8 font-medium">Your portfolio does not have permissions to access this specific area.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all duration-200 shadow-xl shadow-slate-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
