class Comments extends StateBaseHTML {
    async render() {
        const main = b(this.data['index/comments'], 'main');
        this.root.appendChild(main);
        await this.loadPost();
        await this.loadComments();
    }

    async loadPost() {
        const data = this.data['post'];
        const author = data.author;
        const post = data.post;
        const panel = h(this.data['template/post'])
        $('.post-author-name', panel).textContent = author.name
        $('.post-author-username', panel).textContent = '@' + author.username + ' · '
            + post.createdAt.year.low + '/' + post.createdAt.month.low + '/' + post.createdAt.day.low
        $('.post-body', panel).textContent = post.text
        $('.comments', panel).setAttribute('data-post', post.id)
        $('.comments', panel).textContent = 0 + ' comentarios';
        if (!author.isMe) {
            $('.btn.borrar', panel).remove()
        } else {
            $('.btn.borrar', panel).setAttribute('data-delete', post.id)
        }
        $('.btn.ver', panel).setAttribute('data-view', author.username)

        $('.post-section').appendChild(panel);
        $('.btn.comentarios').setAttribute('data-comments', post.id)
    }

    async loadComments() {
        const comments = this.data['comments'];
        const template = h(this.data['template/post'])
        comments.forEach(comment => {
            const panel = template.cloneNode(true)
            const author = comment.author
            const post = comment.comment
            $('.post-author-name', panel).textContent = author.name
            $('.post-author-username', panel).textContent = '@' + author.username + ' · '
                + post.createdAt.year.low + '/' + post.createdAt.month.low + '/' + post.createdAt.day.low
            $('.post-body', panel).textContent = post.text
            $('#comments', panel).remove()
            if (!author.isMe) {
                $('.btn.borrar', panel).remove()
            } else {
                $('.btn.borrar', panel).setAttribute('data-delete', post.id)
            }
            $('.btn.ver', panel).setAttribute('data-view', author.username)
            $('.comment-section').appendChild(panel);
        });
    }

    bindEvents() {
        hookCreateComment();
    }
}

function getComments(postId) {
    return new Comments(COMMENTS(postId), '.content-feed')
}