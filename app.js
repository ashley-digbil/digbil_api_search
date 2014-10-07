var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var Promise = require('bluebird');
var connect = require('digbil_api_db').connect('mongodb://127.0.0.1:27017/digbil_stest');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

connect.then(function(db) {
	routes.route('/users')
		.post(function(req, res){
			debugger;
			var Msg = '';
			var userMail = '';
			userMail = req.body.name;
			console.log('userMail:', userMail);
			var UID = Promise.cast(
				db.get_collection('userprofile')
				.findOne()
				.where('email.addr', userMail)
				.exec()
			)
			.then(function(userProfile){
				if(userProfile){
					Msg += 'The user id is : '+ userProfile._id+ '\n';
					if(userProfile.ddate){
						throw Error('Deleted user on '+ userProfile.ddate);
					}
					else{
						return userProfile;
					}
				}
				else{
					throw new Error('No user found for email : '+ userMail);
				}
			})
			
			.then(function(UID){
				console.log('User id : ', UID.id);
				Promise.cast(
					db.get_collection('session')
					.findOne({$query:{'session.rights.UID':UID.toString,'session.stype':'S'}, '$orderby':{'session.ts':-1}})
					.exec()
				)
				.then(function(session){
					console.log('Last session time : ', session.session.ts);
					Msg += 'Last session time : '+ session.session.ts+ '\n';
				})

				.then(function(){
					Promise.cast(
						db.get_collection('media')
						.find()
						.where('user', UID.id)
						.count()
						.exec()
					)
					.then(function(media){
						console.log('media count : ', media);
						Msg += 'media count is :  '+ media+ '\n';
					})
				})

				.then(function(){
					Promise.cast(
						db.get_collection('deck')
						.find()
						.where('user', UID.id)
						.count()
						.exec()
					)
					.then(function(deck){
						console.log('deck count :  ', deck);
						Msg += 'deck count is :   '+ deck+ '  \n';
					})
				})

				.then(function(){
					Promise.cast(
						db.get_collection('player')
						.find()
						.where('user' ,UID.id)
						.count()
						.exec()
					)
					.then(function(player){
						console.log('player count :', player);
						Msg += 'player count is : '+ player+ '\n';
					})
				})

				.then(function(){
					Promise.cast(
						db.get_collection('layout')
						.find()
						.where('user', UID.id)
						.count()
						.exec()
					)
					.then(function(layout){
						console.log('layout count :', layout);
						Msg += 'layout count is : '+ layout;
						res.json({
						 	message : Msg
						})
					})
				})
			})

			.catch(Error,function(e){
				console.log('Error catch : ', e);
				res.send('The '+ e);
			});
		});
});

app.use('/', routes);
app.listen(3000);
console.log('server is start and port is 3000');

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

module.exports = app;