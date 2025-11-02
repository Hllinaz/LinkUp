let AppStateMachine;

class Index {
  async globalStates() {
    AppStateMachine = new StateMachine();
  }

  async init() {
    await this.globalStates();
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

function hookCreatePost() {
  const form = $('.composer');
  const input = $('#create-post');
  const image = $('#image')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData();
    const text = input.value.trim()

    if (!text) return
    data.append('text', text);

    if (image.value) {
      const file = image.files[0]

      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.type)) {
        alert('Formato no permitido. Usa PNG, JPG, WEBP o GIF.');
        imageInput.value = '';
        return;
      }

      const MAX_MB = 5;
      if (file.size > MAX_MB * 1024 * 1024) {
        alert(`La imagen supera ${MAX_MB} MB.`);
      }

      data.append('file', file);
    }

    try {
      AppStateMachine.executeAction(new Post(data));
      input.value = '';
    } catch (err) {
      console.error('Error creating post:', err);
    }
  });
}

function hookSaveSettings() {
  const button = $('#save-settings');
  button.addEventListener('click', (e) => {
    const name = $('#name').value.trim();
    const username = $('#username').value.trim();
    const email = $('#email').value.trim();
    const password = $('#password').value.trim();
    try {
      AppStateMachine.executeAction(new SaveSettings(name, username, email, password));
    } catch (err) {
      console.error('Error creating post:', err);
    }
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

function hookSettings() {
  $('#settings').addEventListener('click', (e) => {
    AppStateMachine.changeView(getSettings());
  });
}

function hookLogOut() {
  $('#logout').addEventListener('click', async (e) => {
    if (!confirm('¿Cerrar Sesión?')) return;
    localStorage.setItem('token', '');
    window.location.reload()
  });
}

function hookCreateComment() {
  const form = $('.composer');
  const input = $('#comment-post');
  form.addEventListener('click', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    const target = e.target.closest('[data-comments]');
    if (!text || !target) return;
    try {
      const postId = target.getAttribute('data-comments');
      AppStateMachine.executeAction(new comment(postId, text));
      input.value = '';
    } catch (err) {
      console.error('Error creating comment:', err);
    }
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