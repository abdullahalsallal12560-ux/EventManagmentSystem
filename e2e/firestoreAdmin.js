// Direct Firestore access for E2E test setup/teardown (Node context, same
// technique as scripts/exportUsers.js). Requires Firebase env vars to be
// present in process.env when the Playwright test process starts — pass
// --env-file=.env to node when invoking the Playwright CLI.
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig, "e2e-admin");
export const db = getFirestore(app);

export async function findEventByTitle(title) {
  const q = query(collection(db, "events"), where("title", "==", title));
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function setEventMaxAttendees(eventId, value) {
  await updateDoc(doc(db, "events", eventId), { maxAttendees: value });
}
