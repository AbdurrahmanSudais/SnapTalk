 // Import the necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, collection, onSnapshot, serverTimestamp, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApKEx-bYKOqB80mlWr53up9iyIiCzv2aI",
  authDomain: "snaptalk-b8369.firebaseapp.com",
  projectId: "snaptalk-b8369",
  storageBucket: "snaptalk-b8369.appspot.com",
  messagingSenderId: "442098306088",
  appId: "1:442098306088:web:280c8615656b8e4d3af91d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get references to the Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export Firebase services to use in other files
export { auth, db, storage, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, doc, setDoc, addDoc, collection, onSnapshot, serverTimestamp, query, orderBy, getDoc, ref, uploadBytes, getDownloadURL };
