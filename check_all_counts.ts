import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkAll() {
  const collections = ['staff', 'students', 'institutions', 'faculties', 'departments'];
  for (const col of collections) {
    const snap = await getDocs(collection(db, col));
    console.log(`${col}: ${snap.size} documents`);
    if (col === 'institutions') {
      snap.docs.forEach(d => console.log(`  Institution: ${d.id} - ${d.data().shortName}`));
    }
  }
}

checkAll().catch(console.error);
