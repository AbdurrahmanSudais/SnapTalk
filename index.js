 // Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC4ZImrEgbAvJ6_pPRY3Vd34p83G5y9d4Y",
  authDomain: "snaptalk-2c001.firebaseapp.com",
  projectId: "snaptalk-2c001",
  storageBucket: "snaptalk-2c001.appspot.com",
  messagingSenderId: "429592294565",
  appId: "1:429592294565:web:f86f1d84fddbc2ae41c94c"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const postBtn = document.getElementById("post-btn");
const postInput = document.getElementById("post-content");
const postsContainer = document.getElementById("posts");

signupBtn.onclick = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Signup successful!"))
    .catch(err => alert(err.message));
};

loginBtn.onclick = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Login successful!"))
    .catch(err => alert(err.message));
};

logoutBtn.onclick = () => {
  auth.signOut();
  alert("Logged out");
};

postBtn.onclick = () => {
  const content = postInput.value;
  const user = auth.currentUser;
  if (user && content) {
    db.collection("posts").add({
      uid: user.uid,
      email: user.email,
      content,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    postInput.value = "";
  } else {
    alert("Please login and enter content");
  }
};

auth.onAuthStateChanged(user => {
  if (user) {
    logoutBtn.style.display = "inline-block";
    postBtn.style.display = "inline-block";
    postInput.style.display = "block";
  } else {
    logoutBtn.style.display = "none";
    postBtn.style.display = "none";
    postInput.style.display = "none";
  }
});

db.collection("posts").orderBy("timestamp", "desc").onSnapshot(snapshot => {
  postsContainer.innerHTML = "";
  snapshot.forEach(doc => {
    const post = doc.data();
    const time = post.timestamp ? post.timestamp.toDate().toLocaleString() : "Just now";
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <div class="content">${post.content}</div>
      <div class="meta">By ${post.email} at ${time}</div>
    `;
    postsContainer.appendChild(div);
  });
});
