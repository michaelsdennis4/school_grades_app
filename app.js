var express   = require('express');
var session 	= require('express-session');
var app       = express();

var morgan  = require('morgan');
app.use(morgan('combined'));

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var connect        = require('connect');
var methodOverride = require('method-override');
app.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  };
}));

var bcrypt = require('bcryptjs');

// var MongoDB     = require('mongodb');
// var MongoClient = MongoDB.MongoClient;
// var ObjectId    = MongoDB.ObjectID;
// var mongoUri    = process.env.MONGOLAB_URI;
// var mongoUri    = 'mongodb://localhost:27017/school_grades'

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({secret: 'enifohqeni'}));  
app.use(express.static('public'));
app.set('view engine', 'ejs');


var sess;

var current_year = 0;
var current_term = 0;
var current_course_id = "";
var current_assessment_id = "";

// app.get('stylesheets/style.css', function(req, res) {
// 	res.sendFile('stylesheets/style.css');
// });

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.get('/', function(req, res){
  res.render('index')
});

