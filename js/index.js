import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { userDataService, getCurrentUserUid } from './userDataService.js';

const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut(auth);
        window.location.reload();
    });
}

onAuthStateChanged(auth, (user) => {
    //console.log('Auth state changed:', user); // Debug: log user object

    const userIcon = document.getElementById('user-icon');
    const loginText = document.getElementById('login-text');
    const userLink = document.getElementById('user-link');

    if (user) {
        userDataService.setCurrentUser(user);
        console.log('Current UID:', getCurrentUserUid());
        // Fetch user data and redirect admin to dashboard
        userDataService.getUserData(user.uid).then(userData => {
            if (userData && userData.role === 'admin') {
                if (!window.location.pathname.endsWith('dashboard.html')) {
                    window.location.href = 'dashboard.html';
                }
            }
        });
    } else {
        console.log('User is signed out');
    }

    if (user && userIcon && loginText && userLink) {
        //console.log('Display Name:', user.displayName); // Debug: log display name

        userIcon.src = user.photoURL ? user.photoURL : 'img/default-user-icon.png';
        loginText.textContent = (user.displayName || user.email || "Log in").split(' ')[0];
        userLink.href = "user.html";
        if (logoutBtn) logoutBtn.style.display = 'inline';
    } else if (userIcon && loginText && userLink) {
        loginText.textContent = "Log in";
        userLink.href = "auth/loginForm.html";
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
});



