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

function b(html, sel = '') {
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