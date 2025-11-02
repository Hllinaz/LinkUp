class Profile extends StateBaseHTML{ 
    constructor(username){
        super(ME(username), '.content-feed');
        this.user = username
    }   

    async render () {
        await this.loadProfile()
        if (this.data['ME']) {
            await AppStateMachine.changeView(new MyProfile(this.user, this.data['ME']));
        } else {
            await AppStateMachine.changeView(new OtherProfile(this.user, this.data['ME']));
        }
        
    } 

    async loadProfile() {
        this.root.innerHTML =  `
            <div class="loading">
                Loading profile...
            </div>`
    }
}