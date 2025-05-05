import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_iPYTJb5_TxzZguDdZbhyrB2tJp43Fqs",
  authDomain: "snaptalk-v2.firebaseapp.com",
  projectId: "snaptalk-v2",
  storageBucket: "snaptalk-v2.appspot.com",
  messagingSenderId: "66938774909",
  appId: "1:66938774909:web:db72a906f53e4a0845b8cc",
  measurementId: "G-KX4JWGVZFC",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const postForm = document.getElementById("postForm");
const postsDiv = document.getElementById("posts");
const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");
const userPic = document.getElementById("userPic");
const userName = document.getElementById("userName");

loginBtn.onclick = () => signInWithPopup(auth, provider);

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.style.display = "none";
    userInfo.style.display = "flex";
    userPic.src = user.photoURL;
    userName.innerText = user.displayName;
    postForm.style.display = "block";
  } else {
    loginBtn.style.display = "block";
    userInfo.style.display = "none";
    postForm.style.display = "none";
  }
});

postForm.onsubmit = async (e) => {
  e.preventDefault();
  const text = postForm.text.value.trim();
  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    uid: auth.currentUser.uid,
    name: auth.currentUser.displayName,
    photo: auth.currentUser.photoURL,
    time: serverTimestamp(),
    likes: [],
  });

  postForm.reset();
};

const loadPosts = () => {
  const q = query(collection(db, "posts"), orderBy("time", "desc"));

  onSnapshot(q, (snapshot) => {
    postsDiv.innerHTML = "";
    snapshot.forEach((doc) => {
      const post = doc.data();
      const postId = doc.id;
      const userId = auth.currentUser?.uid;
      const hasLiked = post.likes?.includes(userId);
      const emoji = hasLiked ? "❤️" : "👍";
      const emojiStyle = `font-size: 20px; cursor: pointer; transition: transform 0.2s ease; ${hasLiked ? "color: red;" : "color: gray;"}`;
      const emojiSpan = `<span class="emoji" data-id="${postId}" style="${emojiStyle}">${emoji}</span>`;

      const postHTML = `
        <div class="bg-white p-4 rounded shadow mt-4">
          <div class="flex items-center mb-2">
            <img src="${post.photo}" class="w-8 h-8 rounded-full mr-2">
            <h2 class="font-semibold text-sm">${post.name}</h2>
          </div>
          <p class="text-gray-800 text-sm">${post.text}</p>
          <div class="mt-2 flex items-center gap-2">
            ${emojiSpan}
            <span class="text-sm text-gray-600">${post.likes?.length || 0}</span>
          </div>
        </div>
      `;
      postsDiv.innerHTML += postHTML;
    });

    attachLikeListeners();
  });
};

const attachLikeListeners = () => {
  document.querySelectorAll(".emoji").forEach((emoji) => {
    emoji.onclick = async () => {
      const postId = emoji.getAttribute("data-id");
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      const postData = postSnap.data();
      const userId = auth.currentUser?.uid;

      if (!userId || !postData) return;

      const hasLiked = postData.likes?.includes(userId);

      // Animate
      emoji.style.transform = "scale(1.4)";
      setTimeout(() => emoji.style.transform = "scale(1)", 200);

      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
        });
      }
    };
  });
};

loadPosts();
