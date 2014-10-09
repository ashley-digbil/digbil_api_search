var server = require('./server');
var dbUrl = 'mongodb://127.0.0.1:27017/digbil_stest';
// var connection = require('./connectDB')(dbUrl);
require('digbil_api_db').connect(dbUrl)
.then(function(db) {
	return server.start(db);
})