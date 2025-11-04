import { StateBaseHTML, Parameters, b, $, h, API } from "../index.js";

export class OtherProfile extends StateBaseHTML {
    constructor(username, isME) {
        super(Parameters.PROFILE(username, isME), '.content-feed');
    }

    async render() {
        this.loadProfile();
        this.loadPost();
    }

    async loadProfile() {
        const author = this.data['profile'];
        const template = this.data['index/profile'];
        const main = b(template, 'main');
        $('#nombre-usuario', main).textContent = author.name;
        $('#usuario', main).textContent = '@' + author.username;
        $('#num-amigos', main).textContent = author.followers.low;
        $('#num-publicaciones', main).textContent = author.posts.length;
        $('#graph', main).setAttribute('data-graph', author.username)
        $('#settings', main).remove()
        if (this.data['isFollowing']) {
            $('.btn.seguir', main).setAttribute('data-unfollow', author.username)
            $('.btn.seguir', main).textContent = 'Siguiendo'
        } else {
            $('.btn.seguir', main).setAttribute('data-follow', author.username)
            $('.btn.seguir', main).textContent = 'Seguir'
        }
        const lista = $('#lista-intereses ul', main);
        const temp = $('#interest-template', main);
        author.interests.forEach(interest => {
            const inter = temp.content.cloneNode(true);
            $('li', inter).textContent = interest;
            lista.appendChild(inter);
        });
        this.root.appendChild(main);
    }

    async loadPost() {
        const author = this.data['profile'];
        const posts = author.posts
        const template = h(this.data['template/post']);
        const box = $('.feed');
        box.appendChild(h('<h3>Posts</h3>'))
        posts.forEach(post => {
            const panel = template.cloneNode(true);
            $('.post-author-name', panel).textContent = author.name
            $('.post-author-username', panel).textContent = '@' + author.username + ' · '
                + post.createdAt.year.low + '/' + post.createdAt.month.low + '/' + post.createdAt.day.low
            $('.post-body', panel).textContent = post.text
            $('.comments', panel).setAttribute('data-post', post.id)
            $('.comments', panel).textContent = post.comments.low + ' comentarios';
            $('.btn.ver', panel).remove()
            $('.btn.borrar', panel).remove()
            if (post.imageUrl) {
                const wrapper = document.createElement('div');
                wrapper.setAttribute('class', 'post-image-wrapper');
                const img = document.createElement('img');
                img.src = `${API}${post.imageUrl}`;
                img.setAttribute('class', 'post-image')
                wrapper.appendChild(img);
                $('.post-body', panel).appendChild(wrapper)
            }
            box.appendChild(panel);
        });
    }
}