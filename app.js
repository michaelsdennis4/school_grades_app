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

var MongoDB     = require('mongodb');
var MongoClient = MongoDB.MongoClient;
var ObjectId    = MongoDB.ObjectID;
var mongoUri    = process.env.MONGOLAB_URI;
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

console.log('connecting to MongoDB');
MongoClient.connect(mongoUri, function(error, db) {
  if (error) throw error;

	app.get('stylesheets/normalize.css', function(req, res) {
		res.sendFile('stylesheets/normalize.css');
	});

  app.get('stylesheets/style.css', function(req, res) {
    res.sendFile('stylesheets/style.css');
  });

	app.listen(app.get('port'), function() {
	  console.log('Node app is running on port', app.get('port'));
	});

	app.get('/', function(req, res){
	  res.render('index')
	});

	app.get('/dashboard', function(req, res){
    sess = req.session;
    res.render('dashboard', {sess: sess, current_year: current_year, current_term: current_term, current_course_id: current_course_id, current_assessment_id: current_assessment_id});
  });

  app.post('/login', function(req, res) {
    db.collection('users').find({email: req.body.email}).toArray(function(error, users) {
      if (users.length == 0) {
        res.redirect('/');
        console.log('user not found');
      } 
      else {
        user = users[0];
        if (bcrypt.compareSync(req.body.password, user.password_digest) === true) {
          sess = req.session;
          sess.user_id = user._id;
          sess.email = user.email;
          sess.username = user.first_name +' '+user.last_name;
          current_year = user.current_year;
          current_term = user.current_term;
          console.log('user logged in!');
          res.redirect('/dashboard');
        } else {
          res.redirect('/');
          console.log('password incorrect');
        };
      };
    });
  });

  app.get('/logout',function(req, res) {
    req.session.destroy(function(err) {
      if (err) {
        console.log(err);
      }
      else
      {
        res.redirect('/');
      };
    });
  });

  // USERS --------------------------------------------------

  app.get('/users/new', function(req, res) {
    res.render('users/new.ejs');
  });

  app.get('/users/:id/edit', function(req, res) {
    db.collection('users').find({_id: ObjectId(req.params.id)}).toArray(function(error, users) {
      user = users[0];
      res.render('users/edit.ejs', {user: user});
    });
  });

  app.post('/users', function(req, res){
    db.collection('users').find({email: req.body.email}).toArray(function(error, users) {
      if (users.length > 0) {
        res.redirect('/users/new');
        console.log('the user already exists');
      } 
      else if (req.body.password != req.body.password_confirmation) { 
        res.redirect('/users/new');
        console.log('passwords do not match');
      } 
      else if (req.body.first_name.length === 0) {
        res.redirect('/users/new');
        console.log('first name cannot be blank');
      }
      else if (req.body.last_name.length === 0) {
        res.redirect('/users/new');
        console.log('last name cannot be blank');
      }
      else if (req.body.email.length === 0) {
        res.redirect('/users/new');
        console.log('email cannot be blank');
      }
      else {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.password, salt);
        db.collection('users').insert({first_name: req.body.first_name, last_name: req.body.last_name, email: req.body.email, password_digest: hash}, function(error, results) {
          var user = results.ops[0];
          res.json(user);
        });
      };
    });
  });

  app.patch('/users/:id', function(req, res) {
    if (req.body.first_name.length === 0) {
        res.redirect('/users/'+req.params.id+'/edit');
        console.log('first name cannot be blank');
    }
    else if (req.body.last_name.length === 0) {
      res.redirect('/users/'+req.params.id+'/edit');
      console.log('last name cannot be blank');
    }
    else if (req.body.email.length === 0) {
      res.redirect('/users/'+req.params.id+'/edit');
      console.log('email cannot be blank');
    }
    else {
      db.collection('users').update({_id: ObjectId(req.params.id)}, {$set: {first_name: req.body.first_name, last_name: req.body.last_name, email: req.body.email}});
      res.redirect('/dashboard');
    };
  });

  app.patch('/year', function(req, res) {
    db.collection('users').update({_id: ObjectId(req.session.user_id)}, {$set: {current_year: req.body.current_year}});
    current_year = req.body.current_year;
    current_course_id = "";
    current_assessment_id = "";
    res.redirect('/dashboard');
  });

  app.patch('/term', function(req, res) {
    db.collection('users').update({_id: ObjectId(req.session.user_id)}, {$set: {current_term: req.body.current_term}});
    current_term = req.body.current_term;
    current_course_id = "";
    current_assessment_id = "";
    res.redirect('/dashboard');
  });

  //COURSES -----------------------------------------------

  app.get('/courses', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id.length > 0)) {
      db.collection('users').find({_id: ObjectId(req.session.user_id), "courses.year": current_year, "courses.term": current_term}).toArray(function(error, users) {
        if (users.length > 0) {
          var courses = users[0].courses;
          if ((courses) && (courses.length > 0)) {
            courses.sort(function (a, b) {
              if (a.title > b.title) {
                return 1;
              }
              if (a.title < b.title) {
                return -1;
              }
              return 0;
            });
            courses.map(function(course) {
              course.title = course.title.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            });
            res.json(courses);
          } else {
            res.json({});
          };
        } else {
          res.json({});
        }
      });
    } else {
      res.json({});
    };
  });
  
  app.get('/courses/new', function(req, res) {
    res.render('courses/new.ejs');
  });

  app.post('/courses', function(req, res) {
    if ((!req.session) || (req.session.user_id.length <= 1)) {
      console.log('user is not logged in');
    }
    else if (req.body.title.length === 0) {
      res.redirect('/courses/new');
      console.log('title cannot be blank');
    } 
    else {
      //need to make sure there are no duplicate courses
      db.collection('users').find({_id: ObjectId(req.session.user_id), "courses.title": req.body.title.toLowerCase(), "courses.year": req.body.year, "courses.term": req.body.term, "courses.section": req.body.section}, {_id: 0, "courses.$": 1}).toArray(function(error, results) {
        if (results.length > 0) {
          res.redirect('/courses/new');
          console.log('course already exists');
        } else {
          db.collection('users').update({_id: ObjectId(req.session.user_id)}, {$push: {courses: {_id: ObjectId(), title: req.body.title.toLowerCase(), section: req.body.section, year: req.body.year, term: req.body.term, auto: req.body.auto}}}, function(error, results) {
              if (results) {
                console.log('new course created');
                res.redirect('/dashboard');
              } else {
                console.log('error creating course');
                res.redirect('/courses/new');
              };
          });
        };
      });
    };
  });

  app.post('/current_course/:id', function(req, res) {
    current_course_id = req.params.id;
    console.log('current course on the server is '+current_course_id);
    //clear current assessment when changing current course
    current_assessment_id = "";
    res.redirect('/dashboard');
  });

//ASSESSMENTS --------------------------------------------------

  app.get('/assessments', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id.length > 0) && (current_course_id.length > 0)) {
      console.log('finding assessments for course '+current_course_id);
      db.collection('users').find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(current_course_id)}, {_id: 0, 'courses.$': 1}).toArray(function(error, results) {
        console.log('courses found '+results.length);
        if ((results.length > 0) && (results[0].courses[0].assessments)) {
          var assessments = results[0].courses[0].assessments;
          if (assessments.length > 0) {
            console.log('assessments found '+assessments.length);
            assessments.sort(function (a, b) {
              if (a.name > b.name) {
                return 1;
              }
              if (a.name < b.name) {
                return -1;
              }
              return 0;
            });
            assessments.map(function(assessment) {
              assessment.name = assessment.name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            });
            console.log('returning json '+assessments);
            res.json(assessments);
          } else {
            res.json({});
          };
        } else {
          res.json({});
        }
      });
    } else {
      res.json({});
    };
  });

  app.get('/assessments/new', function(req, res) {
    if ((current_course_id) && (current_course_id.length > 0)) {
      db.collection("users").find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(current_course_id)}, {_id: 0, 'courses.$': 1}).toArray(function(error, results) {
        if ((results.length > 0) && (results[0].courses.length > 0)) {
          var course = results[0].courses[0];
          res.render('assessments/new.ejs', {course: course});
        } else {
          res.redirect('/dashboard');
        };
      });
    } else {
      res.redirect('/dashboard');
    };
  });

  app.post('/assessments', function(req, res) {
    if ((!req.session) || (req.session.user_id.length <= 1)) {
        console.log('user is not logged in');
    }
    else if (current_course_id.length === 0) {
      console.log('no course selected');
      res.redirect('/dashboard');
    }
    else if (req.body.name.length === 0) {
      console.log('name cannot be blank');
      res.redirect('/assessments/new');
    } 
    else {
      db.collection('users').update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(current_course_id)}, {$push: {"courses.$.assessments": {_id: ObjectId(), name: req.body.name.toLowerCase(), type: req.body.type, points: req.body.points, weight: req.body.weight}}}, function(error, results) {
          if (results) {
            console.log('new assessment created');
            res.redirect('/dashboard');
          } else {
            console.log('error creating assessment');
            res.redirect('/assessments/new');
          };
      });
    };
  });

  app.post('/current_assessment/:id', function(req, res) {
    current_assessment_id = req.params.id;
    console.log('current assessment on the server is '+current_assessment_id);
    res.redirect('/dashboard');
  });



	 // CLEAN UP ---------------------------------------------------

  process.on('exit', function() {
    db.close();
  });


});

