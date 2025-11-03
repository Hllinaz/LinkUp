import { StateMachine } from './StateMachine/StateMachine.js'
import {
  Profile, getComments, getExplore,
  getGraph, getHome, $, 
  Delete, Follow, Unfollow
} from './States/index.js'

export let AppStateMachine = new StateMachine();;

class Index {
  async init() {
    await AppStateMachine.changeView(getHome());
    hookViewProfile();
    hookDeletePost();
    hookHome();
    hookDiscover();
    hookFollowing();
    hookUnfollowing();
    hookLogOut()
    hookComments();
    hookGraph();
  }
}

const index = new Index();

document.addEventListener('DOMContentLoaded', index.init());

function hookViewProfile() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-view]');
    if (!target) return;
    const username = target.getAttribute('data-view');
    AppStateMachine.changeView(new Profile(username));
  });
}

function hookDeletePost() {
  document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-delete]');
    if (!target) return;
    if (!confirm('Delete post? Esto borrará sus comentarios.')) return;
    const id = target.getAttribute('data-delete');
    AppStateMachine.executeAction(new Delete(id));
  });
}

function hookFollowing() {
  document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-follow]');
    if (!target) return;
    const username = target.getAttribute('data-follow');
    AppStateMachine.executeAction(new Follow(username));
  });
}

function hookUnfollowing() {
  document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-unfollow]');
    if (!target) return;
    const username = target.getAttribute('data-unfollow');
    AppStateMachine.executeAction(new Unfollow(username));
  });
}

function hookComments() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-post]');
    if (!target) return;
    const postId = target.getAttribute('data-post');
    AppStateMachine.changeView(getComments(postId));
  });
}

function hookHome() {
  $('#home').addEventListener('click', (e) => {
    AppStateMachine.changeView(getHome());
  });
}

function hookDiscover() {
  $('#explore').addEventListener('click', (e) => {
    AppStateMachine.changeView(getExplore());
  });
}

function hookLogOut() {
  $('#logout').addEventListener('click', async (e) => {
    if (!confirm('¿Cerrar Sesión?')) return;
    localStorage.setItem('token', '');
    window.location.reload()
  });
}

function hookGraph() {
  document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-graph]');
    if (!target) return;
    const username = target.getAttribute('data-graph');
    AppStateMachine.changeView(getGraph(username))
  });
}