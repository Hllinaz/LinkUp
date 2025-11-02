class Explore extends StateBaseHTML {
    async render () {
        await this.loadExplore();
    }

    async loadExplore() {
        const template = this.data['index/discover'];
        const main = b(template, 'main');
        this.loadUser(main);
        this.loadTop(main);
        this.root.appendChild(main);
    }

    async loadUser(main) {
        const users = this.data['explore-user'];
        const container = $('#influencers-container', main)
        const template = $('#template-user-destc', main);

        users.forEach(user => {
            const temp = template.content.cloneNode(true);
            $('.name', temp).textContent = user.name
            $('.btn.ver', temp).setAttribute('data-view', user.username)
            $('.btn.seguir', temp).textContent = 'Seguir'
            $('.btn.seguir', temp).setAttribute('data-follow', user.username)
            container.appendChild(temp)
        });
    }
    async loadTop(main) {
        const users = this.data['explore-top'];
        const container = $('#top-container', main)
        const template = $('#template-user-top', main);

        users.forEach(user => {
            const temp = template.content.cloneNode(true);
            $('.name', temp).textContent = user.name
            $('.btn.ver', temp).setAttribute('data-view', user.username)
            $('.btn.seguir', temp).textContent = 'Seguir'
            $('.btn.seguir', temp).setAttribute('data-follow', user.username)
            container.appendChild(temp)
        });
    }
}

function getExplore () {
  return new Explore(EXPLORE(), '.content-feed')
}
