class StateError extends StateBaseHTML {
    render(){
        this.root.innerHTML = `
        <div class="error"> 
            ${this.queryResults}
        </div>
        `;
    }
}

class Post extends StateBase{
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

class Delete extends StateBase{
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

class Follow extends StateBase{
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

class Unfollow extends StateBase{
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

class Login extends StateBase{
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

class SaveSettings extends StateBase{
    data;
    queryParams;

    constructor(name, username, email, password){
        super();
        this.queryParams = [
            {
                key: 'save-settings',
                url: `${API}/users/me`,
                options: {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ name, username, email, password })
                }
            },{
                key: 'save-settings',
                url: `${API}users/me/interests`,
                options: {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ interests })
                }
            }
        ];
    }

    async enter(queryResults) {
        this.data = queryResults.data['save-settings'];
        localStorage.setItem('token', this.data.token) 
    }
}

class comment extends StateBase{
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
        console.log(this.queryParams)
    }
}

function getError () {
  return new StateError(ERROR(), '.content-feed')
}