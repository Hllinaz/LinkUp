class Home extends StateBaseHTML{
    async render () {
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
            $('.comments', panel).setAttribute('data-post', post.id)
            $('.comments', panel).textContent = user.comments.low + ' comentarios';
            if (!user.isOwner){
                $('.btn.borrar', panel).remove()
            } else {
                $('.btn.borrar', panel).setAttribute('data-delete', post.id)
            }
            $('.btn.ver', panel).setAttribute('data-view', author.username)
            box.appendChild(panel);
        });    
    }

    async bindEvents () {
        hookCreatePost();
    }
}

function getHome () {
  return new Home(HOME(), '.content-feed')
}