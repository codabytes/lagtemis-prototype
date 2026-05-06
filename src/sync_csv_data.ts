import { db } from './firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import fs from 'fs';

const STAFF_CSV_PATH = './TEMIS_STAFF.csv';
const STUDENT_CSV_PATH = './TEMIS_STUDENTS.csv';

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  const year = parts[2];
  return `${year}-${month}-${day}`;
};

const parseCSV = (csvData: string) => {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] ? values[i].trim() : "";
    });
    return obj;
  });
};

const syncStaff = async () => {
  console.log('Syncing Staff Data...');
  if (!fs.existsSync(STAFF_CSV_PATH)) {
    console.error('Staff CSV not found');
    return;
  }
  const csvContent = fs.readFileSync(STAFF_CSV_PATH, 'utf8');
  const records = parseCSV(csvContent);
  const batch = writeBatch(db);
  
  records.forEach(record => {
    if (!record.staffId) return;
    const staffData = {
      ...record,
      dob: formatDate(record.dob),
      dateOfFirstAppointment: formatDate(record.dateOfFirstAppointment),
      dateOfConfirmation: formatDate(record.dateOfFirstAppointment), // Default to appt date
      dateOfLastPromotion: formatDate(record.dateOfFirstAppointment), // Default to appt date
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Ensure specific fields required by UI
      otherName: "",
      specialization: "",
    };
    const docId = record.staffId.replace(/\//g, '_');
    const docRef = doc(db, 'staff', docId);
    batch.set(docRef, staffData, { merge: true });
  });

  await batch.commit();
  console.log(`Synced ${records.length} staff records.`);
};

const syncStudents = async () => {
  console.log('Syncing Student Data...');
  if (!fs.existsSync(STUDENT_CSV_PATH)) {
    console.error('Student CSV not found');
    return;
  }
  const csvContent = fs.readFileSync(STUDENT_CSV_PATH, 'utf8');
  
  // Custom parsing for student CSV because of field names with spaces
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] ? values[i].trim() : "";
    });
    return obj;
  });

  const batch = writeBatch(db);
  records.forEach(record => {
    const matricNumber = record['Matriculation Number'];
    if (!matricNumber) return;

    const studentData = {
      lasrraId: record['LASRRA ID'],
      firstName: record['First Name'],
      lastName: record['Surname'],
      otherName: record['Other Name'],
      matricNumber: matricNumber,
      sex: record['Sex'],
      gender: record['Sex'], // Alias for UI consistency
      dob: formatDate(record['Date of Birth']),
      mobilePhone: record['Mobile Phone'],
      email: record['Email Address'],
      institutionId: record['Institution'],
      campus: record['Campus'],
      programmeType: record['Programme Type'],
      facultyId: record['Faculty'],
      departmentId: record['Department'],
      enrollmentStatus: record['Enrollment Status'],
      admissionYear: "2023", // Default for the current batch
      picture: record['Photograph'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docId = matricNumber.replace(/\//g, '_');
    const docRef = doc(db, 'students', docId);
    batch.set(docRef, studentData, { merge: true });
  });

  await batch.commit();
  console.log(`Synced ${records.length} student records.`);
};

const run = async () => {
  try {
    await syncStaff();
    await syncStudents();
    console.log('Database synchronization complete.');
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
};

run();
