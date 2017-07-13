var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');

// var port = process.env.PORT || 8080;

var index = require('./routes/index');
// var users = require('./routes/users');

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// // uncomment after placing your favicon in /public
// //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use('/', index);
// app.use('/users', users);
app.get('/callback', function(req, res) {
	res.sendFile(__dirname + '/public/callback.html');
});

app.use(function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});


// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	res.status(err.status || 500);
	res.render('error');
});



// app.get('*', function(req, res) {
// 	res.sendfile('./public/indx.html'); // load the single view file (angular will handle the page changes on the front-end)
// });


// app.get('/api', function(req, res) {
// 	// spotifyApi.searchTracks('controlla')
// 	// 	.then(function(data) {
// 	//     	console.log('Search by "Love"', data.body);
// 	// 	}, function(err) {
// 	//     	console.error(err);
// 	// });
// 	// console.log('word')
// 	res.sendfile('./public/index.html');
// });

module.exports = app;

app.listen(8080);
// console.log('Listening on port 8080.');
