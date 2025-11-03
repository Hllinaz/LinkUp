import { API, $ } from './Utility/util.js'

localStorage.setItem('token', '');

document.addEventListener('DOMContentLoaded', init());

function init() {
    hookLogin()
}

function hookLogin() {
    const loginForm = $('.login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = $('#user').value.trim()
        const password = $('#password').value.trim()

        if (!user || !password) {
            alert('Please enter both username and password');
            return;
        }

        const submitButton = $('.login-form button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;

        try {
            const login = await Login(user, password);

            if (login.ok) {
                console.log('Login successful');
                const data = await login.json();
                localStorage.setItem('token', data.token);
                document.location.href = "./index.html";
            } else {
                // Handle login failure
                const errorData = await login.json().catch(() => ({ message: 'Login failed' }));
                alert(errorData.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Network error. Please try again.');
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}

async function Login(username, password) {
    const login = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return login;
}