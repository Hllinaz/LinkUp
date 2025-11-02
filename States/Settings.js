class Settings extends StateBaseHTML{ 
    async render () {
        await this.loadSettings();
    }

    async loadSettings() {
        const author = this.data['profile']
        const main = b(this.data['index/settings'], 'main')
        console.log(this.data)
        $('.name', main).textContent = author.name
        $('.username', main).textContent = '@' + author.username
        $('.estadisticas .friends', main).textContent = author.friends.low + ' Amigos'
        $('.estadisticas .posts', main).textContent = author.posts.low + ' Publicaciones'

        const tag = $('#intereses-activos', main)
        const template = $('#template-tag', main)
        author.interests.forEach(interest => {
            const temp = template.content.cloneNode(true)
            $('.interes-tag span', temp).textContent = interest
            tag.appendChild(temp)
        });

        $('#name', main).setAttribute('value', author.name)
        $('#username', main).setAttribute('value', author.username)
        $('#email', main).setAttribute('value', author.email)
        
        this.root.appendChild(main)
    }

    async loadTag(){
        
    }

    bindEvents() {
        hookSaveSettings();
    }
}

function getSettings () {
  return new Settings(SETTINGS(), '.content-feed')
}