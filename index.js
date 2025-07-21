import {
  auth, db, storage,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile,
  doc, setDoc, getDoc, collection, addDoc,
  onSnapshot, serverTimestamp, query, orderBy,
  ref, uploadBytes, getDownloadURL
} from "./firebase.js";

// DOM Elements
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

// Sign up
signupBtn.onclick = async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    authSection.style.display = "none";
    usernameSection.style.display = "block";
  } catch (err) {
    alert(err.message);
  }
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

// Save username
saveUsernameBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  if (!username) return alert("Enter a valid username");
  const user = auth.currentUser;
  await updateProfile(user, { displayName: username });
  await setDoc(doc(db, "users", user.uid), { username });
  showHome();
};

function showHome() {
  displayName.textContent = `Hello, ${auth.currentUser.displayName}`;
  authSection.style.display = "none";
  usernameSection.style.display = "none";
  homeSection.style.display = "block";
  loadPosts();
}

// Create post
postBtn.onclick = async () => {
  const content = postContent.value.trim();
  const file = imageInput.files[0];

  if (!content && !file) return alert("Please enter content or select an image.");

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
    likes: 0,
    likedBy: []
  });

  postContent.value = "";
  imageInput.value = "";
};

// Load posts
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = "";
    snapshot.forEach((doc) => {
      const post = doc.data();
      const postId = doc.id;

      const div = document.createElement("div");
      div.className = "post";
      const date = post.createdAt?.toDate();
      const formattedTime = date ? date.toLocaleString() : "Just now";

      div.innerHTML = `
        <h4>${post.username}</h4>
        <p>${post.content}</p>
        ${post.imageUrl ? `<img src="${post.imageUrl}" />` : ""}
        <small style="color: gray;">${formattedTime}</small>
        <button class="like-btn" id="like-btn-${postId}" data-post-id="${postId}">
          👍 ${post.likes}
        </button>
      `;

      const likeBtn = div.querySelector(`#like-btn-${postId}`);
      likeBtn.addEventListener("click", () => toggleLike(postId));

      postsContainer.appendChild(div);
    });
  });
}

// Toggle like
async function toggleLike(postId) {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  const postData = postSnap.data();
  const userId = auth.currentUser.uid;

  if (!postData.likedBy.includes(userId)) {
    await setDoc(postRef, {
      likes: postData.likes + 1,
      likedBy: [...postData.likedBy, userId]
    }, { merge: true });
  } else {
    const updatedLikedBy = postData.likedBy.filter(uid => uid !== userId);
    await setDoc(postRef, {
      likes: postData.likes - 1,
      likedBy: updatedLikedBy
    }, { merge: true });
  }
}
