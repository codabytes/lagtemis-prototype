import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AlertCircle } from 'lucide-react';
import { auth, db, loginWithGoogle, logout } from '../firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
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
        return ['students', 'staff'].includes(collection); // Staff for certificate verification
      case 'DirectorInspection':
        return ['institutions', 'faculties', 'departments'].includes(collection);
      case 'DirectorInfrastructure':
        return ['facilities', 'maintenance_logs'].includes(collection);
      case 'DirectorResearch':
        return false; // Oversight only
      default:
        return false;
    }
  };

  const canDelete = (collection: string): boolean => {
    if (!user) return false;
    if (user.role === 'SuperUser') return true;
    // Directors cannot delete as per requirements
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null);
      if (firebaseUser) {
        // Check if user exists in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
          // Only auto-create for the initial admin
          if (firebaseUser.email === 'olurantidiyan@gmail.com') {
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'SuperUser',
            };
            await setDoc(userDocRef, { email: newUser.email, role: newUser.role });
            setUser(newUser);
          } else {
            // User not pre-registered
            setUser(null);
            setError('Your account is not registered in the system. Please contact the system administrator.');
            await signOutUser(); // Force sign out if not authorized
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
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
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut: signOutUser, canManage, canDelete }}>
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
  const { user, loading, error, signIn } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">TEMIS</h1>
          <p className="text-slate-600 mb-8 italic serif">Tertiary Education Management Information System</p>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-left">
              <AlertCircle className="text-rose-500 shrink-0" size={20} />
              <p className="text-sm text-rose-700 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <p className="text-slate-500 mb-8">Please sign in with your Lagos State government account to access the system.</p>
          <button
            onClick={signIn}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-8">You do not have the required permissions to view this module. Please contact the system administrator.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
