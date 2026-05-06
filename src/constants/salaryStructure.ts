export interface DesignationInfo {
  designation: string;
  gradeLevel: string;
  cadre?: string;
  category: 'Academic' | 'Non-Academic';
}

export const SALARY_STRUCTURE: DesignationInfo[] = [
  // Academic Staff Salary Structure (Universities - CONUASS)
  { designation: 'Graduate Assistant', gradeLevel: 'CONUASS 1', category: 'Academic', cadre: 'CONUASS' },
  { designation: 'Assistant Lecturer', gradeLevel: 'CONUASS 2', category: 'Academic', cadre: 'CONUASS' },
  { designation: 'Lecturer II', gradeLevel: 'CONUASS 3', category: 'Academic', cadre: 'CONUASS' },
  { designation: 'Lecturer I', gradeLevel: 'CONUASS 4', category: 'Academic', cadre: 'CONUASS' },
  { designation: 'Senior Lecturer', gradeLevel: 'CONUASS 5', category: 'Academic', cadre: 'CONUASS' },
  { designation: 'Reader (Assoc. Prof)', gradeLevel: 'CONUASS 6', category: 'Academic', cadre: 'CONUASS' },
  { designation: 'Professor', gradeLevel: 'CONUASS 7', category: 'Academic', cadre: 'CONUASS' },

  // Academic Staff Salary Structure (Polytechnics/COE - CONPCASS)
  { designation: 'Assistant Lecturer/Instructor', gradeLevel: 'CONPCASS 1', category: 'Academic', cadre: 'CONPCASS' },
  { designation: 'Lecturer III', gradeLevel: 'CONPCASS 2', category: 'Academic', cadre: 'CONPCASS' },
  { designation: 'Lecturer II', gradeLevel: 'CONPCASS 3', category: 'Academic', cadre: 'CONPCASS' },
  { designation: 'Lecturer I', gradeLevel: 'CONPCASS 4', category: 'Academic', cadre: 'CONPCASS' },
  { designation: 'Senior Lecturer/Principal Instructor', gradeLevel: 'CONPCASS 5', category: 'Academic', cadre: 'CONPCASS' },
  { designation: 'Principal Lecturer', gradeLevel: 'CONPCASS 6', category: 'Academic', cadre: 'CONPCASS' },
  { designation: 'Chief Lecturer', gradeLevel: 'CONPCASS 7', category: 'Academic', cadre: 'CONPCASS' },

  // Professional Librarian Cadre
  { designation: 'Assistant Librarian', gradeLevel: 'CONUASS 01', category: 'Academic', cadre: 'Librarian' },
  { designation: 'Librarian II', gradeLevel: 'CONUASS 02', category: 'Academic', cadre: 'Librarian' },
  { designation: 'Librarian I', gradeLevel: 'CONUASS 03', category: 'Academic', cadre: 'Librarian' },
  { designation: 'Senior Librarian', gradeLevel: 'CONUASS 04', category: 'Academic', cadre: 'Librarian' },
  { designation: 'Principal Librarian', gradeLevel: 'CONUASS 05', category: 'Academic', cadre: 'Librarian' },
  { designation: 'Deputy Univ. Librarian', gradeLevel: 'CONUASS 06', category: 'Academic', cadre: 'Librarian' },
  { designation: 'University Librarian', gradeLevel: 'CONUASS 07', category: 'Academic', cadre: 'Librarian' },

  // Administrative Officer Cadre
  { designation: 'Administrative Assistant', gradeLevel: 'CONTISS 07', category: 'Non-Academic', cadre: 'Administrative' },
  { designation: 'Administrative Officer', gradeLevel: 'CONTISS 08', category: 'Non-Academic', cadre: 'Administrative' },
  { designation: 'Assistant Registrar', gradeLevel: 'CONTISS 09', category: 'Non-Academic', cadre: 'Administrative' },
  { designation: 'Senior Assistant Registrar II', gradeLevel: 'CONTISS 10', category: 'Non-Academic', cadre: 'Administrative' },
  { designation: 'Senior Assistant Registrar I', gradeLevel: 'CONTISS 12', category: 'Non-Academic', cadre: 'Administrative' },
  { designation: 'Principal Assistant Registrar', gradeLevel: 'CONTISS 13', category: 'Non-Academic', cadre: 'Administrative' },
  { designation: 'Deputy Registrar', gradeLevel: 'CONTISS 14', category: 'Non-Academic', cadre: 'Administrative' },
  { designation: 'Senior Deputy Registrar', gradeLevel: 'CONTISS 15', category: 'Non-Academic', cadre: 'Administrative' },
  { designation: 'Registrar', gradeLevel: 'CONTISS 15 Consolidated', category: 'Non-Academic', cadre: 'Administrative' },

  // Executive Officer (Admin) Cadre
  { designation: 'Assistant Executive Officer (Admin)', gradeLevel: 'CONTISS 06', category: 'Non-Academic', cadre: 'Executive Admin' },
  { designation: 'Executive Officer (Admin)', gradeLevel: 'CONTISS 07', category: 'Non-Academic', cadre: 'Executive Admin' },
  { designation: 'Higher Executive Officer (Admin)', gradeLevel: 'CONTISS 08', category: 'Non-Academic', cadre: 'Executive Admin' },
  { designation: 'Senior Executive Officer (Admin)', gradeLevel: 'CONTISS 09', category: 'Non-Academic', cadre: 'Executive Admin' },
  { designation: 'Principal Executive Officer II (Admin)', gradeLevel: 'CONTISS 11', category: 'Non-Academic', cadre: 'Executive Admin' },
  { designation: 'Principal Executive Officer I (Admin)', gradeLevel: 'CONTISS 12', category: 'Non-Academic', cadre: 'Executive Admin' },
  { designation: 'Asst. Chief Executive Officer (Admin)', gradeLevel: 'CONTISS 13', category: 'Non-Academic', cadre: 'Executive Admin' },
  { designation: 'Chief Executive Officer (Admin)', gradeLevel: 'CONTISS 14', category: 'Non-Academic', cadre: 'Executive Admin' },

  // Professional Accountant Cadre
  { designation: 'Accountant II', gradeLevel: 'CONTISS 07', category: 'Non-Academic', cadre: 'Accountant' },
  { designation: 'Accountant I', gradeLevel: 'CONTISS 08', category: 'Non-Academic', cadre: 'Accountant' },
  { designation: 'Senior Accountant', gradeLevel: 'CONTISS 09', category: 'Non-Academic', cadre: 'Accountant' },
  { designation: 'Principal Accountant', gradeLevel: 'CONTISS 10', category: 'Non-Academic', cadre: 'Accountant' },
  { designation: 'Assistant Chief Accountant', gradeLevel: 'CONTISS 12', category: 'Non-Academic', cadre: 'Accountant' },
  { designation: 'Chief Accountant', gradeLevel: 'CONTISS 13', category: 'Non-Academic', cadre: 'Accountant' },
  { designation: 'Deputy Bursar', gradeLevel: 'CONTISS 14', category: 'Non-Academic', cadre: 'Accountant' },
  { designation: 'Senior Deputy Bursar', gradeLevel: 'CONTISS 15', category: 'Non-Academic', cadre: 'Accountant' },
  { designation: 'Bursar', gradeLevel: 'CONTISS 15 Consolidated', category: 'Non-Academic', cadre: 'Accountant' },

  // Executive Officer (Accounts) Cadre
  { designation: 'Assistant Executive Officer (Accounts)', gradeLevel: 'CONTISS 06', category: 'Non-Academic', cadre: 'Executive Accounts' },
  { designation: 'Executive Officer (Accounts)', gradeLevel: 'CONTISS 07', category: 'Non-Academic', cadre: 'Executive Accounts' },
  { designation: 'Higher Executive Officer (Accounts)', gradeLevel: 'CONTISS 08', category: 'Non-Academic', cadre: 'Executive Accounts' },
  { designation: 'Senior Executive Officer (Accounts)', gradeLevel: 'CONTISS 09', category: 'Non-Academic', cadre: 'Executive Accounts' },
  { designation: 'Principal Executive Officer II (Accounts)', gradeLevel: 'CONTISS 11', category: 'Non-Academic', cadre: 'Executive Accounts' },
  { designation: 'Principal Executive Officer I (Accounts)', gradeLevel: 'CONTISS 12', category: 'Non-Academic', cadre: 'Executive Accounts' },
  { designation: 'Asst. Chief Executive Officer (Accounts)', gradeLevel: 'CONTISS 13', category: 'Non-Academic', cadre: 'Executive Accounts' },
  { designation: 'Chief Executive Officer (Accounts)', gradeLevel: 'CONTISS 14', category: 'Non-Academic', cadre: 'Executive Accounts' },

  // Professional Engineer Cadre
  { designation: 'Engineer II', gradeLevel: 'CONTISS 07', category: 'Non-Academic', cadre: 'Engineer' },
  { designation: 'Engineer I', gradeLevel: 'CONTISS 08', category: 'Non-Academic', cadre: 'Engineer' },
  { designation: 'Senior Engineer', gradeLevel: 'CONTISS 09', category: 'Non-Academic', cadre: 'Engineer' },
  { designation: 'Principal Engineer II', gradeLevel: 'CONTISS 10', category: 'Non-Academic', cadre: 'Engineer' },
  { designation: 'Principal Engineer I', gradeLevel: 'CONTISS 12', category: 'Non-Academic', cadre: 'Engineer' },
  { designation: 'Chief Engineer', gradeLevel: 'CONTISS 13', category: 'Non-Academic', cadre: 'Engineer' },
  { designation: 'Deputy Director (Works)', gradeLevel: 'CONTISS 14', category: 'Non-Academic', cadre: 'Engineer' },
  { designation: 'Director of Works', gradeLevel: 'CONTISS 15', category: 'Non-Academic', cadre: 'Engineer' },

  // Technologist Cadre
  { designation: 'Technologist II', gradeLevel: 'CONTISS 07', category: 'Non-Academic', cadre: 'Technologist' },
  { designation: 'Technologist I', gradeLevel: 'CONTISS 08', category: 'Non-Academic', cadre: 'Technologist' },
  { designation: 'Senior Technologist', gradeLevel: 'CONTISS 09', category: 'Non-Academic', cadre: 'Technologist' },
  { designation: 'Principal Technologist', gradeLevel: 'CONTISS 10', category: 'Non-Academic', cadre: 'Technologist' },
  { designation: 'Asst. Chief Technologist', gradeLevel: 'CONTISS 12', category: 'Non-Academic', cadre: 'Technologist' },
  { designation: 'Chief Technologist', gradeLevel: 'CONTISS 13', category: 'Non-Academic', cadre: 'Technologist' },

  // Professional IT Cadre
  { designation: 'System Analyst II / Programmer II', gradeLevel: 'CONTISS 07', category: 'Non-Academic', cadre: 'IT' },
  { designation: 'System Analyst I / Programmer I', gradeLevel: 'CONTISS 08', category: 'Non-Academic', cadre: 'IT' },
  { designation: 'Senior System Analyst', gradeLevel: 'CONTISS 09', category: 'Non-Academic', cadre: 'IT' },
  { designation: 'Principal System Analyst', gradeLevel: 'CONTISS 10', category: 'Non-Academic', cadre: 'IT' },
  { designation: 'Assistant Chief Analyst', gradeLevel: 'CONTISS 12', category: 'Non-Academic', cadre: 'IT' },
  { designation: 'Chief System Analyst', gradeLevel: 'CONTISS 13', category: 'Non-Academic', cadre: 'IT' },
  { designation: 'Deputy Director (ICT)', gradeLevel: 'CONTISS 14', category: 'Non-Academic', cadre: 'IT' },
  { designation: 'Director of ICT', gradeLevel: 'CONTISS 15', category: 'Non-Academic', cadre: 'IT' },

  // Technical/Executive IT Cadre
  { designation: 'System Operator / Asst. Lab. Tech', gradeLevel: 'CONTISS 06', category: 'Non-Academic', cadre: 'Technical IT' },
  { designation: 'Higher System Operator', gradeLevel: 'CONTISS 07', category: 'Non-Academic', cadre: 'Technical IT' },
  { designation: 'Senior System Operator', gradeLevel: 'CONTISS 08', category: 'Non-Academic', cadre: 'Technical IT' },
  { designation: 'Principal System Operator II', gradeLevel: 'CONTISS 09', category: 'Non-Academic', cadre: 'Technical IT' },
  { designation: 'Principal System Operator I', gradeLevel: 'CONTISS 11', category: 'Non-Academic', cadre: 'Technical IT' },
  { designation: 'Assistant Chief System Operator', gradeLevel: 'CONTISS 12', category: 'Non-Academic', cadre: 'Technical IT' },
  { designation: 'Chief System Operator', gradeLevel: 'CONTISS 13', category: 'Non-Academic', cadre: 'Technical IT' },

  // Library Officer Cadre
  { designation: 'Library Officer', gradeLevel: 'CONTISS 07', category: 'Non-Academic', cadre: 'Library' },
  { designation: 'Higher Library Officer', gradeLevel: 'CONTISS 08', category: 'Non-Academic', cadre: 'Library' },
  { designation: 'Senior Library Officer', gradeLevel: 'CONTISS 09', category: 'Non-Academic', cadre: 'Library' },
  { designation: 'Principal Library Officer', gradeLevel: 'CONTISS 10', category: 'Non-Academic', cadre: 'Library' },
  { designation: 'Asst. Chief Library Officer', gradeLevel: 'CONTISS 12', category: 'Non-Academic', cadre: 'Library' },
  { designation: 'Chief Library Officer', gradeLevel: 'CONTISS 13', category: 'Non-Academic', cadre: 'Library' },

  // Medical & Dental Officer Cadre
  { designation: 'Medical/Dental Officer II', gradeLevel: 'CONMESS 1', category: 'Non-Academic', cadre: 'Medical' },
  { designation: 'Medical/Dental Officer I', gradeLevel: 'CONMESS 2', category: 'Non-Academic', cadre: 'Medical' },
  { designation: 'Senior Medical Officer II', gradeLevel: 'CONMESS 3', category: 'Non-Academic', cadre: 'Medical' },
  { designation: 'Senior Medical Officer I', gradeLevel: 'CONMESS 4', category: 'Non-Academic', cadre: 'Medical' },
  { designation: 'Principal Medical Officer II', gradeLevel: 'CONMESS 5', category: 'Non-Academic', cadre: 'Medical' },
  { designation: 'Chief Medical Officer', gradeLevel: 'CONMESS 6', category: 'Non-Academic', cadre: 'Medical' },
  { designation: 'Consultant', gradeLevel: 'CONMESS 7', category: 'Non-Academic', cadre: 'Medical' },

  // Nursing Officer Cadre
  { designation: 'Nursing Officer II', gradeLevel: 'CONHESS 8', category: 'Non-Academic', cadre: 'Nursing' },
  { designation: 'Nursing Officer I', gradeLevel: 'CONHESS 9', category: 'Non-Academic', cadre: 'Nursing' },
  { designation: 'Senior Nursing Officer', gradeLevel: 'CONHESS 10', category: 'Non-Academic', cadre: 'Nursing' },
  { designation: 'Principal Nursing Officer', gradeLevel: 'CONHESS 12', category: 'Non-Academic', cadre: 'Nursing' },
  { designation: 'Assistant Chief Nursing Officer', gradeLevel: 'CONHESS 13', category: 'Non-Academic', cadre: 'Nursing' },
  { designation: 'Chief Nursing Officer', gradeLevel: 'CONHESS 14', category: 'Non-Academic', cadre: 'Nursing' },
  { designation: 'Assistant Director (Nursing)', gradeLevel: 'CONHESS 15', category: 'Non-Academic', cadre: 'Nursing' },
  { designation: 'Deputy Director (Nursing)', gradeLevel: 'CONHESS 16', category: 'Non-Academic', cadre: 'Nursing' },
  { designation: 'Director of Nursing Services', gradeLevel: 'CONHESS 17', category: 'Non-Academic', cadre: 'Nursing' },

  // Staff Nurse/Midwife Cadre
  { designation: 'Staff Nurse / Midwife', gradeLevel: 'CONHESS 7', category: 'Non-Academic', cadre: 'Nursing' },

  // Pharmacy Professional Cadre
  { designation: 'Pharmacist', gradeLevel: 'CONHESS 9', category: 'Non-Academic', cadre: 'Pharmacy' },
  { designation: 'Senior Pharmacist', gradeLevel: 'CONHESS 10', category: 'Non-Academic', cadre: 'Pharmacy' },
  { designation: 'Principal Pharmacist', gradeLevel: 'CONHESS 12', category: 'Non-Academic', cadre: 'Pharmacy' },
  { designation: 'Assistant Chief Pharmacist', gradeLevel: 'CONHESS 13', category: 'Non-Academic', cadre: 'Pharmacy' },
  { designation: 'Chief Pharmacist', gradeLevel: 'CONHESS 14', category: 'Non-Academic', cadre: 'Pharmacy' },
  { designation: 'Assistant Director (Pharmacy)', gradeLevel: 'CONHESS 15', category: 'Non-Academic', cadre: 'Pharmacy' },
  { designation: 'Deputy Director (Pharmacy)', gradeLevel: 'CONHESS 16', category: 'Non-Academic', cadre: 'Pharmacy' },
  { designation: 'Director of Pharmacy Services', gradeLevel: 'CONHESS 17', category: 'Non-Academic', cadre: 'Pharmacy' },

  // Pharmacy Technician Cadre (Diploma Path)
  { designation: 'Pharmacy Technician', gradeLevel: 'CONHESS 7', category: 'Non-Academic', cadre: 'Pharmacy Technician' },
  { designation: 'Higher Pharmacy Technician', gradeLevel: 'CONHESS 8', category: 'Non-Academic', cadre: 'Pharmacy Technician' },
  { designation: 'Senior Pharmacy Technician', gradeLevel: 'CONHESS 9', category: 'Non-Academic', cadre: 'Pharmacy Technician' },
  { designation: 'Principal Pharmacy Tech II', gradeLevel: 'CONHESS 10', category: 'Non-Academic', cadre: 'Pharmacy Technician' },
  { designation: 'Principal Pharmacy Tech I', gradeLevel: 'CONHESS 12', category: 'Non-Academic', cadre: 'Pharmacy Technician' },
  { designation: 'Chief Pharmacy Technician', gradeLevel: 'CONHESS 13', category: 'Non-Academic', cadre: 'Pharmacy Technician' },

  // Medical Laboratory Scientist Cadre (B.MLS Path)
  { designation: 'Med. Lab. Scientist II', gradeLevel: 'CONHESS 8', category: 'Non-Academic', cadre: 'Medical Lab' },
  { designation: 'Med. Lab. Scientist I', gradeLevel: 'CONHESS 9', category: 'Non-Academic', cadre: 'Medical Lab' },
  { designation: 'Senior Med. Lab. Scientist', gradeLevel: 'CONHESS 10', category: 'Non-Academic', cadre: 'Medical Lab' },
  { designation: 'Principal Med. Lab. Scientist', gradeLevel: 'CONHESS 12', category: 'Non-Academic', cadre: 'Medical Lab' },
  { designation: 'Asst. Chief Med. Lab. Scientist', gradeLevel: 'CONHESS 13', category: 'Non-Academic', cadre: 'Medical Lab' },
  { designation: 'Chief Med. Lab. Scientist', gradeLevel: 'CONHESS 14', category: 'Non-Academic', cadre: 'Medical Lab' },
  { designation: 'Assistant Director (MLS)', gradeLevel: 'CONHESS 15', category: 'Non-Academic', cadre: 'Medical Lab' },
  { designation: 'Deouty Director (MLS)', gradeLevel: 'CONHESS 16', category: 'Non-Academic', cadre: 'Medical Lab' },
  { designation: 'Director (Medical Lab)', gradeLevel: 'CONHESS 17', category: 'Non-Academic', cadre: 'Medical Lab' },

  // Medical Laboratory Technician Cadre
  { designation: 'Medical Lab. Technician', gradeLevel: 'CONTISS 06', category: 'Non-Academic', cadre: 'Medical Lab Tech' },
  { designation: 'Higher Med. Lab. Technician', gradeLevel: 'CONTISS 07', category: 'Non-Academic', cadre: 'Medical Lab Tech' },
  { designation: 'Senior Med. Lab. Technician', gradeLevel: 'CONTISS 08', category: 'Non-Academic', cadre: 'Medical Lab Tech' },
  { designation: 'Principal Med. Lab. Tech. II', gradeLevel: 'CONTISS 09', category: 'Non-Academic', cadre: 'Medical Lab Tech' },
  { designation: 'Principal Med. Lab. Tech. I', gradeLevel: 'CONTISS 11', category: 'Non-Academic', cadre: 'Medical Lab Tech' },
  { designation: 'Asst. Chief Med. Lab. Tech.', gradeLevel: 'CONTISS 12', category: 'Non-Academic', cadre: 'Medical Lab Tech' },
  { designation: 'Chief Medical Lab. Technician', gradeLevel: 'CONTISS 13', category: 'Non-Academic', cadre: 'Medical Lab Tech' },
];
