export type UserRole = 
  | 'SuperUser' 
  | 'DirectorAdminHR' 
  | 'DirectorStandards' 
  | 'DirectorInspection' 
  | 'DirectorInfrastructure' 
  | 'DirectorResearch'
  | 'Deactivated';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  requiresPasswordChange?: boolean;
}

export interface Institution {
  id: string;
  name: string;
  shortName: string; // e.g., LASU, LASPOTECH
  type: 'Public' | 'Private';
  address?: string;
  website?: string;
  logoUrl?: string;
}

export interface Faculty {
  id: string;
  name: string;
  institutionId: string;
  type: 'faculty' | 'directorate';
}

export interface Department {
  id: string;
  name: string;
  facultyId: string;
  isSTEM: boolean;
  type: 'department' | 'unit';
}

export interface Student {
  id: string;
  lasrraId: string;
  firstName: string;
  otherName?: string;
  lastName: string;
  dob: string;
  mobilePhone?: string;
  email?: string;
  sex: 'Male' | 'Female';
  matricNumber: string;
  institutionId: string;
  campus?: string;
  programmeType: 'Full-time' | 'Part-time' | 'Sandwich';
  facultyId: string;
  departmentId: string;
  admissionYear: string;
  enrollmentStatus: 'Enrolled' | 'Withdrawn' | 'Suspended' | 'Rusticated';
  certificateVerified: boolean;
  picture?: string;
}

export interface Staff {
  id: string;
  lasrraId: string;
  staffId: string;
  title: string;
  surname: string;
  firstName: string;
  otherName?: string;
  gender: 'Male' | 'Female';
  dob: string;
  mobilePhone?: string;
  email?: string;
  institutionId: string;
  facultyId?: string;
  departmentId: string;
  designation: string;
  gradeLevel: string;
  dateOfFirstAppointment: string;
  dateOfConfirmation: string;
  dateOfLastPromotion: string;
  highestQualification: string;
  specialization?: string;
  employmentStatus: 'Active' | 'On Study Leave' | 'On Sabbatical' | 'On Leave of Absence' | 'On Suspension' | 'Appointment Terminated' | 'Dismissed' | 'Retired';
  staffType: 'Academic' | 'Non-Academic';
  picture?: string;
}

export interface Publication {
  id: string;
  staffId: string;
  outputId: string;
  title: string;
  type: 'Journal Article' | 'Monograph' | 'Book/Book Chapter' | 'Conference Paper' | 'Conference Poster' | 'Review Article' | 'Editorial/Commentary' | 'Technical Report';
  year: number;
  abstract: string;
  fundingSource: 'Federal Government' | 'Lagos State Government' | 'TETFund' | 'LASRIC' | 'Self-Sponsored' | 'Other';
}

export interface Facility {
  id: string;
  assetId: string;
  name: string;
  type: 'Lecture Theater' | 'Lecture Hall' | 'Lecture Room' | 'Library' | 'Laboratory' | 'Workshop' | 'Studio';
  description: string;
  institutionId: string;
  campus: string;
  location: string;
  capacity: number;
  dateCompleted: string;
  acquisitionCost: number;
  fundingSource: 'Lagos State Government' | 'TETFund' | 'Special Intervention' | 'Corporate Social Responsibility' | 'Philanthropy' | 'Public-Private Partnership';
  lastMaintenanceDate?: string;
  condition: 'Good' | 'Fair' | 'Poor' | 'Critical';
  isSeed?: boolean;
}

export interface MaintenanceLog {
  id: string;
  facilityId: string;
  facilityName: string;
  maintenanceType: 'Inspection' | 'Routine' | 'Repair/Replacement';
  workPerformed: string;
  completedAt: string;
}

export interface Training {
  id: string;
  trainingId: string;
  staffId: string;
  title: string;
  type: string; // seminar, workshop, short-course etc.
  date: string;
  duration: string;
  location: string;
  isInternational: boolean;
  provider: string;
  fundingSource: 'Federal Government' | 'Lagos State Government' | 'TETFund' | 'LASRIC' | 'Self-Sponsored' | 'Other';
  description?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PURGE';
  collection: string;
  docId: string;
  timestamp: any;
  details?: string;
}
