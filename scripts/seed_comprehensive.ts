import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, writeBatch, doc } from 'firebase/firestore';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const BATCH_SIZE = 400;

async function seed() {
  console.log('Fetching institutions, faculties, and departments...');
  const instSnap = await getDocs(collection(db, 'institutions'));
  const facultiesSnap = await getDocs(collection(db, 'faculties'));
  const departmentsSnap = await getDocs(collection(db, 'departments'));

  const institutions = instSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const faculties = facultiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const departments = departmentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  if (institutions.length === 0 || departments.length === 0) {
    console.error('No institutions or departments found. Please ensure initial data exists.');
    return;
  }

  // 1. Generate 500 Students
  console.log('Generating 500 students...');
  const students = [];
  const currentYear = 2026;

  for (let i = 0; i < 500; i++) {
    const inst = faker.helpers.arrayElement(institutions);
    const instFaculties = faculties.filter(f => f.institutionId === inst.id);
    const faculty = instFaculties.length > 0 ? faker.helpers.arrayElement(instFaculties) : null;
    if (!faculty) continue;

    const facultyDepts = departments.filter(d => d.facultyId === faculty.id);
    const dept = facultyDepts.length > 0 ? faker.helpers.arrayElement(facultyDepts) : null;
    if (!dept) continue;

    const admissionYear = faker.number.int({ min: 2000, max: 2026 });
    
    // Duration logic
    let duration = 4;
    const deptName = (dept.name || '').toLowerCase();
    const facultyName = (faculty.name || '').toLowerCase();

    if (deptName.includes('medicine') && deptName.includes('surgery')) {
      duration = 6;
    } else if (facultyName.includes('medical') || facultyName.includes('health') || deptName.includes('nursing') || deptName.includes('pharmacy')) {
      duration = 5;
    }

    const expectedGraduationYear = admissionYear + duration;
    const status = expectedGraduationYear <= currentYear ? 'Graduated' : 'Enrolled';
    const graduationYear = status === 'Graduated' ? expectedGraduationYear : null;

    students.push({
      lasrraId: 'LA-' + faker.string.alphanumeric(8).toUpperCase(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      matricNumber: inst.shortName + '/' + admissionYear + '/' + faker.string.numeric(4),
      sex: faker.helpers.arrayElement(['Male', 'Female']),
      dob: faker.date.between({ from: '1980-01-01', to: '2010-12-31' }).toISOString().split('T')[0],
      institutionId: inst.id,
      facultyId: faculty.id,
      departmentId: dept.id,
      admissionYear: admissionYear.toString(),
      graduationYear: graduationYear ? graduationYear.toString() : null,
      enrollmentStatus: status,
      certificateVerified: faker.datatype.boolean(0.8),
      picture: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
      qualificationType: inst.type === 'University' ? 'B.Sc' : (inst.type === 'Polytechnic' ? 'HND' : 'NCE'),
      qualificationClass: faker.helpers.arrayElement(['First Class', 'Upper Credit', 'Lower Credit', 'Distinction', 'Merit'])
    });
  }

  // 2. Generate 120 Academic Staff
  console.log('Generating 120 academic staff...');
  const staffMembers = [];
  const titles = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'];
  const ranks = ['Graduate Assistant', 'Assistant Lecturer', 'Lecturer II', 'Lecturer I', 'Senior Lecturer', 'Associate Professor', 'Professor'];
  const statuses = ['Active', 'On Study Leave', 'On Sabbatical', 'Retired'];

  for (let i = 0; i < 120; i++) {
    const inst = faker.helpers.arrayElement(institutions);
    const instFaculties = faculties.filter(f => f.institutionId === inst.id);
    const faculty = instFaculties.length > 0 ? faker.helpers.arrayElement(instFaculties) : null;
    if (!faculty) continue;

    const facultyDepts = departments.filter(d => d.facultyId === faculty.id);
    const dept = facultyDepts.length > 0 ? faker.helpers.arrayElement(facultyDepts) : null;
    if (!dept) continue;

    const gender = faker.helpers.arrayElement(['Male', 'Female']);
    const firstName = faker.person.firstName(gender === 'Male' ? 'male' : 'female');
    const surname = faker.person.lastName();

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
      highestQualification: faker.helpers.arrayElement(['PhD', 'M.Sc', 'M.Phil']),
      employmentStatus: faker.helpers.arrayElement(statuses),
      staffType: 'Academic',
      specialization: dept.name + ' Specialization',
      picture: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
      email: faker.internet.email({ firstName, lastName: surname }).toLowerCase(),
      mobilePhone: '080' + faker.string.numeric(8)
    });
  }

  // 3. Generate 50 Infrastructure (Facilities)
  console.log('Generating 50 facilities...');
  const facilitiesData = [];
  const facilityTypes = ['Lecture Theater', 'Lecture Hall', 'Lecture Room', 'Library', 'Laboratory', 'Workshop', 'Studio'];
  const fundingSources = ['Lagos State Government', 'TETFund', 'Special Intervention', 'CSR', 'PPP'];

  for (let i = 0; i < 50; i++) {
    const inst = faker.helpers.arrayElement(institutions);
    const instFaculties = faculties.filter(f => f.institutionId === inst.id);
    const faculty = instFaculties.length > 0 ? faker.helpers.arrayElement(instFaculties) : null;
    if (!faculty) continue;

    const completionDate = faker.date.between({ from: '2000-01-01', to: '2026-01-01' });
    
    facilitiesData.push({
      assetId: 'FAC-' + faker.string.alphanumeric(6).toUpperCase(),
      name: inst.shortName + ' ' + faker.helpers.arrayElement(['Block A', 'Science Complex', 'Digital Hub', 'Annex']),
      type: faker.helpers.arrayElement(facilityTypes),
      description: 'Main campus facility used for academic purposes.',
      institutionId: inst.id,
      campus: 'Main Campus',
      location: 'Section ' + faker.string.alpha(1).toUpperCase(),
      custodianId: faculty.id,
      capacity: faker.number.int({ min: 50, max: 1000 }),
      dateCompleted: completionDate.toISOString().split('T')[0],
      fundingSource: faker.helpers.arrayElement(fundingSources)
    });
  }

  // Upload Students
  console.log('Uploading students...');
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    students.slice(i, i + BATCH_SIZE).forEach(s => {
      const ref = doc(collection(db, 'students'));
      batch.set(ref, s);
    });
    await batch.commit();
    console.log(`Uploaded batch ${i / BATCH_SIZE + 1} students...`);
  }

  // Upload Staff + Publications + Trainings
  console.log('Uploading staff, publications and trainings...');
  for (const s of staffMembers) {
    const staffRef = await addDoc(collection(db, 'staff'), s);
    
    // Publications (2-5 per staff)
    const pubCount = faker.number.int({ min: 2, max: 5 });
    for (let j = 0; j < pubCount; j++) {
      await addDoc(collection(db, 'publications'), {
        staffId: staffRef.id,
        outputId: 'PUB-' + faker.string.numeric(8),
        title: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(['Journal Article', 'Monograph', 'Book/Book Chapter', 'Conference Paper']),
        year: faker.number.int({ min: 2010, max: 2026 }),
        abstract: faker.lorem.paragraph(),
        fundingSource: faker.helpers.arrayElement(['Lagos State Government', 'TETFund', 'Self-Sponsored'])
      });
    }

    // Trainings (1-3 per staff)
    const trainCount = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < trainCount; j++) {
      await addDoc(collection(db, 'trainings'), {
        staffId: staffRef.id,
        trainingId: 'TRN-' + faker.string.numeric(6),
        title: faker.lorem.words(5),
        type: faker.helpers.arrayElement(['Workshop', 'Seminar', 'Certification']),
        date: faker.date.past({ years: 5 }).toISOString().split('T')[0],
        duration: faker.number.int({ min: 1, max: 14 }) + ' Days',
        location: faker.helpers.arrayElement(['Lagos', 'Abuja', 'London', 'USA']),
        isInternational: faker.datatype.boolean(0.2),
        provider: faker.company.name(),
        fundingSource: faker.helpers.arrayElement(['Lagos State Government', 'TETFund', 'Self-Sponsored'])
      });
    }
  }

  // Upload Facilities + Maintenance Logs
  console.log('Uploading facilities and maintenance logs...');
  for (const f of facilitiesData) {
    const facRef = await addDoc(collection(db, 'facilities'), f);
    
    // Maintenance logs based on age
    const completionYear = new Date(f.dateCompleted).getFullYear();
    const age = currentYear - completionYear;
    const logCount = Math.floor(age / 2); // Roughly every 2 years

    for (let j = 0; j < logCount; j++) {
      await addDoc(collection(db, 'maintenance_logs'), {
        facilityId: facRef.id,
        facilityName: f.name,
        maintenanceType: faker.helpers.arrayElement(['Preventive', 'Corrective']),
        workPerformed: faker.lorem.sentence(),
        completedAt: faker.date.between({ from: f.dateCompleted, to: new Date().toISOString() }).toISOString().split('T')[0]
      });
    }
  }

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);
