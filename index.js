const firebaseConfig = {
  apiKey: "AIzaSyBumAVQVTn4BZlFQVAu04uulOAzQ-_wU6E",
  authDomain: "snaptalk-1ef56.firebaseapp.com",
  projectId: "snaptalk-1ef56",
  storageBucket: "snaptalk-1ef56.appspot.com",
  messagingSenderId: "703116646741",
  appId: "1:703116646741:web:e0fa0e8a3a270d399aab5e"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// LOGIN
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login successful!");
    })
    .catch(err => alert(err.message));
});

// SIGNUP
document.getElementById("signUpForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("signUpEmail").value;
  const password = document.getElementById("signUpPassword").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Account created!");
    })
    .catch(err => alert(err.message));
});

// FORGOT PASSWORD
document.getElementById("forgotPass").addEventListener("click", () => {
  const email = prompt("Enter your email for password reset:");
  if (email) {
    auth.sendPasswordResetEmail(email)
      .then(() => alert("Password reset sent!"))
      .catch(err => alert(err.message));
  }
});
