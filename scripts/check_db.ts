
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkCollections() {
  const collections = ['institutions', 'leadership_tenures', 'users'];
  for (const col of collections) {
    try {
      const snap = await getDocs(query(collection(db, col), limit(1)));
      console.log(`Collection ${col}: ${snap.empty ? 'Empty' : 'Has data'}`);
    } catch (err: any) {
      console.error(`Error checking ${col}: ${err.message}`);
    }
  }
  process.exit(0);
}

checkCollections();
