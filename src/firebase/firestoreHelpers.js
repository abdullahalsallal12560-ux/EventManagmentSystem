// Generic Firestore helpers reused by every entity's data file, so all
// collections behave consistently (same id pattern, same query style).

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./config";

export function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export async function createDoc(collectionName, id, data) {
  await setDoc(doc(db, collectionName, id), data);
  return { id, ...data };
}

export async function getDocById(collectionName, id) {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllDocs(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getDocsWhere(collectionName, field, operator, value) {
  const q = query(collection(db, collectionName), where(field, operator, value));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
