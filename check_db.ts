import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const staffSnap = await getDocs(collection(db, 'staff'));
  console.log('Total Staff in DB:', staffSnap.size);
  
  const staffWithLasrra = staffSnap.docs.filter(d => d.data().lasrraId);
  console.log('Staff with LASRRA ID:', staffWithLasrra.length);
  
  const instIds = new Set(staffSnap.docs.map(d => d.data().institutionId));
  console.log('Unique Institution IDs in Staff records:', Array.from(instIds));
}

check().catch(console.error);
