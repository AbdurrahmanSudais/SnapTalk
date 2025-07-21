 // index.js
// Import Firebase services from firebase.js
import {
  auth, db, storage,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile,
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
  ref, uploadBytes, getDownloadURL
} from './firebase.js';

// DOM elements
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
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const postsContainer = document.getElementById("postsContainer");
const displayName = document.getElementById("displayName");
const authMessage = document.getElementById("auth-message");
const usernameMessage = document.getElementById("username-message");
const postMessage = document.getElementById("post-message");

let selectedImage = null;

// Utility functions
function showMessage(element, message, isError = false) {
  element.innerHTML = `<div class="${isError ? 'error-message' : 'success-message'}">${message}</div>`;
  setTimeout(() => element.innerHTML = '', 3000);
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return `${minutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (!user.displayName) {
      authSection.classList.add('hidden');
      usernameSection.classList.remove('hidden');
      homeSection.classList.add('hidden');
    } else {
      displayName.textContent = `Welcome, ${user.displayName}!`;
      authSection.classList.add('hidden');
      usernameSection.classList.add('hidden');
      homeSection.classList.remove('hidden');
      loadPosts();
    }
  } else {
    authSection.classList.remove('hidden');
    usernameSection.classList.add('hidden');
    homeSection.classList.add('hidden');
  }
});

// Image preview
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedImage = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    selectedImage = null;
    imagePreview.style.display = 'none';
  }
});

// Sign up
signupBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !password) {
    showMessage(authMessage, 'Please fill in all fields', true);
    return;
  }
  
  if (password.length < 6) {
    showMessage(authMessage, 'Password must be at least 6 characters', true);
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = 'Creating account...';

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    showMessage(authMessage, 'Account created successfully!');
    emailInput.value = '';
    passwordInput.value = '';
  } catch (error) {
    showMessage(authMessage, error.message, true);
  } finally {
    signupBtn.disabled = false;
    signupBtn.textContent = 'Sign Up';
  }
});

// Login
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !password) {
    showMessage(authMessage, 'Please fill in all fields', true);
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage(authMessage, 'Logged in successfully!');
    emailInput.value = '';
    passwordInput.value = '';
  } catch (error) {
    showMessage(authMessage, error.message, true);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
});

// Save username
saveUsernameBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  
  if (!username) {
    showMessage(usernameMessage, 'Please enter a username', true);
    return;
  }
  
  if (username.length < 2) {
    showMessage(usernameMessage, 'Username must be at least 2 characters', true);
    return;
  }

  saveUsernameBtn.disabled = true;
  saveUsernameBtn.textContent = 'Saving...';

  try {
    await updateProfile(auth.currentUser, { displayName: username });
    showMessage(usernameMessage, 'Username saved!');
    usernameInput.value = '';
  } catch (error) {
    showMessage(usernameMessage, error.message, true);
  } finally {
    saveUsernameBtn.disabled = false;
    saveUsernameBtn.textContent = 'Save';
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  signOut(auth);
});

// Post content
postBtn.addEventListener('click', async () => {
  const content = postContent.value.trim();
  const user = auth.currentUser;
  
  if (!content && !selectedImage) {
    showMessage(postMessage, 'Please write something or add an image', true);
    return;
  }

  postBtn.disabled = true;
  postBtn.textContent = 'Posting...';

  try {
    let imageUrl = null;
    
    // Upload image if selected
    if (selectedImage) {
      const imageRef = ref(storage, `posts/${Date.now()}_${selectedImage.name}`);
      const snapshot = await uploadBytes(imageRef, selectedImage);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    // Add post to Firestore
    await addDoc(collection(db, "posts"), {
      user: user.displayName,
      userId: user.uid,
      content: content || '',
      imageUrl: imageUrl,
      createdAt: serverTimestamp()
    });

    // Clear form
    postContent.value = '';
    imageInput.value = '';
    imagePreview.style.display = 'none';
    selectedImage = null;
    
    showMessage(postMessage, 'Posted successfully!');
  } catch (error) {
    showMessage(postMessage, error.message, true);
  } finally {
    postBtn.disabled = false;
    postBtn.textContent = 'Post';
  }
});

// Load posts
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  
  onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = '';
    
    if (snapshot.empty) {
      postsContainer.innerHTML = '<div class="loading">No posts yet. Be the first to post!</div>';
      return;
    }
    
    snapshot.forEach((doc) => {
      const post = doc.data();
      const postDiv = document.createElement("div");
      postDiv.className = "post";
      
      postDiv.innerHTML = `
        <div class="post-header">
          <span class="post-user">${post.user || 'Anonymous'}</span>
          <span class="post-time">${formatTime(post.createdAt)}</span>
        </div>
        ${post.content ? `<div class="post-content">${post.content}</div>` : ''}
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" loading="lazy">` : ''}
      `;
      
      postsContainer.appendChild(postDiv);
    });
  }, (error) => {
    console.error('Error loading posts:', error);
    postsContainer.innerHTML = '<div class="loading">Error loading posts. Please try again.</div>';
  });
}

// Allow Enter key to submit forms
emailInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

usernameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') saveUsernameBtn.click();
});
