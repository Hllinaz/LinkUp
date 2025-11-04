import { 
    StateBaseHTML,
    Parameters, $all,
    $, b, SaveSettings
} from "./index.js";

import { 
    AppStateMachine
} from "../index.js";

export class Settings extends StateBaseHTML{ 
    async render () {
        await this.loadSettings();
    }

    async loadSettings() {
        const author = this.data['profile']
        const main = b(this.data['index/settings'], 'main')
        $('.name', main).textContent = author.name
        $('.username', main).textContent = '@' + author.username
        $('.estadisticas .friends', main).textContent = author.friends.low + (author.friends.low === 1 ? ' Seguidor' : ' Seguidores')
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

      $('#intereses-activos').addEventListener('click', (e) => {
        if (e.target.getAttribute('class') === 'remove-btn'){
          const tag = e.target.closest('.interes-tag');
          if (!tag) return
          tag.remove()
        }
      });
    }
}

export function getSettings () {
  return new Settings(Parameters.SETTINGS(), '.content-feed')
}

function hookSaveSettings() {
  const interest = [];
  const button = $('#save-settings');
  button.addEventListener('click', (e) => {
    const name = $('#name').value.trim();
    const username = $('#username').value.trim();
    const email = $('#email').value.trim();
    const password = $('#password').value.trim();
    const interests = $all('.interes-tag ')
    interests.forEach(element => {
      interest.push($('span', element).textContent)
    });
    try {
      AppStateMachine.executeAction(new SaveSettings(name, username, email, password, interest));
    } catch (err) {
      console.error('Error creating post:', err);
    }
  });
}