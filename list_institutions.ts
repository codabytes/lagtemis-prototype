import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function listInstitutions() {
  const querySnapshot = await getDocs(collection(db, 'institutions'));
  querySnapshot.forEach((doc) => {
    console.log(`${doc.id}: ${doc.data().name}`);
  });
}

listInstitutions().catch(console.error);
