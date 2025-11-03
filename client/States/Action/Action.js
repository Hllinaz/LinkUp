import { 
    StateBase, 
    StateBaseHTML,
    Parameters,
    authHeaders,
    API
} from "../index.js";

export class StateError extends StateBaseHTML {
    render(){
        this.root.innerHTML = `
        <div class="error"> 
            ${this.queryResults}
        </div>
        `;
    }
}

export class Post extends StateBase{
    queryParams;

    constructor(data){
        super();
        this.queryParams = [
            {
                key: 'create-post',
                url: `${API}/posts`,
                options: {
                    method: 'POST',
                    headers: authHeaders(),
                    body: data
                }
            }
        ];   
    }
}

export class Delete extends StateBase{
    queryParams;

    constructor(id){
        super();
        this.queryParams = [
            {
                key: 'delete-post',
                url: `${API}/posts/${id}`,
                options: { 
                    method: 'DELETE', 
                    headers: authHeaders() 
                }
            }
        ];   
    }
}

export class Follow extends StateBase{
    queryParams;

    constructor(username){
        super();
        this.queryParams = [
            {
                key: 'delete-post',
                url: `${API}/users/follow/${username}`,
                options: { 
                    method: 'POST', 
                    headers: authHeaders() 
                }
            }
        ];   
    }
}

export class Unfollow extends StateBase{
    queryParams;

    constructor(username){
        super();
        this.queryParams = [
            {
                key: 'delete-post',
                url: `${API}/users/follow/${username}`,
                options: { 
                    method: 'DELETE', 
                    headers: authHeaders() 
                }
            }
        ];   
    }
}

export class Login extends StateBase{
    queryParams;

    constructor(username, password){
        super();
        this.queryParams = [
            {
                key: 'login',
                url: `${API}/auth/login`,
                options: {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                }
            }
        ];
    }
}

export class SaveSettings extends StateBase{
    data;
    queryParams;

    constructor(name, username, email, password, interest){
        super();
        this.queryParams = [
            {
                key: 'save-settings',
                url: `${API}/users/me`,
                options: {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ name, username, email, password, interest})
                }
            }
        ];
    }

    async enter(queryResults) {
        this.data = queryResults.data['save-settings'];

        localStorage.setItem('token', this.data.token) 
    }
}

export class comment extends StateBase{
    constructor(id, text){
        super();
        this.queryParams = [
            {
                key: 'save-settings',
                url: `${API}/comments/${id}`,
                options: {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ text })
                }
            }
        ];
    }
}

export class Interest extends StateBase{
    constructor(interest, method){
        super();
        this.queryParams = [
            {
                key: 'create-interest',
                url: `${API}/users/me/interest`,
                options: {
                    method: `${method}`,
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ interest: interest })
                }
            }
        ];
    }
}

export function getError () {
  return new StateError(Parameters.ERROR(), '.content-feed')
}