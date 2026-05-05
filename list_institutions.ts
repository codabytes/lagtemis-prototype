import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function listInstitutions() {
  const instSnap = await getDocs(collection(db, 'institutions'));
  console.log('Institutions found:', instSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
}

listInstitutions().catch(console.error);
