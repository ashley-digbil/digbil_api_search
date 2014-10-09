var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'welcom to digbil !!!' });
  //console.log('router/index.js');
});

module.exports = router;