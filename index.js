import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, collection, onSnapshot, serverTimestamp, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

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

let userId = "";

// Time ago function
const timeAgo = (timestamp) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  const minutes = 60;
  const hours = 60 * minutes;
  const days = 24 * hours;
  const months = 30 * days;
  const years = 12 * months;

  if (diffInSeconds < minutes) {
    return "just now";
  } else if (diffInSeconds < hours) {
    const diffMinutes = Math.floor(diffInSeconds / minutes);
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < days) {
    const diffHours = Math.floor(diffInSeconds / hours);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < months) {
    const diffDays = Math.floor(diffInSeconds / days);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < years) {
    const diffMonths = Math.floor(diffInSeconds / months);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  } else {
    const diffYears = Math.floor(diffInSeconds / years);
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  }
};

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

// Show home section after login
const showHome = () => {
  const user = auth.currentUser;
  displayName.textContent = `Hello, ${user.displayName}`;
  authSection.style.display = "none";
  usernameSection.style.display = "none";
  homeSection.style.display = "block";
  loadPosts();
};

// Create post
postBtn.onclick = async () => {
  const postText = postContent.value.trim();
  if (!postText) return alert("Post content can't be empty");

  let postData = {
    text: postText,
    timestamp: serverTimestamp(),
    userId: userId
  };

  if (imageInput.files[0]) {
    const file = imageInput.files[0];
    const storageRef = ref(storage, `posts/${file.name}`);
    await uploadBytes(storageRef, file);
    const imageURL = await getDownloadURL(storageRef);
    postData.image = imageURL;
  }

  await addDoc(collection(db, "posts"), postData);
  postContent.value = '';
  imageInput.value = '';
};

// Load posts from Firestore
const loadPosts = async () => {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("timestamp", "desc"));
  onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = "";
    snapshot.forEach(doc => {
      const post = doc.data();
      const postElement = document.createElement("div");
      postElement.classList.add("post");

      // Format timestamp
      const timestamp = post.timestamp ? new Date(post.timestamp.seconds * 1000) : new Date();
      const timeAgoText = timeAgo(timestamp);

      postElement.innerHTML = `
        <p>${post.text}</p>
        ${post.image ? `<img src="${post.image}" alt="Post Image" />` : ''}
        <p><small>Posted ${timeAgoText}</small></p>
      `;
      postsContainer.appendChild(postElement);
    });
  });
};
