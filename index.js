// Initialize Firebase with your actual details
const firebaseConfig = {
  apiKey: "AIzaSyDXMXZrrYhZ3UUs4lxOS1ryJocA2ahvA3o",
  authDomain: "snaptalk-bb480.firebaseapp.com",
  projectId: "snaptalk-bb480",
  storageBucket: "snaptalk-bb480.appspot.com",
  messagingSenderId: "919072659794",
  appId: "1:919072659794:web:2b8e86627073f3f3ff2a20"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const app = document.getElementById('app');

function renderLogin() {
  app.innerHTML = `
    <h2 class="app-title">SnapTalk</h2>
    <div class="form">
      <input type="email" id="login-email" placeholder="Email" />
      <input type="password" id="login-password" placeholder="Password" />
      <button onclick="login()">Login</button>
      <div class="link" onclick="renderSignup()">Create account</div>
      <div class="link" onclick="resetPassword()">Forgot password?</div>
    </div>
  `;
}

function renderSignup() {
  app.innerHTML = `
    <h2 class="app-title">Sign Up</h2>
    <div class="form">
      <input type="email" id="signup-email" placeholder="Email" />
      <input type="password" id="signup-password" placeholder="Password" />
      <button onclick="signup()">Sign Up</button>
      <div class="link" onclick="renderLogin()">Already have an account?</div>
    </div>
  `;
}

function renderHome(user) {
  app.innerHTML = `
    <div class="top-bar">
      <span>Welcome, ${user.email}</span>
      <button onclick="logout()">Logout</button>
    </div>
    <div class="post-creator">
      <textarea id="post-text" placeholder="What's on your mind?"></textarea>
      <button onclick="createPost()">Post</button>
    </div>
    <div class="feed" id="feed"></div>
  `;
  loadPosts();
}

function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => renderHome(auth.currentUser))
    .catch(err => alert(err.message));
}

function signup() {
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => renderHome(auth.currentUser))
    .catch(err => alert(err.message));
}

function logout() {
  auth.signOut().then(renderLogin);
}

function resetPassword() {
  const email = prompt("Enter your email to receive reset link:");
  if (email) {
    auth.sendPasswordResetEmail(email)
      .then(() => alert("Reset link sent to your email."))
      .catch(err => alert(err.message));
  }
}

function createPost() {
  const text = document.getElementById('post-text').value.trim();
  if (text === "") return;

  db.collection("posts").add({
    text,
    email: auth.currentUser.email,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById('post-text').value = '';
    loadPosts();
  });
}

function loadPosts() {
  const feed = document.getElementById('feed');
  feed.innerHTML = `<p>Loading posts...</p>`;

  db.collection("posts").orderBy("timestamp", "desc").get()
    .then(snapshot => {
      feed.innerHTML = "";
      snapshot.forEach(doc => {
        const post = doc.data();
        const time = post.timestamp?.toDate().toLocaleString() || 'Just now';
        const html = `
          <div class="post">
            <h3>${post.email}</h3>
            <p>${post.text}</p>
            <small>${time}</small>
          </div>
        `;
        feed.innerHTML += html;
      });
    });
}

auth.onAuthStateChanged(user => {
  if (user) {
    renderHome(user);
  } else {
    renderLogin();
  }
});
