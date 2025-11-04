import {
    StateBaseHTML,
    Parameters,
    $, h,
    $all, Interest
} from "./index.js";

import { AppStateMachine } from "../index.js";

export class Web extends StateBaseHTML {
    async render() {
        await this.cleanWeb();
        await this.loadWeb();
    }

    async loadWeb() {
        await this.userProfile();
        await this.userRecommended();
        await this.userInterest();
        await this.communities();
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
        const interests = data.interest
        const card = $('.interest')
        const template = $('.template-interest')
        interests.forEach(interest => {
            const interestElement = template.content.cloneNode(true)
            $('.name', interestElement).textContent = interest.name
            card.appendChild(interestElement)
        });

    }

    async communities() {
        const data = this.data['web-communities'];
        const template = $('#template-community');
        data.forEach(element => {
            const card = template.content.cloneNode('true');
            $('.interest-btn', card).setAttribute('data-target', element.interest)
            $('.interest-content', card).setAttribute('id', element.interest)
            $('.interest-name', card).textContent = element.interest;
            $('.interest-count', card).textContent = element.users.length;
            //card.setAttribute('data-view', element.interest);
            element.users.forEach(user => {
                const button = `
                <button class="user-tag" data-view="${user.username}">
                    <i class="fa-solid fa-user"></i> ${user.name} 
                </button>`;
                $('.connected-users', card).append(h(button))
            });

            $('.card.connections').appendChild(card)
        });
    }

    async cleanWeb() {
        const dynamicUsers = $all('.sugerencias .usuario');
        if (dynamicUsers) dynamicUsers.forEach(user => user.remove());
        const dynamicInterests = $all('.interest .interest-boton');
        if (dynamicInterests) dynamicInterests.forEach(interest => interest.remove())
        const dynamicCommunity = $all('.card.connections .interest-btn');
        if (dynamicCommunity) dynamicCommunity.forEach(interest => interest.remove())
        const dynamicContent = $all('.card.connections .interest-content');
        if (dynamicContent) dynamicContent.forEach(interest => interest.remove())

        $('.content-feed').innerHTML = '';
        $('.other-panel').innerHTML = '';
    }

    async bindEvents() {
        const modalInterest = $('#modal-interes')
        $('#btn-nuevo-interes').addEventListener('click', () => {
            modalInterest.classList.add('active');
            modalInterest.focus();
        });

        // Cerrar modal
        $('#btn-cancelar').addEventListener('click', cerrarModal)
        modalInterest.addEventListener('click', (e) => {
            if (e.target === modalInterest) {
                cerrarModal();
            }
        });

        // Crear nuevo interés
        $('#btn-crear').addEventListener('click', crearInteres);
        $('#input-interes').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                crearInteres();
            }
        });

        // Validar input en tiempo real
        $('#input-interes').addEventListener('input', () => {
            const valor = $('#input-interes').value.trim();
            $('#btn-crear').disabled = valor.length < 2;
        });

        $('.interest').addEventListener('click', (e) => {
            if (!$('.name', e.target)) return;
            const name = $('.name', e.target).textContent;
            AppStateMachine.executeAction(new Interest(name, 'PUT'))
        });

        const interestButtons = $all('.interest-btn');

        interestButtons.forEach(button => {
            button.addEventListener('click', async function () {
                const targetId = this.getAttribute('data-target');
                const content = $(`#${targetId}`);

                // Cerrar otros contenidos abiertos
                interestButtons.forEach(otherBtn => {
                    if (otherBtn !== this) {
                        const otherTarget = otherBtn.getAttribute('data-target');
                        const otherContent = $(`#${otherTarget}`);
                        otherBtn.classList.remove('active');
                        if (otherContent) otherContent.classList.remove('active');
                    }
                });

                // Alternar el contenido actual
                this.classList.toggle('active');
                content.classList.toggle('active');
            });
        });

    }

}

export function getWeb() {
    return new Web(Parameters.WEB())
}

function cerrarModal() {
    const modalInterest = $('#modal-interes')
    modalInterest.classList.remove('active');
    $('#input-interes').value = '';
    $('#btn-crear').disabled = true;
}

async function crearInteres() {
    const name = $('#input-interes').value.trim();

    if (name.length < 2) {
        alert('El interés debe tener al menos 2 caracteres');
        return;
    }
    const formData = new FormData();
    try {
        formData.append('interest', name)

        AppStateMachine.executeAction(new Interest(name, 'POST'))
        cerrarModal();

        // 5. Feedback visual
        mostrarNotificacion(`Interés "${name}" creado exitosamente`);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear el interés');
    }
}

function mostrarNotificacion(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 1001;
        font-family: 'Segoe UI', sans-serif;
    `;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    setTimeout(() => {
        document.body.removeChild(notificacion);
    }, 3000);
}