import {
    StateBaseHTML,
    Parameters,
    $, getSettings
} from "./index.js";

import { 
    AppStateMachine
} from "../index.js";

import { MyProfile } from './Profiles/MyProfile.js'
import { OtherProfile } from './Profiles/OtherProfile.js'

export class Profile extends StateBaseHTML {
    constructor(username) {
        super(Parameters.ME(username), '.content-feed');
        this.user = username
    }

    async render() {
        await this.loadProfile()
        if (this.data['ME']) {
            await AppStateMachine.changeView(new MyProfile(this.user, this.data['ME']));
        } else {
            await AppStateMachine.changeView(new OtherProfile(this.user, this.data['ME']));
        }

    }

    async loadProfile() {
        this.root.innerHTML = `
            <div class="loading">
                Loading profile...
            </div>`
    }

    static hookSettings() {
        $('#settings').addEventListener('click', (e) => {
            AppStateMachine.changeView(getSettings());
        });
    }
}
