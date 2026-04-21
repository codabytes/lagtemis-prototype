import { Student, Department } from '../types';

export const calculateStemRatio = (students: Student[], departments: Department[]) => {
  const enrolledStudents = students.filter(s => 
    s.enrollmentStatus?.toLowerCase() === 'enrolled'
  );

  if (enrolledStudents.length === 0) return 0;

  const stemStudents = enrolledStudents.filter(s => {
    // Some students might have full path, some might have just ID
    const deptId = s.departmentId?.includes('/') 
      ? s.departmentId.split('/').pop() 
      : s.departmentId;
      
    const dept = departments.find(d => d.id === deptId);
    return dept?.isSTEM === true;
  });

  return Math.round((stemStudents.length / enrolledStudents.length) * 100);
};

export const getInstitutionStemRatio = (instId: string, students: Student[], departments: Department[]) => {
  const instStudents = students.filter(s => s.institutionId === instId);
  return calculateStemRatio(instStudents, departments);
};
