import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthGuard } from './components/AuthGuard';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { StaffManagement } from './components/StaffManagement';
import { ProfileView } from './components/ProfileView';
import { FacilityManagement } from './components/FacilityManagement';
import { FacilityMaintenance } from './components/FacilityMaintenance';
import { FacilityProfile } from './components/FacilityProfile';
import { InstitutionManagement } from './components/InstitutionManagement';
import { ResearchPublications } from './components/ResearchPublications';
import { TrainingManagement } from './components/TrainingManagement';
import { UserManagement } from './components/UserManagement';
import { AnalyticsBI } from './components/AnalyticsBI';
import { SystemSettings } from './components/SystemSettings';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorDetails = null;
      try {
        errorDetails = JSON.parse(this.state.error.message);
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">System Error</h1>
            <p className="text-slate-600 mb-6">An unexpected error occurred. Please try refreshing the page or contact technical support.</p>
            
            {errorDetails && (
              <div className="bg-slate-50 p-4 rounded-xl mb-6 overflow-auto max-h-64">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Error Details</p>
                <pre className="text-[10px] text-slate-600 font-mono">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AuthGuard>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/institutions" element={<InstitutionManagement />} />
                <Route path="/students" element={<StudentManagement />} />
                <Route path="/students/:id" element={<ProfileView type="student" />} />
                <Route path="/personnel/academic" element={<StaffManagement type="Academic" />} />
                <Route path="/personnel/non-academic" element={<StaffManagement type="Non-Academic" />} />
                <Route path="/staff/:id" element={<ProfileView type="staff" />} />
                <Route path="/facilities/management" element={<FacilityManagement />} />
                <Route path="/facilities/maintenance" element={<FacilityMaintenance />} />
                <Route path="/facilities/profile/:id" element={<FacilityProfile />} />
                <Route path="/publications" element={<ResearchPublications />} />
                <Route path="/trainings" element={<TrainingManagement />} />
                <Route path="/analytics" element={<AnalyticsBI />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/settings" element={<SystemSettings />} />
              </Routes>
            </Layout>
          </AuthGuard>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
