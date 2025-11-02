class MyProfile extends StateBaseHTML {

    constructor(username, isMe) {
        super(PROFILE(username, isMe), '.content-feed');
    }

    async render() {
        await this.loadProfile();
        await this.loadPost();
    }

    async loadProfile() {
        const author = this.data['profile'];
        const template = this.data['index/profile'];
        const main = b(template, 'main');
        $('#nombre-usuario', main).textContent = author.name;
        $('#usuario', main).textContent = '@' + author.username;
        $('#num-publicaciones', main).textContent = author.posts.length;
        $('#graph', main).setAttribute('data-graph', author.username)
        $('.btn.seguir', main).remove()
        const lista =$('#lista-intereses ul', main);
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
        console.log(box)
        box.appendChild(h('<h3>Mis posts</h3>'))
        posts.forEach(post => {
            const panel = template.cloneNode(true);
            $('.post-author-name', panel).textContent = author.name
            $('.post-author-username', panel).textContent = '@' + author.username + ' · ' 
            + post.createdAt.year.low + '/' + post.createdAt.month.low + '/' + post.createdAt.day.low
            $('.post-body', panel).textContent = post.text
            $('.comments', panel).setAttribute('data-post', post.id)
            $('.comments', panel).textContent = post.comments.low + ' comentarios';
            $('.btn.ver', panel).remove()
            $('.btn.borrar', panel).setAttribute('data-delete', post.id)
            box.appendChild(panel);
        });    
    }

    bindEvents(){
        hookSettings();
    }
}