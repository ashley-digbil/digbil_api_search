var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var debug = require('debug')('digbil_api_searsh');
var Promise = require('bluebird');
var app = express();

module.exports.start = function(db) {
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');
	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: false}));
	app.use(express.static(path.join(__dirname, 'public')));

	console.log('**connection--db**');
	routes.route('/users')
		.post(function getUserData(req, res) {
			var msg = '';
			console.log('**connection--post**');
			var userMail = '';
			userMail = req.body.name;
			console.log('userMail:', userMail);
			var user = Promise.cast(
				db.get_collection('userprofile')
				.findOne()
				.where('email.addr', userMail)
				.exec()
			)
			.then(function(userProfile){
				if(userProfile) {
					msg += 'The user id is : '+ userProfile._id+ '\n';
					if(userProfile.ddate){
						throw Error('Deleted user on '+ userProfile.ddate);
					}else{
						return userProfile;
					}
				}else{
					throw new Error('No user found for email : '+ userMail);
				}
			})

			var sessionTime = user.then(function(user) {
				console.log('User id : ', user.id);
				return Promise.cast(
					db.get_collection('session')
					.findOne()
					.where('session.user', user.id)
					.where('session.stype', 'S')
					.sort('-session.ts')
					.exec()
				)
				.then(function(session) {
					if(!session){
						return 'There is no session in DB';
					}
					else{
						console.log('Last session time : ', session.session.ts);
						return session.session.ts;
					}
				})
			});

			var mediaCount = user.then(function(user) {
				return Promise.cast(
					db.get_collection('media')
					.find()
					.where('user', user.id)
					.count()
					.exec()
				)
				.then(function(media) {
					console.log('media count : ', media);
					return media
				})
			});

			var deckCount = user.then(function(user) {
				return Promise.cast(
					db.get_collection('deck')
					.find()
					.where('user', user.id)
					.count()
					.exec()
				)
				.then(function(deck) {
					console.log('deck count :  ', deck);
					return deck;
				})
			});

			var playerCount = user.then(function(user) {
				return Promise.cast(
					db.get_collection('player')
					.find()
					.where('user' ,user.id)
					.count()
					.exec()
				)
				.then(function(player) {
					console.log('player count :', player);
					return player;
				})
			});

			var layoutCount = user.then(function(user) {
				return Promise.cast(
					db.get_collection('layout')
					.find()
					.where('user', user.id)
					.count()
					.exec()
				)
				.then(function(layout) {
					console.log('layout count :', layout);
					return layout;
				})
			});

			Promise.all([sessionTime, mediaCount, deckCount, playerCount, layoutCount])
			.spread(function(sessionTime,mediaCount,deckCount,playerCount,layoutCount) {
				var msg = 'last session time is : '+ sessionTime+ '\n'+
					'media count is : '+ mediaCount+ '\n' +
					'deck count is : '+ deckCount+ '\n' +
					'player count is : '+ playerCount+ '\n' +
					'layout count is : ' +layoutCount+ '\n';
				return msg;
			})
			.then(function(msg){
				res.json({
				 	message : msg
				})
			})			
			.catch(Error,function(e) {
				console.log('Error catch : ', e);
				res.send('The '+ e);
			});
		});

	app.use(routes);
	console.log('app.use(routes)');

	/// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	/// error handlers
	// development error handler
	// will print stacktrace
	if (app.get('env') === 'development') {
		app.use(function(err, req, res, next) {
			res.status(err.status || 500);
			res.render('error', {
				message: err.message,
				error: err
			});
		});
	}

	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: {}
		});
	});

	var server = app.listen(process.env.PORT || 3000, function() {
		debug('Express server listening on port ' + server.address().port);
		console.log('**express--start**');
	});
}