localStorage.setItem('token', '');

document.addEventListener('DOMContentLoaded', init());

function init() {
    hookRegister()
}

function hookRegister() {
    const registerForm = $('form');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = $('#name').value.trim()
        const username = $('#username').value.trim()
        const email = $('#email').value.trim()
        const password = $('#password').value.trim()

        if (!name || !username || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        const confirmPassword = $('#confirmPassword').value.trim();
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        const submitButton = $('form button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;

        try {
            const register = await Register(name, username, email, password);

            if (register.ok) {
                const data = await register.json();
                localStorage.setItem('token', data.token);
                alert('Registration successful!');
                document.location.href = "index.html";
            } else {
                const errorData = await register.json();
                alert(errorData.message || 'Registration failed.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Network error. Please try again.');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}

async function Register(name, username, email, password) {
    const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password })
    });
    return response;
}