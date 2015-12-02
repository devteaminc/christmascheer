var express = require('express');
var router = express.Router();

// routing for homepage
router.get('/', function (req, res) {
	res.render('index',{title: 'Christmas Cheer'});
});

module.exports = router;