const clientId = 'b1ce80d5165c41ebbeff49dccba39ed0'; 
const redirectUri = 'http://localhost:3000/';
let accessToken; 

const Spotify = {
    getAccessToken() {
        if(accessToken) {
            return accessToken;
        }

        // check for access token match
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
        // set access token to expire at the expiration time 
        if(accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);

            // this clears the parameters, allowing us to grab a new access token when it expires
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            // redirect users to URL if there is no access token and expires in match
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location = accessUrl; 
        }


    },
    // Spotify search request 
    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
            headers: {
            Authorization: `Bearer ${accessToken}`
            }
        }).then(response => {
            return response.json();
        }).then (jsonResponse => {
            // return an empty array if the JSON does not contain any tracks
            if(!jsonResponse.tracks) {
                return [];
            }
            // map the converted JSON response to an array of tracks
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        });
    },
    // write user's custom playlist in Jammming to their Spotify account 
    savePlaylist(name, trackUris) {
        if(!name || !trackUris.length) {
            return; 
        }
        const accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}`};
        let userId; 
        // get current user's ID
        return fetch(`https://api.spotify.com/v1/me`, {headers: headers}
        ).then(response => {
            return response.json();}
        ).then(jsonResponse => {
            userId = jsonResponse.id;
            // using a POST request, which will create a new playlist in the user's account 
            return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, 
            {
                headers: headers,
                method: 'POST',
                body: JSON.stringify({name: name})
            }).then(response => response.json() 
            ).then(jsonResponse => {
                // and return a playlist id
                const playlistId = jsonResponse.id;
                // 
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
                {
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({uris: trackUris})
                })
            })
        })

    }
}

export default Spotify;