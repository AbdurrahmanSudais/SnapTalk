import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

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

// UI Elements
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

// Sign Up
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

// Save Username
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

// Load posts
function loadPosts() {
  const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"));
  onSnapshot(postsQuery, (snapshot) => {
    postsContainer.innerHTML = "";
    snapshot.forEach(async (doc) => {
      const post = doc.data();
      const postId = doc.id;
      const postElement = document.createElement("div");
      postElement.classList.add("post");

      postElement.innerHTML = `
        <h4>${post.username}</h4>
        <p>${post.content}</p>
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image" />` : ""}
        <div class="like-comment">
          <button class="like-btn" onclick="toggleLike('${postId}')">Like</button>
          <span class="likes-count">${post.likes || 0} Likes</span>
          <button class="comment-btn" onclick="showComments('${postId}')">Comment</button>
          <span class="comments-count">${post.comments || 0} Comments</span>
        </div>
        <div id="comments-${postId}" class="comments-section"></div>
      `;

      postsContainer.appendChild(postElement);
    });
  });
}

// Post new content
postBtn.onclick = async () => {
  const content = postContent.value.trim();
  const user = auth.currentUser;
  if (!content) return alert("Post content cannot be empty");

  let imageUrl = null;
  if (imageInput.files.length > 0) {
    const imageRef = ref(storage, `posts/${imageInput.files[0].name}`);
    await uploadBytes(imageRef, imageInput.files[0]);
    imageUrl = await getDownloadURL(imageRef);
  }

  await addDoc(collection(db, "posts"), {
    content,
    username: user.displayName,
    timestamp: serverTimestamp(),
    imageUrl,
    userId: user.uid,
    likes: 0,
    comments: 0
  });

  postContent.value = "";
  imageInput.value = "";
};

// Toggle like
async function toggleLike(postId) {
  const postRef = doc(db, "posts", postId);
  const postSnapshot = await getDoc(postRef);
  const post = postSnapshot.data();

  const user = auth.currentUser;
  const postLikes = post.likes || 0;

  await updateDoc(postRef, {
    likes: postLikes + 1
  });
}

// Show comments section
function showComments(postId) {
  const commentsSection = document.getElementById(`comments-${postId}`);
  commentsSection.innerHTML = `
    <input type="text" id="commentInput-${postId}" placeholder="Write a comment..." />
    <button onclick="addComment('${postId}')">Post Comment</button>
  `;
}

// Add comment
async function addComment(postId) {
  const commentInput = document.getElementById(`commentInput-${postId}`);
  const commentText = commentInput.value.trim();

  if (!commentText) return alert("Comment cannot be empty");

  const user = auth.currentUser;

  await addDoc(collection(db, "posts", postId, "comments"), {
    text: commentText,
    username: user.displayName,
    timestamp: serverTimestamp()
  });

  commentInput.value = "";
}
