// Firebase import (v10+ style)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence,
  sendPasswordResetEmail  
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";


// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC5OGf8nc85I9cw1SQW65oJbSJDAtLLoW4",
  authDomain: "realpainbooking.firebaseapp.com",
  projectId: "realpainbooking",
  storageBucket: "realpainbooking.firebasestorage.app",
  messagingSenderId: "584949331159",
  appId: "1:584949331159:web:8ea35b28ab22388871ec92"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOMContentLoaded para sure na loaded lahat bago tayo mag-bind
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("adminLoginForm");
    const emailField = document.getElementById("email");
    const passwordField = document.getElementById("password");
    const errorMsg = document.getElementById("errorMsg");
    const forgotPasswordLink = document.querySelector(".options a");
    const togglePassword = document.getElementById("togglePassword");

    // Password toggle functionality
    togglePassword.addEventListener("click", () => {
        const type = passwordField.getAttribute("type") === "password" ? "text" : "password";
        passwordField.setAttribute("type", type);
        
        // Toggle eye icon
        togglePassword.classList.toggle("fa-eye");
        togglePassword.classList.toggle("fa-eye-slash");
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailField.value.trim();
        const password = passwordField.value.trim();
        const rememberMe = document.getElementById("rememberMe");

        if (!email || !password) {
            showError("Please fill in both email and password.");
            return;
        }
        // === reCAPTCHA check ===
        if (typeof grecaptcha === "undefined") {
        alert("reCAPTCHA is still loading. Please wait a moment and try again.");
        return;
        }

        const recaptchaResponse = grecaptcha.getResponse();

        if (!recaptchaResponse || recaptchaResponse.length === 0) {
        recaptchaError.style.display = "block";
        alert("Please complete the reCAPTCHA verification.");
        return;
        } else {
        recaptchaError.style.display = "none";
        }

        // === Set persistence based on Remember Me ===
        const persistenceType = rememberMe.checked
        ? browserLocalPersistence   // stays logged in even after browser restart
        : browserSessionPersistence; // logs out when browser/tab closed

        try {
        await setPersistence(auth, persistenceType);
        } catch (error) {
        console.error("Persistence error:", error);
        alert("Failed to set persistence mode. Please try again.");
        return;
        }

        // === Login ===
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                hideError();
                showToast("Login successful!");

                // Set session storage for authentication
                sessionStorage.setItem('adminLoggedIn', 'true');
                sessionStorage.setItem('adminLoginTime', new Date().getTime().toString());

                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1500);
            })
            .catch((error) => {
    console.error("Login Error:", error);

    let message = "Something went wrong.";

    // Check if error has a 'code' property
    if (error?.code) {
        switch (error.code) {
            case "auth/user-not-found":
            case "auth/wrong-password":
            case "auth/invalid-credential":
                message = "Invalid email or password.";
                break;
            case "auth/too-many-requests":
                message = "Too many attempts. Try again later.";
                break;
            case "auth/invalid-email":
                message = "Please enter a valid email address.";
                break;
            default:
                message = error.message || message;
                break;
        }
    } else {
        // Just in case it's an unexpected error format
        message = error.message || "Unexpected error occurred.";
    }

    showError(message);
});

    });

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = "block";

        setTimeout(() => {
            hideError();
        }, 4000);
    }

    function hideError() {
        errorMsg.style.display = "none";
    }

    function showToast(message) {
        const toast = document.createElement("div");
        toast.textContent = message;
        toast.style.position = "fixed";
        toast.style.top = "20px";
        toast.style.right = "20px";
        toast.style.background = "#000";
        toast.style.color = "#fff";
        toast.style.padding = "10px 20px";
        toast.style.borderRadius = "5px";
        toast.style.zIndex = 9999;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    // === Forgot Password Functionality ===
    forgotPasswordLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = emailField.value.trim();

    if (!email) {
        showError("Please enter your email first before resetting your password.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showToast("Password reset email sent! Check your inbox or spam folder.");
    } catch (error) {
        console.error("Password reset error:", error);
        let message = "Failed to send reset email.";
        if (error.code === "auth/user-not-found") {
        message = "No account found with that email.";
        } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address format.";
        }
        showError(message);
    }
    });
});
