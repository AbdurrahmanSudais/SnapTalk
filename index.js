import { auth, db, storage } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// DOM Elements
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const logoutBtn = document.getElementById("logout-btn");
const postForm = document.getElementById("post-form");
const postsContainer = document.getElementById("posts");

// Authentication
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.body.classList.add("logged-in");
    loadPosts();
  } else {
    document.body.classList.remove("logged-in");
    postsContainer.innerHTML = '';
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target["register-email"].value;
  const password = e.target["register-password"].value;
  const username = e.target["register-username"].value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: username
    });
    alert("Registered successfully!");
  } catch (error) {
    alert(error.message);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target["login-email"].value;
  const password = e.target["login-password"].value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in!");
  } catch (error) {
    alert(error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  alert("Logged out!");
});

// Post Submission
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = e.target["post-text"].value;
  const file = e.target["post-image"].files[0];
  const user = auth.currentUser;

  if (!user) return;

  let imageUrl = "";
  if (file) {
    const imageRef = ref(storage, `images/${Date.now()}_${file.name}`);
    await uploadBytes(imageRef, file);
    imageUrl = await getDownloadURL(imageRef);
  }

  await addDoc(collection(db, "posts"), {
    text,
    imageUrl,
    username: user.displayName,
    uid: user.uid,
    likes: [],
    timestamp: serverTimestamp()
  });

  e.target.reset();
});

// Load and render posts
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

  onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const postId = docSnap.id;
      const isLiked = post.likes.includes(auth.currentUser.uid);

      const postEl = document.createElement("div");
      postEl.classList.add("post");

      postEl.innerHTML = `
        <h3>${post.username}</h3>
        <p>${post.text}</p>
        ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image">` : ""}
        <button class="like-btn" data-id="${postId}">
          ${isLiked ? '❤️' : '👍'}
        </button>
        <span class="like-count">${post.likes.length} like${post.likes.length !== 1 ? "s" : ""}</span>
      `;

      postsContainer.appendChild(postEl);
    });

    attachLikeHandlers();
  });
}

function attachLikeHandlers() {
  const likeButtons = document.querySelectorAll(".like-btn");

  likeButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postId = btn.dataset.id;
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      const post = postSnap.data();
      const uid = auth.currentUser.uid;

      const isLiked = post.likes.includes(uid);

      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(uid)
        });
      }
    });
  });
}
