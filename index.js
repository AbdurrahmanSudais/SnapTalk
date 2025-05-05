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
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

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

saveUsernameBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  if (!username) return alert("Enter a valid username");
  const user = auth.currentUser;
  await updateProfile(user, { displayName: username });
  await setDoc(doc(db, "users", user.uid), { username });
  showHome();
};

loginBtn.onclick = async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert(err.message);
  }
};

logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
  if (user) {
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

function showHome() {
  displayName.textContent = `Hello, ${auth.currentUser.displayName}`;
  authSection.style.display = "none";
  usernameSection.style.display = "none";
  homeSection.style.display = "block";
  loadPosts();
}

postBtn.onclick = async () => {
  const content = postContent.value.trim();
  const file = imageInput.files[0];
  if (!content && !file) return alert("Enter content or choose an image");

  let imageUrl = "";
  if (file) {
    const storageRef = ref(storage, `posts/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    imageUrl = await getDownloadURL(storageRef);
  }

  await addDoc(collection(db, "posts"), {
    content,
    imageUrl,
    username: auth.currentUser.displayName,
    createdAt: serverTimestamp(),
    likes: 0
  });

  postContent.value = "";
  imageInput.value = "";
};

function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const div = document.createElement("div");
      div.className = "post";
      const date = post.createdAt?.toDate();
      const formattedTime = date ? date.toLocaleString() : "Just now";

      div.innerHTML = `
        <h4>${post.username}</h4>
        <p>${post.content}</p>
        ${post.imageUrl ? `<img src="${post.imageUrl}" />` : ""}
        <div style="margin-top: 0.5rem;">
          <button class="like-btn" data-id="${docSnap.id}" style="background:#e91e63; color:white;">❤️ ${post.likes || 0}</button>
        </div>
        <small style="color: gray;">${formattedTime}</small>
      `;
      postsContainer.appendChild(div);
    });

    // Attach like button functionality
    document.querySelectorAll(".like-btn").forEach((btn) => {
      btn.onclick = async () => {
        const postId = btn.getAttribute("data-id");
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
          likes: increment(1)
        });
      };
    });
  });
}
