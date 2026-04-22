import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const BATCH_SIZE = 400;

const nigerianFirstNamesMale = ['Olumide', 'Chidi', 'Abubakar', 'Tunde', 'Femi', 'Emeka', 'Uche', 'Sani', 'Ibrahim', 'Kelechi', 'Ade', 'Babatunde', 'Segun', 'Oluwaseun', 'Musa', 'Yakubu', 'Danjuma', 'Kayode', 'Yinka', 'Dayo'];
const nigerianFirstNamesFemale = ['Amina', 'Chinelo', 'Zainab', 'Folake', 'Ify', 'Nneka', 'Bisi', 'Hadiza', 'Khadijah', 'Oluwatoyin', 'Yemisi', 'Ronke', 'Ebere', 'Uju', 'Bola', 'Sola', 'Funke', 'Kikelomo', 'Aisha', 'Fatima'];
const nigerianLastNames = ['Okonkwo', 'Balogun', 'Adebayo', 'Eze', 'Danladi', 'Bello', 'Nwosu', 'Obi', 'Adeniyi', 'Yusuf', 'Mohammed', 'Okoro', 'Umar', 'Ajayi', 'Olatunji', 'Ibrahim', 'Ojo', 'Fashola', 'Tinubu', 'Dangote'];

async function seedStudents() {
  console.log('Fetching dependencies...');
  const instSnap = await getDocs(collection(db, 'institutions'));
  const facSnap = await getDocs(collection(db, 'faculties'));
  const deptSnap = await getDocs(collection(db, 'departments'));

  const institutions = instSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const faculties = facSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const departments = deptSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Found ${institutions.length} institutions, ${faculties.length} faculties, ${departments.length} departments.`);

  const batch = writeBatch(db);
  const students = [];

  for (let i = 0; i < 250; i++) {
    const inst = faker.helpers.arrayElement(institutions);
    const instFacs = faculties.filter(f => f.institutionId === inst.id);
    const fac = faker.helpers.arrayElement(instFacs);
    const facDepts = departments.filter(d => d.facultyId === fac.id);
    const dept = faker.helpers.arrayElement(facDepts);

    const sex = faker.helpers.arrayElement(['Male', 'Female']);
    const firstName = faker.helpers.arrayElement(sex === 'Male' ? nigerianFirstNamesMale : nigerianFirstNamesFemale);
    const lastName = faker.helpers.arrayElement(nigerianLastNames);
    const admissionYear = faker.number.int({ min: 2000, max: 2026 });
    
    // Duration and Degree Type Logic
    let duration = 4;
    let qualificationType = 'B.Sc';
    
    const isUniv = inst.name.toLowerCase().includes('university');
    const isMed = fac.name.toLowerCase().includes('medical') || fac.name.toLowerCase().includes('medicine') || dept.name.toLowerCase().includes('medicine');

    if (isUniv) {
        if (isMed) {
            if (dept.name.toLowerCase().includes('surgery')) {
                duration = 6;
                qualificationType = 'MBBS';
            } else {
                duration = 5;
                qualificationType = 'B.MLS'; // Medical Lab Science or similar
            }
        } else {
            duration = 4;
            qualificationType = faker.helpers.arrayElement(['B.Sc', 'B.A', 'B.Eng', 'LL.B']);
        }
    } else {
        // Polytechnic or College - Assume OND/HND combined path (4 years)
        duration = 4;
        qualificationType = 'HND';
    }

    const gradYear = admissionYear + duration;
    const isGraduated = gradYear <= 2026;
    const status = isGraduated ? 'Graduated' : 'Enrolled';

    // Qualification Class Logic
    let qualificationClass = 'Pass';
    if (isUniv) {
        qualificationClass = faker.helpers.arrayElement(['First Class', 'Second Class Upper', 'Second Class Lower', 'Third Class', 'Pass']);
    } else {
        qualificationClass = faker.helpers.arrayElement(['Distinction', 'Upper Credit', 'Lower Credit', 'Pass']);
    }

    const matricNo = `${inst.name.substring(0,3).toUpperCase()}/${admissionYear}/${dept.name.substring(0,3).toUpperCase()}/${String(i+1).padStart(4, '0')}`;
    
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${inst.name.split(' ')[0].toLowerCase()}.edu.ng`;
    const phone = `+234 ${faker.helpers.arrayElement(['70', '80', '81', '90', '91'])}${faker.string.numeric(8)}`;

    const student = {
      lasrraId: `LA-${faker.string.alphanumeric(8).toUpperCase()}`,
      firstName,
      lastName,
      otherName: faker.helpers.arrayElement(['Oluwa', 'Chimdi', 'Tobe', 'Obinna', 'Bade']),
      dob: faker.date.birthdate({ min: 16, max: 45, mode: 'age' }).toISOString().split('T')[0],
      mobilePhone: phone,
      email,
      sex,
      matricNumber: matricNo,
      institutionId: inst.id,
      facultyId: fac.id,
      departmentId: dept.id,
      admissionYear: String(admissionYear),
      graduationYear: isGraduated ? String(gradYear) : null,
      qualificationType,
      qualificationClass: isGraduated ? qualificationClass : null,
      enrollmentStatus: status,
      certificateVerified: faker.datatype.boolean(0.8),
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}&top[]=shortHair,longHair&hairColor[]=black`
    };

    const newDoc = doc(collection(db, 'students'));
    batch.set(newDoc, student);
    students.push({ id: newDoc.id, ...student });
  }

  await batch.commit();
  console.log(`Successfully seeded 250 Nigerian students.`);
}

seedStudents().catch(console.error);
