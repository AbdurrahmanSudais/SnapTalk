import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

import { app } from "./firebase.js";

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const authSection = document.getElementById("auth-section");
const usernameSection = document.getElementById("username-section");
const homeSection = document.getElementById("home-section");
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const usernameForm = document.getElementById("username-form");
const postForm = document.getElementById("post-form");
const postsContainer = document.getElementById("postsContainer");
const logoutBtn = document.getElementById("logout-btn");

// Sign up
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = signupForm["signup-email"].value;
  const password = signupForm["signup-password"].value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    signupForm.reset();
  } catch (error) {
    alert(error.message);
  }
});

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm["login-email"].value;
  const password = loginForm["login-password"].value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
  } catch (error) {
    alert(error.message);
  }
});

// Username setup
usernameForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = usernameForm["username"].value;
  try {
    await updateProfile(auth.currentUser, { displayName: username });
    usernameSection.style.display = "none";
    homeSection.style.display = "block";
  } catch (err) {
    alert(err.message);
  }
});

// Post creation
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = postForm["post-content"].value;
  const imageFile = postForm["post-image"].files[0];
  let imageUrl = "";

  if (imageFile) {
    const imageRef = ref(storage, `images/${Date.now()}-${imageFile.name}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    imageUrl = await getDownloadURL(snapshot.ref);
  }

  const user = auth.currentUser;
  if (user) {
    await addDoc(collection(db, "posts"), {
      content,
      imageUrl,
      createdAt: new Date(),
      author: user.displayName,
      likes: [],
    });
    postForm.reset();
  }
});

// Auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (!user.displayName) {
      authSection.style.display = "none";
      usernameSection.style.display = "block";
      homeSection.style.display = "none";
    } else {
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

// Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// Load & display posts
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const postId = docSnap.id;
      const currentUser = auth.currentUser?.uid;

      const postDiv = document.createElement("div");
      postDiv.className = "post";

      const author = document.createElement("h3");
      author.textContent = post.author;

      const content = document.createElement("p");
      content.textContent = post.content;

      postDiv.appendChild(author);
      postDiv.appendChild(content);

      if (post.imageUrl) {
        const img = document.createElement("img");
        img.src = post.imageUrl;
        postDiv.appendChild(img);
      }

      // Like button and count
      const likeBtn = document.createElement("button");
      likeBtn.className = "like-btn";
      const hasLiked = post.likes.includes(currentUser);

      likeBtn.innerHTML = hasLiked ? "❤️" : "👍";
      if (hasLiked) likeBtn.classList.add("liked");

      const likeCount = document.createElement("span");
      likeCount.className = "like-count";
      likeCount.textContent = post.likes.length;

      likeBtn.addEventListener("click", async () => {
        const postRef = doc(db, "posts", postId);
        if (!hasLiked) {
          await updateDoc(postRef, {
            likes: arrayUnion(currentUser),
          });
        } else {
          await updateDoc(postRef, {
            likes: arrayRemove(currentUser),
          });
        }
      });

      postDiv.appendChild(likeBtn);
      postDiv.appendChild(likeCount);
      postsContainer.appendChild(postDiv);
    });
  });
        }
