export interface NonAcademicUnit {
  name: string;
}

export interface NonAcademicDirectorate {
  name: string;
  units: NonAcademicUnit[];
}

export interface NonAcademicDivision {
  name: string;
  directorates: NonAcademicDirectorate[];
}

export const NON_ACADEMIC_HIERARCHY: NonAcademicDivision[] = [
  {
    name: "Vice-Chancellor's Office",
    directorates: [
      {
        name: "Vice-Chancellor's Main Office",
        units: [{ name: "Secretariat" }, { name: "Personal Secretary's Office" }, { name: "Special Duties & Intervention" }]
      },
      {
        name: "Academic Planning",
        units: [{ name: "Academic Statistics & Records" }, { name: "Curriculum Development Unit" }, { name: "Quality Assurance Unit" }]
      },
      {
        name: "Information & Communication Technology (DICT)",
        units: [
          { name: "Web Services & Application Development" },
          { name: "Network & Hardware Infrastructure" },
          { name: "ID Card & Data Management" },
          { name: "Training & User Support" }
        ]
      },
      {
        name: "Research Management & Innovation",
        units: [{ name: "Grants & Research Support" }, { name: "Innovation & Intellectual Property" }, { name: "Research Ethics & Compliance" }]
      },
      {
        name: "Development",
        units: [{ name: "Endowment & Grants Unit" }, { name: "Resource Mobilization Unit" }, { name: "Alumni Relations Unit" }, { name: "Graduate Support Unit" }]
      },
      {
        name: "Directorate of Special Interventions",
        units: [{ name: "TETFund Projects Coordination" }, { name: "Specialized Grant Management" }]
      },
      {
        name: "University Multimedia Centre",
        units: [{ name: "Audio-Visual Production" }, { name: "Photography & Digital Media" }, { name: "Graphics & Branding" }]
      },
      {
        name: "Public Relations (CIPPR)",
        units: [{ name: "Media Relations Unit" }, { name: "Social Media Management" }, { name: "Protocol & Events" }]
      },
      {
        name: "Security Unit",
        units: [{ name: "Main Campus Operations" }, { name: "Surveillance & Intelligence" }, { name: "Traffic & Parking Management" }]
      }
    ]
  },
  {
    name: "Registry",
    directorates: [
      {
        name: "Registrar's Office",
        units: [{ name: "Legal Unit" }, { name: "Centre for Information and Public Relations (CIPPR)" }]
      },
      {
        name: "Academic Staff Establishments Division",
        units: [{ name: "Appointments Unit" }, { name: "Promotions & Appraisals Unit" }, { name: "Leaves & Passages Unit" }, { name: "Discipline & Ethics Unit" }]
      },
      {
        name: "Non-Academic Staff Establishments Division",
        units: [{ name: "Senior Non-Teaching Unit" }, { name: "Junior Staff Unit" }, { name: "Records & Statistics Unit" }]
      },
      {
        name: "Exams & Records Division",
        units: [{ name: "Examinations Unit" }, { name: "Transcript & Records Unit" }, { name: "Certificate Unit" }]
      },
      {
        name: "Council Matters Division",
        units: [{ name: "Council Secretariat" }, { name: "Finance & General Purposes Committee (F&GPC) Unit" }, { name: "Appointments & Promotions Committee Unit (Council level)" }]
      },
      {
        name: "Senate Matters Division",
        units: [{ name: "Senate Secretariat" }, { name: "Ceremonials Committee Unit" }, { name: "Business Committee of Senate (BCOS)" }]
      },
      {
        name: "Staff Welfare, Training & Passages",
        units: [{ name: "Training & Development Unit" }, { name: "Welfare Unit" }, { name: "Passages Unit" }]
      },
      {
        name: "Pensions",
        units: [{ name: "Pensions Unit" }]
      }
    ]
  },
  {
    name: "Bursary",
    directorates: [
      {
        name: "Bursar's Office",
        units: [{ name: "Secretariat" }, { name: "Chief Personal Secretary's Office" }, { name: "General Administration" }]
      },
      {
        name: "Treasury & Business Accounting",
        units: [{ name: "Cash Office" }, { name: "Expenditure & Payment Unit" }, { name: "Business Ventures Accounting" }, { name: "Bank Reconciliation Unit" }]
      },
      {
        name: "Final Accounts",
        units: [{ name: "Financial Reporting Unit" }, { name: "Fixed Assets & Inventory Unit" }, { name: "Grants & Research Accounting" }]
      },
      {
        name: "Budget & Expenditure Control",
        units: [{ name: "Budgetary Control Unit" }, { name: "LSG (Lagos State Government) Matters Unit" }, { name: "Commitment & Costing Unit" }]
      },
      {
        name: "Risk, Insurance & Investment",
        units: [{ name: "Insurance Unit" }, { name: "Investment Management Unit" }, { name: "Student Accounts (Fees & Records)" }]
      },
      {
        name: "Payroll & Staff Matters",
        units: [{ name: "Salary & Wages Unit" }, { name: "Pension & Gratuity Unit" }, { name: "Loans & Advances Unit" }]
      }
    ]
  }
];
