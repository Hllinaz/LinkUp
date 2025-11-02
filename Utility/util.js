const API = 'http://localhost:4000';

function getToken() { 
    return localStorage.getItem('token');
}

function authHeaders() {
    token = getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
}

function $(sel, root = document) { 
  return root.querySelector(sel); 
}

function $all(sel, root = document) { 
  return [...root.querySelectorAll(sel)]; 
}

function b(html, sel = ''){
  const d = document.createElement('div'); 
  d.innerHTML = html; 
  return $(sel, d); 
}

function h(html) { 
  const d = document.createElement('div'); 
  d.innerHTML = html; 
  return d.firstElementChild; 
}

function avatar(url = './images/profile-1.jpg') { 
  return `<div class="profile-photo sm"><img src="${url}" alt=""></div>`; 
}

function userRow(u, extraRight = '') {
  return `
  <div class="user-recommendation">
    <div class="profile-photo"><img src="./images/profile-10.jpg" alt=""></div>
    <div class="name"><h5>${u.name || u.username}</h5></div>
    <div class="action">${extraRight || ''}</div>
  </div>`;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function submitImage() {
  form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData();
  // En tu app probablemente guardas el uid en localStorage
  formData.append('userId', localStorage.getItem('uid') || 'demo-user-id');
  formData.append('content', document.getElementById('content').value);
  if (selectedFile) formData.append('image', selectedFile); // 👈 archivo binario

  try {
    const res = await fetch('http://localhost:8000/posts', {
      method: 'POST',
      body: formData // multipart/form-data automático
    });

    if (!res.ok) throw new Error('Error en el servidor');
    const data = await res.json();

    // Mostrar resultado (texto + imagen si viene URL)
    result.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = 'Post creado correctamente.';
    result.appendChild(p);

    if (data.post?.imageUrl) {
      const img = document.createElement('img');
      img.src = 'http://localhost:8000${data.post.imageUrl}';
      img.style.maxWidth = '320px';
      result.appendChild(img);
    }

    form.reset();
    preview.innerHTML = '';
    selectedFile = null;
  } catch (err) {
    alert(err.message || 'Fallo creando el post');
  }
});
}

const form = document.getElementById('post-form');
const imageInput = document.getElementById('image');
const preview = document.getElementById('preview');
const result = document.getElementById('result');

let selectedFile = null;

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  preview.innerHTML = '';
  selectedFile = null;

  if (!file) return;

  // Validaciones básicas
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    alert('Formato no permitido. Usa PNG, JPG, WEBP o GIF.');
    imageInput.value = '';
    return;
  }
  const MAX_MB = 5;
  if (file.size > MAX_MB * 1024 * 1024) {
    alert(`La imagen supera ${MAX_MB} MB.`);
    imageInput.value = '';
    return;
  }

  selectedFile = file;

  // Vista previa
  const url = URL.createObjectURL(file);
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Vista previa';
  img.style.maxWidth = '320px';
  img.onload = () => URL.revokeObjectURL(url);
  preview.appendChild(img);
});