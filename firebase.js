// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAwa5htpDSaGtEO9P76g9WvQZ0AN9pmT6A",
  authDomain: "snaptalk-e2507.firebaseapp.com",
  projectId: "snaptalk-e2507",
  storageBucket: "snaptalk-e2507.firebasestorage.app",
  messagingSenderId: "990075195902",
  appId: "1:990075195902:web:e14f552e75a47ec55370af"
};
// Init Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Also export needed functions
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

export {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

export {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
