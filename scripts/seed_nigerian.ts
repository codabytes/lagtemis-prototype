import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const BATCH_SIZE = 400;

// Nigerian Personas Data
const nigerianFirstNamesMale = ['Olumide', 'Chidi', 'Abubakar', 'Tunde', 'Femi', 'Emeka', 'Uche', 'Sani', 'Ibrahim', 'Kelechi', 'Ade', 'Babatunde', 'Segun', 'Oluwaseun', 'Musa', 'Yakubu', 'Danjuma', 'Kayode', 'Yinka', 'Dayo'];
const nigerianFirstNamesFemale = ['Amina', 'Chinelo', 'Zainab', 'Folake', 'Ify', 'Nneka', 'Bisi', 'Hadiza', 'Khadijah', 'Oluwatoyin', 'Yemisi', 'Ronke', 'Ebere', 'Uju', 'Bola', 'Sola', 'Funke', 'Kikelomo', 'Aisha', 'Fatima'];
const nigerianLastNames = ['Okonkwo', 'Balogun', 'Adebayo', 'Eze', 'Danladi', 'Bello', 'Nwosu', 'Obi', 'Adeniyi', 'Yusuf', 'Mohammed', 'Okoro', 'Umar', 'Ajayi', 'Olatunji', 'Ibrahim', 'Ojo', 'Fashola', 'Tinubu', 'Dangote'];

async function purgeExisting() {
  console.log('Purging existing non-institutional data...');
  const collections = ['students', 'staff', 'facilities', 'publications', 'trainings', 'maintenance_logs'];
  for (const collName of collections) {
    const snap = await getDocs(collection(db, collName));
    console.log(`Deleting ${snap.size} docs from ${collName}`);
    for (const docSnap of snap.docs) {
      await deleteDoc(doc(db, collName, docSnap.id));
    }
  }
}

async function seed() {
  await purgeExisting();

  console.log('Fetching institutions, faculties, and departments...');
  const instSnap = await getDocs(collection(db, 'institutions'));
  const facultiesSnap = await getDocs(collection(db, 'faculties'));
  const departmentsSnap = await getDocs(collection(db, 'departments'));

  const institutions = instSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const faculties = facultiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const departments = departmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const currentYear = 2026;

  // 1. Students (500)
  console.log('Generating 500 Nigerian students...');
  const students = [];
  for (let i = 0; i < 500; i++) {
    const inst = faker.helpers.arrayElement(institutions);
    const instFaculties = faculties.filter(f => f.institutionId === inst.id);
    const faculty = faker.helpers.arrayElement(instFaculties);
    const facultyDepts = departments.filter(d => d.facultyId === faculty.id);
    const dept = faker.helpers.arrayElement(facultyDepts);

    const sex = faker.helpers.arrayElement(['Male', 'Female']);
    const firstName = faker.helpers.arrayElement(sex === 'Male' ? nigerianFirstNamesMale : nigerianFirstNamesFemale);
    const lastName = faker.helpers.arrayElement(nigerianLastNames);
    
    const admissionYear = faker.number.int({ min: 2000, max: 2026 });
    
    // Duration Logic
    // Universities take Degrees. Medicine 6, Health/Nursing 5, Others 4.
    // Others take OND+HND (4 years total).
    let duration = 4;
    const deptName = (dept.name || '').toLowerCase();
    const facultyName = (faculty.name || '').toLowerCase();

    if (inst.type === 'University') {
      if (deptName.includes('medicine') && deptName.includes('surgery')) {
        duration = 6;
      } else if (facultyName.includes('medical') || facultyName.includes('health') || deptName.includes('nursing') || deptName.includes('pharmacy')) {
        duration = 5;
      }
    } else {
      duration = 4; // Assume OND+HND total path
    }

    const expectedGraduationYear = admissionYear + duration;
    const status = expectedGraduationYear <= currentYear ? 'Graduated' : 'Enrolled';
    const graduationYear = status === 'Graduated' ? expectedGraduationYear : null;

    // Qualification Logic
    let qType = '';
    let qClass = '';
    if (inst.type === 'University') {
      qType = 'Degree';
      qClass = faker.helpers.arrayElement(['First Class', 'Second Class Upper', 'Second Class Lower', 'Third Class', 'Pass']);
    } else {
      qType = 'HND'; // assume HND path
      qClass = faker.helpers.arrayElement(['Distinction', 'Upper Credit', 'Lower Credit', 'Pass']);
    }

    // Matric Number Format: INS/YEAR/DEPT_CODE/SEQUENCE
    const deptPrefix = (dept.name || 'GEN').substring(0, 3).toUpperCase();
    const matricNumber = `${inst.shortName}/${admissionYear}/${deptPrefix}/${faker.string.numeric(4)}`;

    students.push({
      lasrraId: 'LA-' + faker.string.alphanumeric(8).toUpperCase(),
      firstName,
      lastName,
      matricNumber,
      sex,
      dob: faker.date.between({ from: '1980-01-01', to: '2010-12-31' }).toISOString().split('T')[0],
      institutionId: inst.id,
      facultyId: faculty.id,
      departmentId: dept.id,
      admissionYear: admissionYear.toString(),
      graduationYear: graduationYear ? graduationYear.toString() : null,
      enrollmentStatus: status,
      certificateVerified: faker.datatype.boolean(0.8),
      picture: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&size=200`,
      qualificationType: qType,
      qualificationClass: status === 'Graduated' ? qClass : null,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${faker.string.numeric(2)}@student.${(inst.shortName || 'inst').toLowerCase()}.edu.ng`,
      mobilePhone: '0' + faker.helpers.arrayElement(['703', '803', '806', '810', '813', '816', '903', '906', '702', '706']) + faker.string.numeric(7)
    });
  }

  // 2. Staff (120)
  console.log('Generating 120 Nigerian academic staff...');
  const staffMembers = [];
  const titles = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'];
  const ranks = ['Graduate Assistant', 'Assistant Lecturer', 'Lecturer II', 'Lecturer I', 'Senior Lecturer', 'Associate Professor', 'Professor'];
  const statuses = ['Active', 'On Study Leave', 'On Sabbatical', 'Retired'];

  for (let i = 0; i < 120; i++) {
    const inst = faker.helpers.arrayElement(institutions);
    const instFaculties = faculties.filter(f => f.institutionId === inst.id);
    const faculty = faker.helpers.arrayElement(instFaculties);
    const facultyDepts = departments.filter(d => d.facultyId === faculty.id);
    const dept = faker.helpers.arrayElement(facultyDepts);

    const gender = faker.helpers.arrayElement(['Male', 'Female']);
    const firstName = faker.helpers.arrayElement(gender === 'Male' ? nigerianFirstNamesMale : nigerianFirstNamesFemale);
    const surname = faker.helpers.arrayElement(nigerianLastNames);

    staffMembers.push({
      lasrraId: 'LAS-S-' + faker.string.alphanumeric(8).toUpperCase(),
      staffId: 'STF-' + faker.string.numeric(6),
      title: faker.helpers.arrayElement(titles),
      firstName,
      surname,
      gender,
      dob: faker.date.between({ from: '1960-01-01', to: '1995-12-31' }).toISOString().split('T')[0],
      institutionId: inst.id,
      facultyId: faculty.id,
      departmentId: dept.id,
      designation: faker.helpers.arrayElement(ranks),
      gradeLevel: faker.number.int({ min: 7, max: 15 }).toString(),
      dateOfFirstAppointment: faker.date.past({ years: 20 }).toISOString().split('T')[0],
      dateOfConfirmation: faker.date.past({ years: 18 }).toISOString().split('T')[0],
      dateOfLastPromotion: faker.date.past({ years: 3 }).toISOString().split('T')[0],
      highestQualification: faker.helpers.arrayElement(['PhD', 'M.Sc', 'M.Phil', 'MBA']),
      employmentStatus: faker.helpers.arrayElement(statuses),
      staffType: 'Academic',
      specialization: dept.name,
      picture: `https://ui-avatars.com/api/?name=${firstName}+${surname}&background=random&size=200`,
      email: `${firstName.toLowerCase()}.${surname.toLowerCase()}@${(inst.shortName || 'inst').toLowerCase()}.edu.ng`,
      mobilePhone: '0' + faker.helpers.arrayElement(['703', '803', '806', '810', '813', '816', '903', '906', '702', '706']) + faker.string.numeric(7)
    });
  }

  // 3. Facilities (50)
  console.log('Generating 50 facilities...');
  const facilitiesData = [];
  const facilityTypes = ['Lecture Theater', 'Lecture Hall', 'Lecture Room', 'Library', 'Laboratory', 'Workshop', 'Studio'];
  const fundingSources = ['Lagos State Government', 'TETFund', 'Special Intervention', 'CSR', 'PPP'];

  for (let i = 0; i < 50; i++) {
    const inst = faker.helpers.arrayElement(institutions);
    const instFaculties = faculties.filter(f => f.institutionId === inst.id);
    const faculty = faker.helpers.arrayElement(instFaculties);

    const completionDate = faker.date.between({ from: '2000-01-01', to: '2026-01-01' });
    
    facilitiesData.push({
      assetId: 'FAC-' + faker.string.alphanumeric(6).toUpperCase(),
      name: (inst.shortName || inst.name.substring(0, 3).toUpperCase()) + ' ' + faker.helpers.arrayElement(['Auditorium', 'Science Block', 'Innovation Hub', 'Main Hall', 'Engineering Complex', 'Staff Center']),
      type: faker.helpers.arrayElement(facilityTypes),
      description: 'Institutional asset supporting teaching and research.',
      institutionId: inst.id,
      campus: 'Main Campus',
      location: faker.location.city() + ' Area',
      custodianId: faculty.id,
      capacity: faker.number.int({ min: 50, max: 1000 }),
      dateCompleted: completionDate.toISOString().split('T')[0],
      fundingSource: faker.helpers.arrayElement(fundingSources)
    });
  }

  // Uploading
  console.log('Finalizing database upload...');
  
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    students.slice(i, i + BATCH_SIZE).forEach(s => {
      const ref = doc(collection(db, 'students'));
      batch.set(ref, s);
    });
    await batch.commit();
  }

  // Pubs and Trainings Data (Realistic English)
  const researchTitles = [
    'Impact of Digital Transformation on Nigerian Higher Education',
    'Sustainable Urban Planning in Lagos Metropolitan Area',
    'Advances in Renewable Energy Integration for Rural Communities',
    'Machine Learning Applications in Diagnostic Healthcare',
    'Cybersecurity Frameworks for FinTech Startups in Nigeria',
    'Geospatial Analysis of Soil Erosion in South-Western Nigeria',
    'Social Media Influence on Political Engagement among Nigerian Youth',
    'Optimization of Logistics for Agricultural Supply Chains',
    'Public Health Strategies for Combating Infectious Diseases',
    'Micro-finance as a Tool for Women Empowerment in Rural Areas'
  ];

  const trainingTitles = [
    'Advanced Pedagogy and Digital Classroom Management',
    'Research Methodology and Grant Writing Workshop',
    'Artificial Intelligence in Academic Research',
    'Stakeholder Management and Institutional Leadership',
    'Quality Assurance and Curriculum Development Seminar',
    'Modern Laboratory Safety and Equipment Calibration',
    'Effective Mentorship and Graduate Supervision',
    'Grant Management and International Collaboration Training',
    'Data Science and Big Data Analytics Workshop',
    'Ethics and Integrity in Academic Publishing'
  ];

  for (const s of staffMembers) {
    const staffRef = await addDoc(collection(db, 'staff'), s);
    
    // Pubs
    for (let j = 0; j < faker.number.int({ min: 1, max: 3 }); j++) {
      await addDoc(collection(db, 'publications'), { 
        staffId: staffRef.id, 
        title: faker.helpers.arrayElement(researchTitles), 
        type: faker.helpers.arrayElement(['Journal Article', 'Conference Paper', 'Review Paper', 'Book Chapter']), 
        year: faker.number.int({ min: 2018, max: 2026 }), 
        abstract: 'This research explores modern methodologies and their implications in the context of advanced academic study and regional development.', 
        fundingSource: faker.helpers.arrayElement(['LASG', 'TETFund', 'LASRIC', 'International Grant']) 
      });
    }

    // Trainings
    for (let j = 0; j < faker.number.int({ min: 1, max: 2 }); j++) {
      await addDoc(collection(db, 'trainings'), {
        staffId: staffRef.id,
        trainingId: 'TRN-' + faker.string.alphanumeric(6).toUpperCase(),
        title: faker.helpers.arrayElement(trainingTitles),
        type: faker.helpers.arrayElement(['Workshop', 'Seminar', 'Conference', 'Technical Training']),
        date: faker.date.past({ years: 3 }).toISOString().split('T')[0],
        duration: faker.helpers.arrayElement(['3 Days', '1 Week', '2 Weeks']),
        location: faker.helpers.arrayElement(['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt', 'Online']),
        isInternational: faker.datatype.boolean(0.2),
        provider: faker.company.name() + ' Associates',
        fundingSource: faker.helpers.arrayElement(['LASG', 'TETFund', 'Self-Sponsored']),
        description: 'Professional development program aimed at enhancing technical expertise and academic delivery.'
      });
    }
  }

  for (const f of facilitiesData) {
    const facRef = await addDoc(collection(db, 'facilities'), f);
    for (let j = 0; j < faker.number.int({ min: 1, max: 4 }); j++) {
      await addDoc(collection(db, 'maintenance_logs'), { 
        facilityId: facRef.id, 
        facilityName: f.name, 
        maintenanceType: faker.helpers.arrayElement(['Routine', 'Repair', 'Inspection', 'Emergency']), 
        workPerformed: faker.helpers.arrayElement([
          'Air conditioning unit servicing',
          'Electrical wiring check and repair',
          'Painting and wall treatment',
          'Furniture repairs and replacements',
          'Roofing inspection and leak repair',
          'Plumbing fixes and sanitation check'
        ]), 
        completedAt: faker.date.past({ years: 5 }).toISOString().split('T')[0]
      });
    }
  }

  console.log('Seeding Success!');
}

seed().catch(console.error);
