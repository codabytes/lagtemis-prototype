import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { where, orderBy } from 'firebase/firestore';
import { dbService } from '../services/db';
import { Staff, Student, Institution, Department, Faculty, Training, Publication } from '../types';
import { 
  User, 
  GraduationCap, 
  Building2, 
  MapPin, 
  Calendar, 
  Award, 
  Briefcase, 
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  FileText,
  BookOpen,
  History,
  Clock,
  Building,
  Globe,
  DollarSign
} from 'lucide-react';

interface ProfileViewProps {
  type: 'staff' | 'student';
}

export const ProfileView: React.FC<ProfileViewProps> = ({ type }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Staff | Student | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trainings' | 'publications'>('overview');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const collectionName = type === 'staff' ? 'staff' : 'students';
        const profileData = await dbService.get<any>(collectionName, id);
        
        if (profileData) {
          setData(profileData);

          // Fetch related data
          const promises: Promise<any>[] = [];
          
          if (profileData.institutionId) {
            promises.push(dbService.get<Institution>('institutions', profileData.institutionId).then(s => s && setInstitution(s)));
          }
          if (profileData.departmentId) {
            promises.push(dbService.get<Department>('departments', profileData.departmentId).then(s => s && setDepartment(s)));
          }
          if (profileData.facultyId) {
            promises.push(dbService.get<Faculty>('faculties', profileData.facultyId).then(s => s && setFaculty(s)));
          }

          if (type === 'staff') {
            promises.push(dbService.list<Training>('trainings', [where('staffId', '==', id), orderBy('date', 'desc')]).then(setTrainings));
            promises.push(dbService.list<Publication>('publications', [where('staffId', '==', id), orderBy('year', 'desc')]).then(setPublications));
          }

          await Promise.all(promises);
        }
        setLoading(false);
      } catch (error) {
        // Error handled by dbService
      }
    };

    fetchProfile();
  }, [id, type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-slate-500 mt-2">The requested {type} record could not be found.</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isStaff = type === 'staff';
  const staff = data as Staff;
  const student = data as Student;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-semibold"
        >
          <ArrowLeft size={20} />
          Back to List
        </button>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-semibold">
            <FileText size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end gap-6 -mt-12 mb-8">
            <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-xl">
              {data.picture ? (
                <img 
                  src={data.picture} 
                  alt="Profile" 
                  className="w-full h-full rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-4xl font-bold text-blue-600">
                  {isStaff ? staff.firstName[0] + staff.surname[0] : student.firstName[0] + student.lastName[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {isStaff 
                      ? `${staff.surname.toUpperCase()}, ${staff.firstName} ${staff.otherName || ''}`
                      : `${student.lastName.toUpperCase()}, ${student.firstName} ${student.otherName || ''}`
                    }
                  </h1>
                  <p className="text-slate-500 flex items-center gap-2 mt-1">
                    {isStaff ? <Briefcase size={16} /> : <GraduationCap size={16} />}
                    <span className="font-medium">
                      {isStaff ? staff.designation : `Student - ${student.matricNumber}`}
                    </span>
                  </p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                  (isStaff ? staff.employmentStatus : student.enrollmentStatus) === 'Active' || (isStaff ? staff.employmentStatus : student.enrollmentStatus) === 'Enrolled'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                  {isStaff ? staff.employmentStatus : student.enrollmentStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          {isStaff && (
            <div className="flex items-center gap-8 border-b border-slate-100 mb-8">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Overview
                {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('trainings')}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'trainings' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Trainings ({trainings.length})
                {activeTab === 'trainings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('publications')}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'publications' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Publications ({publications.length})
                {activeTab === 'publications' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>}
              </button>
            </div>
          )}

          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Official Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">LASRRA ID</p>
                        <p className="text-sm font-semibold">{isStaff ? staff.lasrraId : student.lasrraId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{isStaff ? 'Staff ID' : 'Matric Number'}</p>
                        <p className="text-sm font-semibold">{isStaff ? staff.staffId : student.matricNumber}</p>
                      </div>
                    </div>
                    {!isStaff && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          {student.certificateVerified ? <ShieldCheck className="text-emerald-500" size={18} /> : <ShieldAlert className="text-amber-500" size={18} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Verification</p>
                          <p className={`text-sm font-semibold ${student.certificateVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {student.certificateVerified ? 'Verified' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Academic Placement</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Institution</p>
                        <p className="text-sm font-semibold">{institution?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Faculty/Directorate & Dept/Unit</p>
                        <p className="text-sm font-semibold">{faculty?.name} / {department?.name}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Middle Column: Career/Education */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    {isStaff ? 'Career Milestones' : 'Enrollment Timeline'}
                  </h3>
                  <div className="space-y-4">
                    {isStaff ? (
                      <>
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">1st Appointment</p>
                            <p className="text-sm font-semibold">{staff.dateOfFirstAppointment}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <Award size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Last Promotion</p>
                            <p className="text-sm font-semibold">{staff.dateOfLastPromotion}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Admission Year</p>
                            <p className="text-sm font-semibold">{student.admissionYear}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <Award size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Graduation Year</p>
                            <p className="text-sm font-semibold">{student.graduationYear || 'In Progress'}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Qualifications</h3>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm font-bold text-slate-900 mb-1">{isStaff ? staff.highestQualification : 'Undergraduate Degree'}</p>
                    <p className="text-xs text-slate-500 italic">{isStaff ? staff.specialization : 'Full-time Program'}</p>
                  </div>
                </section>
              </div>

              {/* Right Column: Personal & Contact */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Gender</p>
                        <p className="text-sm font-semibold text-slate-700">{isStaff ? staff.gender : student.sex}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</p>
                        <p className="text-sm font-semibold text-slate-700">{isStaff ? staff.dob : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Contact Channels</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group">
                      <Mail size={18} className="text-slate-400 group-hover:text-blue-500" />
                      <span className="text-sm font-medium">Send Email</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group">
                      <Phone size={18} className="text-slate-400 group-hover:text-blue-500" />
                      <span className="text-sm font-medium">Call Mobile</span>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          ) : activeTab === 'trainings' ? (
            <div className="space-y-4">
              {trainings.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <History size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 italic">No training records found for this staff member.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trainings.map(t => (
                    <div key={t.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.trainingId}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">{t.title}</h4>
                      <p className="text-xs font-bold text-blue-600 mb-3 uppercase tracking-wider">{t.type}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Calendar size={12} />
                          <span>{t.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Clock size={12} />
                          <span>{t.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <MapPin size={12} />
                          <span>{t.location} {t.isInternational && <span className="ml-1 text-[8px] bg-purple-50 text-purple-600 px-1 rounded uppercase font-bold">Intl</span>}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Building size={12} />
                          <span>{t.provider}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {publications.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 italic">No research or publication records found for this staff member.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publications.map(p => (
                    <div key={p.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                          {p.type}
                        </span>
                        <span className="text-xs text-slate-400 font-mono font-bold">{p.outputId}</span>
                        <span className="text-xs text-slate-400 font-mono">{p.year}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-2">{p.title}</h4>
                      <div className="flex items-center gap-4 text-slate-500 text-xs mb-3">
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} />
                          <span>{p.fundingSource}</span>
                        </div>
                      </div>
                      {p.abstract && (
                        <p className="text-sm text-slate-500 italic line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {p.abstract}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
