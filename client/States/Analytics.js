import { 
    StateBaseHTML,
    Parameters
} from "./index.js";

export class Analytics extends StateBaseHTML{ 
    
    async render () {
        await this.loadAnalytics();
    }

    async loadAnalytics() {
        this.root.innerHTML = `<h2 style="margin:1rem 0;">Top Users</h2><div id="topusers"></div>`;
        const top = this.data['top-user']
        const box = $('#topusers');
        box.innerHTML = top.map(u =>
            `<div style="display:flex;align-items:center;gap:.6rem;margin:.5rem 0;">
            ${avatar('./images/profile-13.jpg')}
            <div style="flex:1;">
                <div class="name"><h5>${u.name || u.username}</h5></div>
                <small class="text-muted">${u.followers} followers</small>
            </div>
            <button class="btn btn-primary" data-view="${u.username}">View</button>
            </div>`
        ).join('');
    }
}

export function getAnalytics () {
  return new Analytics(Parameters.ANALYTICS(), '.content-feed')
}