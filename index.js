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
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// 🔥 Replace this with your Firebase config:
const firebaseConfig = {
  apiKey: "AIzaSyApKEx-bYKOqB80mlWr53up9iyIiCzv2aI",
  authDomain: "snaptalk-b8369.firebaseapp.com",
  projectId: "snaptalk-b8369",
  storageBucket: "snaptalk-b8369.appspot.com",
  messagingSenderId: "442098306088",
  appId: "1:442098306088:web:280c8615656b8e4d3af91d"
};

// Init services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM elements
const authSection = document.getElementById("auth-section");
const usernameSection = document.getElementById("username-section");
const homeSection = document.getElementById("home-section");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameInput = document.getElementById("username");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const saveUsernameBtn = document.getElementById("saveUsernameBtn");
const logoutBtn = document.getElementById("logoutBtn");
const postBtn = document.getElementById("postBtn");
const postContent = document.getElementById("postContent");
const postsContainer = document.getElementById("postsContainer");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");

// Auth functions
signupBtn.onclick = () => {
  createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => {
      authSection.classList.add("hidden");
      usernameSection.classList.remove("hidden");
    }).catch(err => alert(err.message));
};

loginBtn.onclick = () => {
  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .catch(err => alert(err.message));
};

saveUsernameBtn.onclick = () => {
  const username = usernameInput.value.trim();
  if (!username) return alert("Enter a username");
  updateProfile(auth.currentUser, { displayName: username })
    .then(() => {
      usernameSection.classList.add("hidden");
      homeSection.classList.remove("hidden");
      loadPosts();
    });
};

logoutBtn.onclick = () => {
  signOut(auth);
};

// Handle auth state
onAuthStateChanged(auth, user => {
  if (user) {
    if (user.displayName) {
      document.getElementById("displayName").textContent = "SnapTalk - " + user.displayName;
      authSection.classList.add("hidden");
      homeSection.classList.remove("hidden");
      loadPosts();
    } else {
      authSection.classList.add("hidden");
      usernameSection.classList.remove("hidden");
    }
  } else {
    authSection.classList.remove("hidden");
    usernameSection.classList.add("hidden");
    homeSection.classList.add("hidden");
  }
});

// Posting
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

postBtn.onclick = async () => {
  const text = postContent.value;
  const file = imageInput.files[0];
  let imageUrl = "";

  if (file) {
    const storageRef = ref(storage, `images/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    imageUrl = await getDownloadURL(storageRef);
  }

  if (text || imageUrl) {
    await addDoc(collection(db, "posts"), {
      text,
      imageUrl,
      user: auth.currentUser.displayName || "Anonymous",
      timestamp: new Date()
    });

    postContent.value = "";
    imageInput.value = "";
    imagePreview.style.display = "none";
  }
};

function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
  onSnapshot(q, snapshot => {
    postsContainer.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `<strong>${data.user}</strong><p>${data.text || ""}</p>${
        data.imageUrl ? `<img src="${data.imageUrl}" />` : ""
      }`;
      postsContainer.appendChild(div);
    });
  });
}
