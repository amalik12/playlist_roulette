var app = angular.module('playlist', ['ngRoute']);
app.config(['$locationProvider', function($locationProvider) {
    $locationProvider.hashPrefix('');
    $locationProvider.html5Mode(true);
}])
.config(function($routeProvider) {
    $routeProvider
    .when('/', {
      controller:'PurposeController as purpose',
      templateUrl:'../purpose.html'
  })
    .when('/genre', {
      controller:'GenreController as genre',
      templateUrl:'../genre.html'
  })
    .when('/song', {
      controller:'SongController as song',
      templateUrl:'../song.html'
  })
    .when('/popular', {
      controller:'PopularController as popular',
      templateUrl:'../popular.html'
  })
    .when('/playlist', {
      controller:'PlaylistController as playlist',
      templateUrl:'../playlist.html'
  })
    .when('/done', {
      controller:'DoneController as done',
      templateUrl:'../done.html'
  })
    .otherwise({
      redirectTo:'/'
  });
})
.factory("settings",function(){
    var item = {
        purpose: null,
        genre: [],
        track: null,
        popularity: false,
        navRight: 'Skip',
        currentStep: null,
        name: null
    };

    function set(value, field){
      item[field] = value;
  }

  return {
      set: set,
      value: item
  };
})
.controller('PurposeController', function(settings) {
    var purpose = this;
    purpose.settings = settings.value;
    if (purpose.settings.purpose != null) {
        settings.set('Next', 'navRight');
    } else {
        settings.set('Skip', 'navRight');
    }
    purpose.save = function(option){
        if (purpose.isActive(option)) {
            settings.set(null, 'purpose');
            settings.set('Skip', 'navRight');
        } else {
            settings.set(option, 'purpose');
            settings.set('Next', 'navRight');
        }
    };

    purpose.isActive = function(option){
        return settings.value.purpose == option;
    };
})
.controller('GenreController', function(settings, genreList) {
    var genre = this;
    genre.list = genreList;
    if (settings.value.genre.length > 0) {
        settings.set('Next', 'navRight');
    } else {
        settings.set('Skip', 'navRight');
    }
    genre.save = function(genreItem){
        if (genre.isActive(genreItem)) {
            settings.value.genre.splice(settings.value.genre.indexOf(genreItem), 1);
            if (settings.value.genre.length === 0){
                settings.set('Skip', 'navRight');
            }
        } else if (settings.value.genre.length < 4){
            settings.value.genre.push(genreItem);
            settings.set('Next', 'navRight');
        }
    };

    genre.isActive = function(genreItem){
        return settings.value.genre.indexOf(genreItem) > -1;
    };
})
.controller('StepController', function($scope, $location, settings, stepList) {
    var step = this;
    step.settings = settings.value;
    settings.set(stepList[0], 'currentStep');
    var stepMap = {};
    for (var i = 0; i < stepList.length; i++) {
        stepMap[stepList[i].current] = stepList[i]
    }

    $scope.$watch(function() {
        return $location.path();
    }, function(){
        settings.set(stepMap[$location.path()], 'currentStep');
    });

    step.nextStep = function(){
        $location.path(settings.value.currentStep.next);
    };

    step.previousStep = function(){
        $location.path(settings.value.currentStep.prev);
    };

    step.isActive = function(num){
        return settings.value.currentStep.num === num
    };
})
.controller('SongController', function($scope, $http, settings) {
    var song = this;
    song.settings = settings.value;
    song.suggestions = [];
    if (song.settings.track != null) {
        settings.set('Next', 'navRight');
    } else {
        settings.set('Skip', 'navRight');
    }
    $scope.$watch(function() {
        return song.search;
    }, function(){
        song.suggestions = []
        if (song.search != undefined) {
            $http.get('/api/search?q=' + song.search)
            .then(function(data) {
                song.suggestions = []
                var results = data.data.tracks.items;
                for (var i = 0; i < results.length; i++) {
                    item = {
                        name: null,
                        artists: [],
                        cover: null,
                        id: null
                    };
                    item.name = results[i].name;
                    for (var j = 0; j < results[i].artists.length; j++) {
                        item.artists.push(results[i].artists[j].name);
                    }
                    item.cover = results[i].album.images[0].url;
                    item.id = results[i].id;
                    song.suggestions.push(item);
                }
            }, function(data) {
                console.log('Error: ' + data);
            });
        } else {
            song.suggestions = []
        }
    });

    song.save = function(item) {
        settings.set(item, 'track');
        settings.set('Next', 'navRight');
        song.suggestions = [];
    }
})
.controller('PopularController', function(settings) {
    var popular = this;
    popular.settings = settings.value;
    settings.set('Next', 'navRight');
    popular.save = function(option){
        if (!popular.isActive(option)) {
            settings.set(option, 'popularity');
        }
    };
    popular.isActive = function(option){
        return settings.value.popularity === option;
    };
})
.controller('PlaylistController', function($scope, $http, $httpParamSerializer, $location, settings) {
    var playlist = this;
    playlist.settings = settings.value;
    playlist.title = 'Untitled Playlist';
    playlist.tracks = [];
    playlist.audio = null;
    playlist.loading = true;

    var params = {
        purpose: playlist.settings.purpose,
        genre: playlist.settings.genre.map(function(x){
            return x.api;
        }),
        popularity: playlist.settings.popularity
    }

    if (playlist.settings.track != null) {
        params.track = playlist.settings.track.id;
    }

    $http.get('/api/playlist?' + $httpParamSerializer(params))
    .then(function(data) {
        var results = data.data.tracks;
        for (var i = 0; i < results.length; i++) {
            item = {
                name: null,
                artists: [],
                album: null,
                preview: null,
                id: null
            };
            item.name = results[i].name;
            for (var j = 0; j < results[i].artists.length; j++) {
                item.artists.push(results[i].artists[j].name);
            }
            item.preview = results[i].preview_url;
            item.id = results[i].uri;
            item.album = results[i].album.name;
            playlist.tracks.push(item);
        }
    }, function(data) {
        console.log('Error: ' + data);
    })
    .finally(function(){
        playlist.loading = false;
    });

    playlist.login = function(){
        var child = window.open('/login', '_blank', 'location=yes,height=570,width=520,scrollbars=no,status=yes');
        var timer = setInterval(checkChild, 500);

        function checkChild() {
            if (child.closed) {  
                clearInterval(timer);
                console.log(localStorage.getItem('spotify-token'));
                var playlistParams = {
                    token: localStorage.getItem('spotify-token'),
                    tracks: playlist.tracks.map(function(x) {
                        return x.id;
                    }),
                    name: playlist.title
                }
                settings.set(playlist.title, 'name');
                $http.post('/create?' + $httpParamSerializer(playlistParams))
                .then(function(data) {
                    $location.path(settings.value.currentStep.next);
                }, function(data) {
                    console.log('Error: ' + data);
                });;
                localStorage.clear();
            }
        }
    }
    playlist.play = function(track){
        if (playlist.audio == null) {
            playlist.audio = {
                object: new Audio(track.preview),
                src: track.preview
            }
            playlist.audio.object.addEventListener("ended", function(){
             playlist.audio.src = null;
             console.log(playlist.audio.object.ended);
             console.log(playlist.audio.src == track.preview);
         });
            playlist.audio.object.play();
        } else {
            playlist.audio.object.pause();
            playlist.audio.object.currentTime = 0;
            if (!playlist.isPlaying(track)){
                playlist.audio.object = new Audio(track.preview);
                playlist.audio.src = track.preview;
                playlist.audio.object.play();
            } else {
                playlist.audio.src = null;
            }
        }
    }

    playlist.isPlaying = function(track){
        if (playlist.audio == null) {
            return false;
        } else {
            return playlist.audio.src == track.preview;
        }
    }
})
.controller('DoneController', function(settings) {
    var done = this;
    done.settings = settings.value;
});