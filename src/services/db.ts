import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  QueryConstraint,
  DocumentData,
  WithFieldValue
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, logAudit } from '../firebase';

export const dbService = {
  async list<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      return [];
    }
  },

  async get<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as T;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${id}`);
      return null;
    }
  },

  async create<T extends DocumentData>(collectionName: string, data: WithFieldValue<T>, auditMessage?: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      if (auditMessage) {
        await logAudit('CREATE', collectionName, docRef.id, auditMessage);
      }
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionName);
      throw error;
    }
  },

  async update<T extends DocumentData>(collectionName: string, id: string, data: Partial<T>, auditMessage?: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data as any);
      if (auditMessage) {
        await logAudit('UPDATE', collectionName, id, auditMessage);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${id}`);
      throw error;
    }
  },

  async delete(collectionName: string, id: string, auditMessage?: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      if (auditMessage) {
        await logAudit('DELETE', collectionName, id, auditMessage);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
      throw error;
    }
  }
};
