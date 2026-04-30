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
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trainings' | 'publications' | 'journey'>('overview');
  const [journey, setJourney] = useState<Student[]>([]);

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
          
          promises.push(dbService.list<Institution>('institutions').then(setInstitutions));
          
          if (profileData.departmentId) {
            promises.push(dbService.get<Department>('departments', profileData.departmentId).then(s => s && setDepartment(s)));
          }
          if (profileData.facultyId) {
            promises.push(dbService.get<Faculty>('faculties', profileData.facultyId).then(s => s && setFaculty(s)));
          }

          if (type === 'staff') {
            promises.push(dbService.list<Training>('trainings', [where('staffId', '==', id), orderBy('date', 'desc')]).then(setTrainings));
            promises.push(dbService.list<Publication>('publications', [where('staffId', '==', id), orderBy('year', 'desc')]).then(setPublications));
          } else if (type === 'student' && profileData.lasrraId) {
            promises.push(dbService.list<Student>('students', [where('lasrraId', '==', profileData.lasrraId)]).then(setJourney));
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
                    <span className="font-medium text-sm">
                      {isStaff ? staff.designation : `Student - ${student.matricNumber}`}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail size={14} className="text-blue-500" />
                      <span className="text-xs font-semibold">{data.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone size={14} className="text-emerald-500" />
                      <span className="text-xs font-semibold">{data.mobilePhone}</span>
                    </div>
                  </div>
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
          {(isStaff || (!isStaff && journey.length > 1)) && (
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
              
              {isStaff && (
                <>
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
                </>
              )}

              {!isStaff && journey.length > 1 && (
                <button 
                  onClick={() => setActiveTab('journey')}
                  className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                    activeTab === 'journey' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Academic Timeline ({journey.length})
                  {activeTab === 'journey' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>}
                </button>
              )}
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
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Campus</p>
                        <p className="text-sm font-semibold">{student.campus || 'Main Campus'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Programme Type</p>
                        <p className="text-sm font-semibold">{student.programmeType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Building size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Faculty</p>
                        <p className="text-sm font-semibold text-slate-700">{faculty?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Building size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                        <p className="text-sm font-semibold text-slate-700">{department?.name || 'N/A'}</p>
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
                      <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                          <GraduationCap size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active Enrollment</p>
                          <p className="text-sm font-black text-blue-900">{institution?.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {isStaff && (
                  <section>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Qualifications</h3>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-900 mb-1">{staff.highestQualification}</p>
                      <p className="text-xs text-slate-500 italic">{staff.specialization}</p>
                    </div>
                  </section>
                )}
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
                        <p className="text-sm font-semibold text-slate-700">{isStaff ? staff.dob : student.dob || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Contact Channels</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group">
                      <Mail size={18} className="text-slate-400 group-hover:text-blue-500" />
                      <span className="text-sm font-medium truncate">{isStaff ? staff.email : student.email}</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group">
                      <Phone size={18} className="text-slate-400 group-hover:text-blue-500" />
                      <span className="text-sm font-medium truncate">{isStaff ? staff.mobilePhone : student.mobilePhone}</span>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          ) : activeTab === 'journey' ? (
            <div className="space-y-6">
              <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <History size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Academic Portfolio</h3>
                    <p className="text-blue-100 text-sm">Chronological record of multiple enrollments for this LASRRA Identity</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {journey
                      .sort((a, b) => new Date(b.admissionYear || 0).getTime() - new Date(a.admissionYear || 0).getTime())
                      .map((record) => (
                        <tr key={record.id} className={`${record.id === id ? 'bg-blue-50/50' : 'hover:bg-slate-50'} transition-colors group`}>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-900 block">
                              {institutions.find(inst => inst.id === record.institutionId)?.name || 'Unknown Institution'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit bg-blue-100 text-blue-700">
                                {record.enrollmentStatus}
                              </span>
                              {record.id === id && (
                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Current View</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {record.id !== id && (
                              <button 
                                onClick={() => navigate(`/students/${record.id}`)}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                              >
                                View Record
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'trainings' ? (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trainings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No training records found</td>
                    </tr>
                  ) : (
                    trainings.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{t.trainingId}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">{t.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium">@{t.location} {t.isInternational && '(International)'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-tighter">{t.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-600 font-bold">{t.date}</span>
                            <span className="text-[10px] text-slate-400">{t.duration}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">{t.provider}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Output ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title & Abstract</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funding Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {publications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No publication records found</td>
                    </tr>
                  ) : (
                    publications.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{p.outputId}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900 mb-1">{p.title}</p>
                          {p.abstract && <p className="text-[10px] text-slate-500 line-clamp-1 italic">{p.abstract}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-tighter">{p.type}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{p.year}</td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">{p.fundingSource}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
