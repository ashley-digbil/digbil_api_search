console.log('into the sercver.js');

//Base Setup
//====================================================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var connect = require('digbil_api_db').connect('mongodb://127.0.0.1:27017/digbil_stest');
var Promise = require('bluebird');
//var assert = require('chai').assert;

//configure app to use bodyParser()
//this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

var port = process.env.port || 3000;

//ROUTERS FOR OUR API
//====================================================
var router = express.Router();

router.use(function(req, res, next){
	console.log('something is happening');
	next();
});

router.get('/',function(req, res){
	res.json({message: 'welcom to our api'});
});

//more routes for our API will happen here

//router.route('/users')

var userMail = '';
var Msg = '';
connect.then(function(db) {
	//console.log('--------------db: ',db);
	router.route('/users')
		.post(function(req, res){
			//debugger;
			console.log('****************server.js****************');
			userMail = req.body.name;
			console.log('userMail:', userMail);
			//debugger;
			var UID = Promise.cast(
				//db.get_collection('userprofile').findById(userLn).exec()
				db.get_collection('userprofile')
				.findOne()
				.where('email.addr', userMail)
				.exec()
			)
			.then(function(userProfile){				
				if(userProfile){
					Msg += 'The user id is : '+ userProfile._id+ '\n';
					//res.send('The user id is : '+ userProfile.id);
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
				//console.log('type : ', typeof UID);//Object
				console.log('User Id : ', UID._id);
				Promise.cast(
					db.get_collection('session')
					.findOne({$query:{'session.rights.UID':UID.toString,'session.stype':'S'}, '$orderby':{'session.ts':-1}})
					//.where('session.rights.UID', UID.toString())
					.exec()
				)
				.then(function(session){
					console.log('Last session time : ', session.session.ts);
					//res.send('session is : ', session);
					Msg += 'Last session time : '+ session.session.ts+ '\n';
				})

				Promise.cast(
					db.get_collection('media')
					.find()
					.where('user', UID._id)
					.count()
					.exec()
				)
				.then(function(media){
					console.log('media count : ', media);
					Msg += 'media count is :  '+ media+ '\n';
				})

				Promise.cast(
					db.get_collection('deck')
					.find()
					.where('user', UID._id)
					.count()
					.exec()
				)
				.then(function(deck){
					console.log('deck count :  ', deck);
					Msg += 'deck count is :   '+ deck+ '  \n';
				})

				Promise.cast(
					db.get_collection('player')
					.find()
					.where('user' ,UID._id)
					.count()
					.exec()
				)
				.then(function(player){
					console.log('player count :', player);
					Msg += 'player count is : '+ player+ '\n';
				})
				
				Promise.cast(
					db.get_collection('layout')
					.find()
					.where('user', UID._id)
					.count()
					.exec()
				)
				.then(function(layout){
					console.log('layout count :', layout);
					Msg += 'layout count is : '+ layout;
					res.render('input', 
						{ 
							title: 'search user  last connection',
							msg: Msg
						});
					});
					Msg = '';
				})
			})
			.catch(Error,function(e){
				console.log('Error catch : ', e);
				res.send('The '+ e);
				//res.send('This user is not exist : '+ userMail);
			});
		});
});

//REGISTER OUR ROUTRS
//all of our routes wil be prefixed with /api
app.use('/api', router);

//START THE SERVER
//====================================================

app.listen(port);

console.log('server is start and port is ', port);