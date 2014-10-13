var server = require('./server');
var dbUrl = 'mongodb://fusiondev.mongo.digbil.com:27017/digbil_dev';
// var connection = require('./connectDB')(dbUrl);
require('digbil_api_db').connect(dbUrl)
.then(function(db) {
	return server.start(db);
})