class Web extends StateBaseHTML {
    async render () {
        await this.cleanWeb();
        await this.loadWeb();
    }

    async loadWeb() {
        await this.userProfile();
        await this.userRecommended();
        await this.userInterest();
    }

    async userRecommended() {
        const list = this.data['web-user']
        const box = $('.sugerencias');
        const template = $('#user-template');
        
        list.forEach(user => {
            const userElement = template.content.cloneNode(true);
            $('.name', userElement).textContent = user.name
            $('.btn.seguir', userElement).textContent = 'Seguir'
            $('.btn.seguir', userElement).setAttribute('data-follow', user.username)
            $('.btn.ver', userElement).setAttribute('data-view', user.username)
            box.appendChild(userElement)
        });
    }

    async userProfile() {
        const data = this.data['web-profile'];
        $('#nombre-usuario').textContent = data.name;
        $('#perfil').setAttribute('data-view', data.username)
    }

    async userInterest() {
        const data = this.data['web-interests'];
    }

    async cleanWeb(){
        const dynamicUsers = document.querySelectorAll('.usuario:not(#user-template)');
        dynamicUsers.forEach(user => user.remove());

        $('.content-feed').innerHTML = '';
        $('.other-panel').innerHTML = '';
    }

}

function getWeb () {
  return new Web(WEB())
}