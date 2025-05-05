// SnapTalk Firebase Config (Your actual details)
const firebaseConfig = {
  apiKey: "AIzaSyBumAVQVTn4BZlFQVAu04uulOAzQ-_wU6E",
  authDomain: "snaptalk-1ef56.firebaseapp.com",
  projectId: "snaptalk-1ef56",
  storageBucket: "snaptalk-1ef56.appspot.com",
  messagingSenderId: "703116646741",
  appId: "1:703116646741:web:e0fa0e8a3a270d399aab5e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elements
const loginForm = document.getElementById("loginForm");
const signUpForm = document.getElementById("signUpForm");
const logoutBtn = document.getElementById("logoutBtn");
const postForm = document.getElementById("postForm");
const postList = document.getElementById("postList");
const forgotPass = document.getElementById("forgotPass");

// Sign Up
if (signUpForm) {
  signUpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = signUpForm["signUpEmail"].value;
    const password = signUpForm["signUpPassword"].value;

    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        alert("Signed up successfully!");
        window.location.href = "home.html";
      })
      .catch(error => alert(error.message));
  });
}

// Login
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginForm["loginEmail"].value;
    const password = loginForm["loginPassword"].value;

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        alert("Logged in!");
        window.location.href = "home.html";
      })
      .catch(error => alert(error.message));
  });
}

// Forgot Password
if (forgotPass) {
  forgotPass.addEventListener("click", () => {
    const email = prompt("Enter your email for password reset:");
    if (email) {
      auth.sendPasswordResetEmail(email)
        .then(() => alert("Password reset link sent!"))
        .catch(error => alert(error.message));
    }
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    auth.signOut()
      .then(() => {
        alert("Logged out!");
        window.location.href = "index.html";
      });
  });
}

// Post Submission
if (postForm) {
  postForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const content = postForm["postText"].value;

    const user = auth.currentUser;
    if (user) {
      db.collection("posts").add({
        uid: user.uid,
        content: content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        postForm.reset();
      }).catch(err => alert("Error posting: " + err));
    }
  });
}

// Load Posts
function loadPosts() {
  db.collection("posts").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    postList.innerHTML = "";
    snapshot.forEach(doc => {
      const post = doc.data();
      const date = post.createdAt?.toDate().toLocaleString() || "Just now";

      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `
        <p>${post.content}</p>
        <small>Posted: ${date}</small>
      `;
      postList.appendChild(div);
    });
  });
}

auth.onAuthStateChanged(user => {
  if (user && postList) {
    loadPosts();
  }
});
