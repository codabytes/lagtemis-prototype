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

/**
 * Database Service Utility
 * 
 * Provides a standardized interface for interacting with Firestore.
 * Includes automatic error handling via handleFirestoreError and 
 * integrated audit logging for write operations.
 */
export const dbService = {
  /**
   * Retrieves a list of documents from a collection.
   * 
   * @param collectionName - The name of the Firestore collection
   * @param constraints - Optional array of QueryConstraints (where, orderBy, limit, etc.)
   * @returns Promise resolving to an array of typed documents with IDs
   */
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

  /**
   * Retrieves a single document by ID.
   * 
   * @param collectionName - The name of the Firestore collection
   * @param id - The unique document identifier
   * @returns Promise resolving to the typed document or null if not found
   */
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

  /**
   * Creates a new document in a collection.
   * 
   * @param collectionName - The name of the Firestore collection
   * @param data - The data object to store
   * @param auditMessage - Optional message for the audit log entry
   * @returns Promise resolving to the new document's unique ID
   */
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

  /**
   * Updates an existing document.
   * 
   * @param collectionName - The name of the Firestore collection
   * @param id - The document ID
   * @param data - Partial data object containing fields to update
   * @param auditMessage - Optional message for the audit log entry
   */
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

  /**
   * Deletes a document from a collection.
   * 
   * @param collectionName - The name of the Firestore collection
   * @param id - The document ID
   * @param auditMessage - Optional message for the audit log entry
   */
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
  },

  /**
   * Purges all documents from a collection.
   * 
   * @param collectionName - The name of the collection to purge.
   */
  async purge(collectionName: string): Promise<number> {
    try {
      const q = query(collection(db, collectionName));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      return snapshot.size;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `PURGE ${collectionName}`);
      throw error;
    }
  }
};
