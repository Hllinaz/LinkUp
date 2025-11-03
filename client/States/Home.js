import { 
    StateBaseHTML,
    Parameters,
    $, b, h, API, Post
} from "./index.js";

import { 
    AppStateMachine
} from "../index.js";

export class Home extends StateBaseHTML {
    async render() {
        await this.loadHome();
        await this.loadPost();
    }

    async loadHome() {
        const template = this.data['index/web-profile'];
        const main = b(template, 'main');
        this.root.appendChild(main);
    }

    async loadPost() {
        const list = this.data['home'];
        const template = h(this.data['template/post']);
        const box = $('.feed')
        list.forEach(user => {
            const panel = template.cloneNode(true);
            const author = user.author
            const post = user.post
            $('.post-author-name', panel).textContent = author.name
            $('.post-author-username', panel).textContent = '@' + author.username + ' · '
                + post.createdAt.year.low + '/' + post.createdAt.month.low + '/' + post.createdAt.day.low
            $('.post-body', panel).textContent = post.text
            if (post.imageUrl) {
                const wrapper = document.createElement('div');
                wrapper.setAttribute('class', 'post-image-wrapper');
                const img = document.createElement('img');
                img.src = `${API}${post.imageUrl}`;
                img.setAttribute('class', 'post-image')
                wrapper.appendChild(img);
                $('.post-body', panel).appendChild(wrapper)
            }
            $('.comments', panel).setAttribute('data-post', post.id)
            $('.comments', panel).textContent = user.comments.low + ' comentarios';
            if (!user.isOwner) {
                $('.btn.borrar', panel).remove()
            } else {
                $('.btn.borrar', panel).setAttribute('data-delete', post.id)
            }
            $('.btn.ver', panel).setAttribute('data-view', author.username)
            box.appendChild(panel);
        });
    }

    async bindEvents() {
        hookCreatePost();
    }
}

export function getHome() {
    return new Home(Parameters.HOME(), '.content-feed')
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