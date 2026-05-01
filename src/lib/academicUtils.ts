import { Student, Department } from '../types';

/**
 * Academic Utilities
 * 
 * Logic for institutional calculations, specifically STEM ratios 
 * mandated by the Lagos State Government.
 */

/**
 * Calculates the percentage of students enrolled in STEM departments.
 * 
 * @param students - Array of all students or a subset (e.g. for specify institution)
 * @param departments - Master list of departments to check isSTEM flag
 * @returns Number (0-100) representing the STEM percentage
 */
export const calculateStemRatio = (students: Student[], departments: Department[]) => {
  const enrolledStudents = students.filter(s => 
    s.enrollmentStatus?.toLowerCase() === 'enrolled'
  );

  if (enrolledStudents.length === 0) return 0;

  const stemStudents = enrolledStudents.filter(s => {
    // Robust ID handling (handles paths or raw IDs)
    const deptId = s.departmentId?.includes('/') 
      ? s.departmentId.split('/').pop() 
      : s.departmentId;
      
    const dept = departments.find(d => d.id === deptId);
    return dept?.isSTEM === true;
  });

  return Math.round((stemStudents.length / enrolledStudents.length) * 100);
};

/**
 * Gets detailed STEM vs Non-STEM ratio data
 */
export const getStemRatioData = (students: Student[], departments: Department[]) => {
  const enrolledStudents = students.filter(s => 
    s.enrollmentStatus?.toLowerCase() === 'enrolled'
  );

  if (enrolledStudents.length === 0) {
    return { stem: 0, nonStem: 0, total: 0, percentage: 0, ratioString: '0:0' };
  }

  const stemStudents = enrolledStudents.filter(s => {
    const deptId = s.departmentId?.includes('/') 
      ? s.departmentId.split('/').pop() 
      : s.departmentId;
    const dept = departments.find(d => d.id === deptId);
    return dept?.isSTEM === true;
  });

  const stemCount = stemStudents.length;
  const totalCount = enrolledStudents.length;
  const nonStemCount = totalCount - stemCount;
  
  // Calculate relative portions out of 100 for the ratio string if we want e.g. 60:40
  const stemPct = Math.round((stemCount / totalCount) * 100);
  const nonStemPct = 100 - stemPct;

  return {
    stem: stemCount,
    nonStem: nonStemCount,
    total: totalCount,
    percentage: stemPct,
    ratioString: `${stemPct}:${nonStemPct}`
  };
};

/**
 * Calculates STEM ratio for a specific institution.
 * 
 * @param instId - The unique ID of the institution
 * @param students - Global student list
 * @param departments - Global department list
 */
export const getInstitutionStemRatio = (instId: string, students: Student[], departments: Department[]) => {
  const instStudents = students.filter(s => s.institutionId === instId);
  return calculateStemRatio(instStudents, departments);
};
