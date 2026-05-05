import { db } from './firebase';
import { dbService } from './services/db';
import { collection, writeBatch, doc } from 'firebase/firestore';
import staffSeedData from './data/staff_data.json';

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  const year = parts[2];
  return `${year}-${month}-${day}`;
};

export const seedStaffData = async () => {
  console.log('Starting staff purge and seeding...');
  
  try {
    // PURGE FIRST
    console.log('Purging existing staff records...');
    const purgedCount = await dbService.purge('staff');
    console.log(`Staff collection purged (${purgedCount} records removed).`);

    let successCount = 0;

    // Use batches for efficiency (Firestore limit is 500 per batch)
    // We have 100 records, so one batch is enough, but we'll use a loop for safety/scalability
    const CHUNK_SIZE = 100;
    for (let i = 0; i < staffSeedData.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      const chunk = staffSeedData.slice(i, i + CHUNK_SIZE);
      
      chunk.forEach((item: any) => {
        // Validation and formatting
        const staffMember = {
          ...item,
          dob: formatDate(item.dob),
          dateOfFirstAppointment: formatDate(item.dateOfFirstAppointment),
          dateOfConfirmation: formatDate(item.dateOfFirstAppointment),
          dateOfLastPromotion: formatDate(item.dateOfFirstAppointment),
          otherName: "",
          specialization: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Ensure these fields exist even if empty in CSV
          institutionId: item.institutionId || "",
          facultyId: item.facultyId || "",
          departmentId: item.departmentId || "",
        };

        // Use staffId as document ID to ensure uniqueness and prevent duplicates
        // We replace '/' with '_' because doc IDs with slashes can sometimes be tricky in deep paths
        const docId = staffMember.staffId.replace(/\//g, '_');
        const docRef = doc(db, 'staff', docId);
        batch.set(docRef, staffMember);
      });

      await batch.commit();
      successCount += chunk.length;
      console.log(`Progress: ${successCount} / ${staffSeedData.length}`);
    }

    console.log(`Seeding complete. Success: ${successCount}`);
    return { successCount, errorCount: 0 };
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    throw error;
  }
};

// Execution logic for running via tsx
if (typeof process !== 'undefined' && process.env.TSX_RUNNING === 'true') {
   seedStaffData()
    .then(() => {
      console.log('Seeding process finished successfully.');
      process.exit(0);
    })
    .catch(err => { 
      console.error('Seeding failed:', err); 
      process.exit(1); 
    });
}
