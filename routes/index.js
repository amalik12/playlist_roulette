var express = require('express');
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');
var clientId = 'f4c7d49946c24c209c08d6e26f559e75';
var spotifyApi = new SpotifyWebApi({
	clientId : clientId,
	clientSecret : '7cd751a2121c43f0921189e74e420987',
});

spotifyApi.clientCredentialsGrant()
.then(function(data) {
    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
}, function(err) {
	console.log('Something went wrong when retrieving an access token', err);
});

router.get('/api/search', function(req, res) {
	if(req.query.q.length > 0){
		spotifyApi.searchTracks(req.query.q, {limit: 3})
		.then(function(data) {
			res.json(data.body);
		}, function(err) {
			console.error(err);
		});
	}
});

router.get('/api/playlist', function(req, res) {
	var searchObject = {};
	searchObject.limit = 50;
	if (req.query.genre != undefined) {
		searchObject.seed_genres = req.query.genre;
	}
	if (req.query.track != undefined) {
		searchObject.seed_tracks = [req.query.track];
	}
	if (req.query.popularity) {
		searchObject.min_popularity = 50;
	}

	switch(req.query.purpose){
		case "Party":
		searchObject.min_danceability = 0.4;
		searchObject.min_tempo = 100;
		if (req.query.track == undefined && req.query.genre == undefined) {
			searchObject.seed_genres = ['party'];
		}
		break;
		case "Study":
		searchObject.max_energy = 0.7;
		searchObject.min_instrumentalness = 0.4;
		searchObject.min_valence = 0.3;
		if (req.query.track == undefined && req.query.genre == undefined) {
			searchObject.seed_genres = ['jazz', 'study'];
		}
		break;
		case "Relax":
		searchObject.max_energy = 0.65;
		searchObject.max_tempo = 120;
		if (req.query.track == undefined && req.query.genre == undefined) {
			searchObject.seed_genres = ['chill'];
		}
		break;
		case "Workout":
		searchObject.min_energy = 0.5;
		searchObject.min_tempo = 122;
		if (req.query.track == undefined && req.query.genre == undefined) {
			searchObject.seed_genres = ['work-out'];
		}
		break;
	}
	spotifyApi.getRecommendations(searchObject)
	.then(function(data) {
		res.json(data.body);
	}, function(err) {
		if (err.statusCode == 401){
			spotifyApi.clientCredentialsGrant()
			.then(function(data) {
				spotifyApi.setAccessToken(data.body['access_token']);
				spotifyApi.getRecommendations(searchObject)
				.then(function(data) {
					res.json(data.body);
				}, function(err){
					console.error(err);
				});
			}, function(err) {
				console.log('Something went wrong when retrieving an access token', err);
			});
		} else {
			console.error(err);
		}
	});
});

router.get('/login', function(req, res) {
	var scopes = 'playlist-modify-public';
	var hostname = req.headers.host;
	var redirectUri = 'http://' + hostname + '/callback';
	spotifyApi.setRedirectURI(redirectUri);
	res.redirect('https://accounts.spotify.com/authorize' + 
		'?response_type=code' +
		'&client_id=' + clientId +
		(scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
		'&redirect_uri=' + encodeURIComponent(redirectUri));
});

router.post('/create', function(req, res) {
	spotifyApi.authorizationCodeGrant(req.query.token)
	.then(function(data) {
		spotifyApi.setAccessToken(data.body['access_token']);
		spotifyApi.setRefreshToken(data.body['refresh_token']);

		spotifyApi.getMe()
		.then(function(data) {
			var userId = data.body.id;
			spotifyApi.createPlaylist(userId, req.query.name, { 'public' : true })
			.then(function(data) {
				spotifyApi.addTracksToPlaylist(userId, data.body.id, req.query.tracks)
				.then(function(data) {
					console.log('Added tracks to playlist!');
					res.send('done');
				}, function(err) {
					console.log('Something went wrong! Add tracks', err);
				});
			}, function(err) {
				console.log('Something went wrong! Create playlist', err);
			});
		}, function(err) {
			console.log('Something went wrong! Get user', err);
		});
	}, function(err) {
		console.log('Something went wrong! Get code', err);
	});
});

module.exports = router;