function ERROR() {
    return []
}

function HOME() {
    return [
        {
            key: 'home',
            url: `${API}/posts`,
            options: {
                method: 'GET',
                headers: authHeaders()
            }
        },
        {
            key: 'index/web-profile',
            url: 'home.html'
        },
        {
            key: 'template/post',
            url: 'template/post.html'
        }
    ];
}

function EXPLORE() {
    return [
        {
            key: 'explore-user',
            url: `${API}/analytics/recommendations`,
            options: {
                method: 'GET',
                headers: authHeaders()
            }
        },
        {
            key: 'explore-top',
            url: `${API}/analytics/top`,
            options: {
                method: 'GET',
                headers: authHeaders()
            }
        },
        {
            key: 'explore-communities',
            url: `${API}/analytics/communities`
        },
        {
            key: 'index/discover',
            url: 'explore.html'
        }
    ];
}

function SETTINGS() {
    return [
        {
            key: 'profile',
            url: `${API}/users/me`,
            options: {
                method: 'GET',
                headers: authHeaders()
            }
        },
        {
            key: 'index/settings',
            url: 'settings.html'
        }
    ]
}

function WEB() {
    return [
        {
            key: 'web-user',
            url: `${API}/analytics/recommendations`,
            options: {
                method: 'GET',
                headers: authHeaders()
            }
        },
        {
            key: 'web-profile',
            url: `${API}/users/me`,
            options: {
                method: 'GET',
                headers: authHeaders()
            }
        },
        {
            key: 'web-interests',
            url: `${API}/users/me/interests`,
            options: {
                method: 'GET',
                headers: authHeaders()
            }
        }
    ]
}

function ME(username) {
    return [
        {
            key: 'ME',
            url: `${API}/users/me/${username}`,
            options: {
                method: 'GET',
                headers: authHeaders()
            }
        },
    ];
}

function PROFILE(username, isMe) {
    const page = {
        key: 'index/profile',
        url: 'profile.html'
    }

    const post = {
        key: 'template/post',
        url: 'template/post.html'
    }

    if (isMe) {
        return [
            {
                key: 'profile',
                url: `${API}/users/${username}`,
                options: {
                    method: 'GET'
                }
            }, page, post
        ]
    } else {
        return [
            {
                key: 'profile',
                url: `${API}/users/${username}`,
                options: {
                    method: 'GET'
                }
            },
            {
                key: 'isFollowing',
                url: `${API}/users/follow/${username}`,
                options: {
                    method: 'GET',
                    headers: authHeaders()
                }
            }, page, post
        ]
    }
}

function COMMENTS(id) {
    return [
        {
            key: 'post',
            url: `${API}/posts/${id}`,
            options: {
                method: 'GET',
                headers: authHeaders()
            }
        },
        {
            key: 'comments',
            url: `${API}/comments/${id}`,
            options: {
                method: 'GET',
                headers: authHeaders()
            }
        },
        {
            key: 'index/comments',
            url: 'comments.html',
        },
        {
            key: 'template/post',
            url: 'template/post.html'
        }
    ];
}

function GRAPH(username) {
    return [
        {
            key: 'index/graph',
            url: `${API}/graph/${username}`,
            options: {
                method: 'GET',
            }
        }
    ]
}