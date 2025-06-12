import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile, 
    onAuthStateChanged, 
    sendPasswordResetEmail 
} from "firebase/auth";
import { userDataService } from './userDataService.js';  

const updateUserUI = (user) => {
    const userIcon = document.getElementById('user-icon');
    const loginText = document.getElementById('login-text');
    if (userIcon && loginText) {
      
        userIcon.src = user.photoURL || 'default-user-icon.png'; 
     
        loginText.textContent = user.displayName ? user.displayName.split(' ')[0] : user.email;
    }
};
//start of email-input validation
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const isStrongPassword = (password) => 
    /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password); // At least one capital and one special char

// Email/Password Sign In
const handleEmailSignIn = async (email, password) => {
    if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
        return;
    }
    if (!password) {
        alert("Password is required.");
        return;
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Signed in user:', {
            uid: userCredential.user.uid,
            email: userCredential.user.email
        });
        updateUserUI(userCredential.user);
        window.location.href = '../index.html';
    } catch (error) {
        alert(error.message);
    }
};

// Google Sign In
const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        // Fetch existing user data
        const existingUserData = await userDataService.getUserData(result.user.uid);
        // Use existing role if present, otherwise default to "user"
        const role = existingUserData && existingUserData.role ? existingUserData.role : "user";
        await userDataService.saveUserData(result.user.uid, {
            uid: result.user.uid,
            email: result.user.email.toLowerCase(),
            displayName: result.user.displayName,
            role: role, 
            createdAt: existingUserData && existingUserData.createdAt ? existingUserData.createdAt : new Date().toISOString()
        });
        updateUserUI(result.user);
        window.location.href = '../index.html';
    } catch (error) {
        alert(error.message);
    }
};

// Email/Password Sign Up with input validation
const handleEmailSignUp = async (email, password, confirmPassword, displayName) => {
    if (!displayName.trim()) {
        alert("Display name is required.");
        return;
    }
    if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
        return;
    }
    if (password.length < 8) {
        alert("Password must be at least 8 characters.");
        return;
    }
    if (!isStrongPassword(password)) {
        alert("Password must contain at least one uppercase letter and one special character.");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

       
        await updateProfile(userCredential.user, { displayName });

       
        await userDataService.saveUserData(userCredential.user.uid, {
            uid: userCredential.user.uid,
            email: email,
            displayName: displayName,
            role: "user",
            createdAt: new Date().toISOString()
        });
        window.location.href = '../index.html';
    } catch (error) {
        alert(error.message);
    }
};

// Google Sign Up
const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        // Fetch existing user data
        const existingUserData = await userDataService.getUserData(result.user.uid);
       
        const role = existingUserData && existingUserData.role ? existingUserData.role : "user";
        await userDataService.saveUserData(result.user.uid, {
            uid: result.user.uid,
            email: result.user.email.toLowerCase(),
            displayName: result.user.displayName,
            role: role,
            createdAt: existingUserData && existingUserData.createdAt ? existingUserData.createdAt : new Date().toISOString()
        });
        window.location.href = '../index.html';
    } catch (error) {
        alert(error.message);
    }
};

const handleAuthStateChange = (user) => {
   
    const currentPath = window.location.pathname;
    if (!user && currentPath.includes('user.html')) {
        window.location.href = './auth/loginForm.html';
    }
};
onAuthStateChanged(auth, handleAuthStateChange);

// Initialize login form
export const initLoginForm = () => {
    const loginForm = document.getElementById('login-form');
    const googleSignInBtn = document.getElementById('google-signin');

    //checkpointStart-forgot password link
    const forgotPasswordLink = document.querySelector('.forgot-link-k');
    const emailInput = document.getElementById('email');

    // Create or select a message area for forgot password
    let forgotPasswordMessage = document.getElementById('forgot-password-message');
    if (!forgotPasswordMessage) {
        forgotPasswordMessage = document.createElement('div');
        forgotPasswordMessage.id = 'forgot-password-message';
        forgotPasswordMessage.style.color = '#79afff';
        forgotPasswordMessage.style.marginTop = '8px';
        loginForm.appendChild(forgotPasswordMessage);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const password = document.getElementById('password').value;
            await handleEmailSignIn(email, password);
        });
    }

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }

    // forgot password

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim().toLowerCase();
            if (!email) {
                forgotPasswordMessage.textContent = "Please enter your email address above first.";
                return;
            }
            try {
                await sendPasswordResetEmail(auth, email);
                forgotPasswordMessage.textContent = "Password reset email sent! Check your inbox.";
            } catch (error) {
                forgotPasswordMessage.textContent = error.message;
            }
        });
    }
    
};

// Initialize signup form
export const initSignupForm = () => {
    const signupForm = document.getElementById('signup-form');
    const googleSignupBtn = document.getElementById('google-signup');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const displayName = document.getElementById('display-name').value; // Get display name
            await handleEmailSignUp(email, password, confirmPassword, displayName);
        });
    }

    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', handleGoogleSignUp);
    }
};