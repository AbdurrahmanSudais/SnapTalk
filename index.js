// Firebase Configuration (update with your credentials)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM elements
const authContainer = document.getElementById("auth-container");
const postContainer = document.getElementById("post-container");
const postInput = document.getElementById("post-input");
const postBtn = document.getElementById("post-btn");
const logoutBtn = document.getElementById("logout-btn");
const postsContainer = document.getElementById("posts");
const loginContainer = document.getElementById("login-container");
const signUpContainer = document.getElementById("sign-up-container");
const loginBtn = document.getElementById("login-btn");
const signUpBtn = document.getElementById("sign-up-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const nameInput = document.getElementById("name");

let currentUser = null;

// Authentication - Sign Up
signUpBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const name = nameInput.value;

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        await db.collection("users").doc(auth.currentUser.uid).set({
            name: name,
            email: email,
        });

        // After successful sign-up, log the user in
        alert("Account created successfully!");
        emailInput.value = "";
        passwordInput.value = "";
        nameInput.value = "";
        loginUser();
    } catch (error) {
        alert(error.message);
    }
});

// Authentication - Log In
loginBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert("Logged in successfully!");
        emailInput.value = "";
        passwordInput.value = "";
        loginUser();
    } catch (error) {
        alert(error.message);
    }
});

// Log in user after successful authentication
function loginUser() {
    authContainer.style.display = "none";
    postContainer.style.display = "block";
    logoutBtn.style.display = "block";
    fetchPosts();
}

// Log out user
logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    authContainer.style.display = "block";
    postContainer.style.display = "none";
    logoutBtn.style.display = "none";
    postsContainer.innerHTML = "";
});

// Add Post
postBtn.addEventListener("click", async () => {
    const postContent = postInput.value.trim();

    if (postContent !== "") {
        const post = {
            userId: auth.currentUser.uid,
            content: postContent,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            likes: 0,
            comments: [],
        };

        try {
            await db.collection("posts").add(post);
            postInput.value = "";
            fetchPosts();
        } catch (error) {
            alert(error.message);
        }
    }
});

// Fetch Posts
async function fetchPosts() {
    postsContainer.innerHTML = "";
    const postsSnapshot = await db.collection("posts").orderBy("createdAt", "desc").get();

    postsSnapshot.forEach(doc => {
        const post = doc.data();
        const postElement = createPostElement(doc.id, post);
        postsContainer.appendChild(postElement);
    });
}

// Create Post Element
function createPostElement(postId, post) {
    const postElement = document.createElement("div");
    postElement.classList.add("post");
    const timestamp = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : "Just now";
    
    postElement.innerHTML = `
        <div class="content">${post.content}</div>
        <div class="timestamp">Posted on: ${timestamp}</div>
        <div class="actions">
            <button class="like-btn" onclick="toggleLike('${postId}')">
                <span>Like</span>
                <span class="likes-count">${post.likes}</span>
            </button>
            <button class="comment-btn" onclick="showComments('${postId}')">Comment</button>
        </div>
        <div class="comments" id="comments-${postId}" style="display: none;">
            <input type="text" id="comment-input-${postId}" placeholder="Write a comment..." />
            <button onclick="submitComment('${postId}')">Submit</button>
            <div id="comment-list-${postId}"></div>
        </div>
    `;
    
    return postElement;
}

// Toggle Like
async function toggleLike(postId) {
    const postRef = db.collection("posts").doc(postId);
    const postSnapshot = await postRef.get();
    const post = postSnapshot.data();
    
    if (post) {
        const updatedLikes = post.likes + 1;
        await postRef.update({ likes: updatedLikes });
        fetchPosts();
    }
}

// Show Comments for a post
function showComments(postId) {
    const commentSection = document.getElementById(`comments-${postId}`);
    commentSection.style.display = "block";
    loadComments(postId);
}

// Load comments for a post
async function loadComments(postId) {
    const commentsRef = db.collection("posts").doc(postId).collection("comments");
    const commentsSnapshot = await commentsRef.get();
    const commentList = document.getElementById(`comment-list-${postId}`);
    
    commentList.innerHTML = "";
    commentsSnapshot.forEach(commentDoc => {
        const comment = commentDoc.data();
        const commentElement = document.createElement("div");
        commentElement.classList.add("comment");
        commentElement.textContent = comment.text;
        commentList.appendChild(commentElement);
    });
}

// Submit a comment
async function submitComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const commentText = commentInput.value.trim();

    if (commentText !== "") {
        await db.collection("posts").doc(postId).collection("comments").add({
            text: commentText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        commentInput.value = "";
        loadComments(postId);
    }
}

// Monitor Authentication State
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loginUser();
    } else {
        authContainer.style.display = "block";
        postContainer.style.display = "none";
        logoutBtn.style.display = "none";
        postsContainer.innerHTML = "";
    }
});
