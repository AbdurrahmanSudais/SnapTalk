import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase config
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

// DOM
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

const postBtn = document.getElementById("postBtn");
const postContent = document.getElementById("postContent");
const postsContainer = document.getElementById("postsContainer");
const displayName = document.getElementById("displayName");

// Auth Listeners
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (!user.displayName) {
      authSection.style.display = "none";
      usernameSection.style.display = "block";
      homeSection.style.display = "none";
    } else {
      displayName.innerText = user.displayName;
      authSection.style.display = "none";
      usernameSection.style.display = "none";
      homeSection.style.display = "block";
      loadPosts();
    }
  } else {
    authSection.style.display = "block";
    usernameSection.style.display = "none";
    homeSection.style.display = "none";
  }
});

// Register
signupBtn.onclick = () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => alert("Sign up successful!"))
    .catch((err) => alert(err.message));
};

// Login
loginBtn.onclick = () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => console.log("Logged in!"))
    .catch((err) => alert(err.message));
};

// Save Username
saveUsernameBtn.onclick = () => {
  const username = usernameInput.value;
  updateProfile(auth.currentUser, { displayName: username }).then(() => {
    usernameSection.style.display = "none";
    homeSection.style.display = "block";
    displayName.innerText = username;
    loadPosts();
  });
};

// Logout
logoutBtn.onclick = () => {
  signOut(auth);
};

// Post Content
postBtn.onclick = async () => {
  const content = postContent.value;
  const user = auth.currentUser;
  if (content.trim()) {
    await addDoc(collection(db, "posts"), {
      user: user.displayName,
      content,
      createdAt: Date.now()
    });
    postContent.value = "";
  }
};

// Load Posts
function loadPosts() {
  postsContainer.innerHTML = "Loading posts...";
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = "";
    snapshot.forEach((doc) => {
      const post = doc.data();
      const div = document.createElement("div");
      div.innerHTML = `<strong>${post.user}</strong>: ${post.content}`;
      postsContainer.appendChild(div);
    });
  });
}
