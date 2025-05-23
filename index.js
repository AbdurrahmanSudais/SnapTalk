import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyApKEx-bYKOqB80mlWr53up9iyIiCzv2aI",
  authDomain: "snaptalk-b8369.firebaseapp.com",
  projectId: "snaptalk-b8369",
  storageBucket: "snaptalk-b8369.appspot.com",
  messagingSenderId: "442098306088",
  appId: "1:442098306088:web:280c8615656b8e4d3af91d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Elements
const authSection = document.getElementById("auth-section");
const usernameSection = document.getElementById("username-section");
const homeSection = document.getElementById("home-section");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const usernameInput = document.getElementById("username");
const saveUsernameBtn = document.getElementById("saveUsernameBtn");

const displayName = document.getElementById("displayName");
const postContent = document.getElementById("postContent");
const postBtn = document.getElementById("postBtn");
const imageInput = document.getElementById("imageInput");
const postsContainer = document.getElementById("postsContainer");

let userId = "";

// Sign up
signupBtn.onclick = async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    authSection.style.display = "none";
    usernameSection.style.display = "block";
  } catch (err) {
    alert(err.message);
  }
};

// Save username
saveUsernameBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  if (!username) return alert("Enter a valid username");
  const user = auth.currentUser;
  await updateProfile(user, { displayName: username });
  await setDoc(doc(db, "users", user.uid), { username });
  showHome();
};

// Login
loginBtn.onclick = async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert(err.message);
  }
};

// Logout
logoutBtn.onclick = () => signOut(auth);

// Auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId = user.uid;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (user.displayName || userDoc.exists()) {
      showHome();
    } else {
      authSection.style.display = "none";
      usernameSection.style.display = "block";
    }
  } else {
    authSection.style.display = "block";
    usernameSection.style.display = "none";
    homeSection.style.display = "none";
  }
});

// Show home
function showHome() {
  authSection.style.display = "none";
  usernameSection.style.display = "none";
  homeSection.style.display = "block";
  displayName.textContent = auth.currentUser.displayName;
  loadPosts();
}

// Post a new message
postBtn.onclick = async () => {
  const text = postContent.value.trim();
  const file = imageInput.files[0];
  if (!text && !file) return;

  let imageUrl = "";
  if (file) {
    const storageRef = ref(storage, `images/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    imageUrl = await getDownloadURL(storageRef);
  }

  await addDoc(collection(db, "posts"), {
    text,
    imageUrl,
    userId: auth.currentUser.uid,
    username: auth.currentUser.displayName,
    timestamp: serverTimestamp()
  });

  postContent.value = "";
  imageInput.value = "";
};

// Load posts
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
  onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = "";
    snapshot.forEach((doc) => {
      const post = doc.data();
      const div = document.createElement("div");
      div.className = "post";
      const timeAgo = formatTimeAgo(post.timestamp?.toDate?.());
      div.innerHTML = `
        <strong class="post-username">${post.username || "Unknown"}</strong><br>
        <p>${post.text}</p>
        ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image">` : ""}
        <small class="time-text">${timeAgo}</small>
      `;
      postsContainer.appendChild(div);
    });
  });
}

// Format time ago
function formatTimeAgo(date) {
  if (!date) return "just now";
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 120) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
  }
