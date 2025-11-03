export const API = 'http://localhost:4000';

export function getToken() {
  return localStorage.getItem('token');
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: 'Bearer ' + token } : {};
}

export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function $all(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function b(html, sel = '') {
  const d = document.createElement('div');
  d.innerHTML = html;
  return $(sel, d);
}

export function h(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.firstElementChild;
}

export function avatar(url = './images/profile-1.jpg') {
  return `<div class="profile-photo sm"><img src="${url}" alt=""></div>`;
}

export function userRow(u, extraRight = '') {
  return `
  <div class="user-recommendation">
    <div class="profile-photo"><img src="./images/profile-10.jpg" alt=""></div>
    <div class="name"><h5>${u.name || u.username}</h5></div>
    <div class="action">${extraRight || ''}</div>
  </div>`;
}

export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}