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
// var mongoUri    = process.env.MONGOLAB_URI;
var mongoUri    = 'mongodb://localhost:27017/school_grades'

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({secret: 'enifohqeni'}));  
app.use(express.static('public'));
app.set('view engine', 'ejs');


var session;

//these variables to live in the session
// var current_year = 0;
// var current_term = 0;

// var current_course_id = "";
// var current_assessment_id = "";
// var current_student_id = "";

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

  app.post('/login', function(req, res) {
    db.collection('users').find({email: req.body.email}).toArray(function(error, users) {
      if (users.length == 0) {
        res.redirect('/');
        console.log('user not found');
      } 
      else {
        user = users[0];
        if (bcrypt.compareSync(req.body.password, user.password_digest) === true) {
          session = req.session;
          session.user_id = user._id;
          session.username = user.first_name +' '+user.last_name;
          session.current_year = user.current_year;
          session.current_term = user.current_term;
          session.current_course_id = "";
          session.current_assessment_id = "";
          session.current_student_id = "";
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
    req.session.user_id = null;
    req.session.username = null;
    req.session.email = null;
    req.session.destroy(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/');
      };
    });
  });

  app.get('/dashboard', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      res.render('dashboard', {sess: req.session});
    } else {
      res.redirect('/sorry');
    };
  });

  app.get('/sorry', function(req, res) {
    res.render('sorry');
  });

  // USERS --------------------------------------------------

  app.get('/users/new', function(req, res) {
    res.render('users/new.ejs'); 
  });

  app.get('/users/:id/edit', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      db.collection('users').find({_id: ObjectId(req.params.id)}).toArray(function(error, users) {
      user = users[0];
      res.render('users/edit.ejs', {user: user});
    });
    } else {
      res.redirect('/sorry');
    };  
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
        db.collection('users').insert({first_name: req.body.first_name, last_name: req.body.last_name, email: req.body.email, password_digest: hash, current_year: 2015, current_term: 1}, function(error, results) {
          session = req.session;
          session.user_id = user._id;
          session.username = user.first_name +' '+user.last_name;
          session.current_year = user.current_year;
          session.current_term = user.current_term;
          session.current_course_id = "";
          session.current_assessment_id = "";
          session.current_student_id = "";
          console.log('user logged in!');
          res.redirect('/dashboard');
        });
      };
    });
  });

  app.patch('/users/:id', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
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
    };
  });

  app.patch('/year', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      db.collection('users').update({_id: ObjectId(req.session.user_id)}, {$set: {current_year: req.body.current_year}});
      req.session.current_year = req.body.current_year;
      req.session.current_course_id = "";
      req.session.current_assessment_id = "";
      req.session.current_student_id = "";
      res.redirect('/dashboard');
    };
  });

  app.patch('/term', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      db.collection('users').update({_id: ObjectId(req.session.user_id)}, {$set: {current_term: req.body.current_term}});
      req.session.current_term = req.body.current_term;
      req.session.current_course_id = "";
      req.session.current_assessment_id = "";
      req.session.current_student_id = "";
      res.redirect('/dashboard');
    };
  });

  //COURSES -----------------------------------------------

  app.get('/courses', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      db.collection('users').find({_id: ObjectId(req.session.user_id), "courses.year": req.session.current_year, "courses.term": req.session.current_term}).toArray(function(error, users) {
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
      res.redirect('/sorry');
    };
  });
  
  app.get('/courses/new', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      res.render('courses/new.ejs');
    } else {
      res.redirect('/sorry');
    }; 
  });

  app.post('/courses', function(req, res) {
    if ((!req.session.user_id) || (req.session.user_id == null)) {
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
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.params.id === '0') {
        req.session.current_course_id = "";
      } else {
        req.session.current_course_id = req.params.id;
      };
      //clear current assessment an student when changing current course
      req.session.current_assessment_id = "";
      req.session.current_student_id = "";
      res.redirect('/dashboard');
    };
  });

  app.get('/enrollment', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null) && (req.session.current_course_id.length > 0)) {
      db.collection("users").find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {_id: 0, 'courses.$': 1}).toArray(function(error, results) {
        if ((results.length > 0) && (results[0].courses.length > 0)) {
          var course = results[0].courses[0];
          db.collection("students").find({}).toArray(function(error, students) {
            if (students.length > 0) {
              students.sort(function (a, b) {
                if (a.last_name > b.last_name) {
                  return 1;
                }
                if (a.last_name < b.last_name) {
                  return -1;
                }
                return 0;
              });
              students.map(function(student) {
                student.first_name = student.first_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
                student.last_name = student.last_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
              });
            } else {
              students = []
            };
            res.render('courses/enrollment.ejs', {course: course, students: students});
          });   
        } else {
          res.redirect('/dashboard');
        };
      });
    } else {
      res.redirect('/sorry');
    };
  });


//ASSESSMENTS --------------------------------------------------

  app.get('/assessments', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null) && (req.session.current_course_id.length > 0)) {
      db.collection('users').find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {_id: 0, 'courses.$': 1}).toArray(function(error, results) {
        console.log('courses found '+results.length);
        if ((results.length > 0) && (results[0].courses[0].assessments)) {
          var assessments = results[0].courses[0].assessments;
          if (assessments.length > 0) {
            console.log('assessments found '+assessments.length);
            assessments.sort(function (a, b) {
              if (a.name > b.name) {
                return 1;
              };
              if (a.name < b.name) {
                return -1;
              };
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
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if ((req.session.current_course_id) && (req.session.current_course_id.length > 0)) {
        db.collection("users").find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {_id: 0, 'courses.$': 1}).toArray(function(error, results) {
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
    } else {
      res.redirect('/sorry');
    }; 
  });

  app.post('/assessments', function(req, res) {
    if ((!req.session) || (req.session.user_id == null)) {
        console.log('user is not logged in');
    }
    else if (req.session.current_course_id.length === 0) {
      console.log('no course selected');
      res.redirect('/dashboard');
    }
    else if (req.body.name.length === 0) {
      console.log('name cannot be blank');
      res.redirect('/assessments/new');
    } 
    else {
      db.collection('users').update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {$push: {"courses.$.assessments": {_id: ObjectId(), name: req.body.name.toLowerCase(), type: req.body.type, points: req.body.points, weight: req.body.weight}}}, function(error, results) {
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
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.params.id === '0') {
        req.session.current_assessment_id = "";
      } else {
        req.session.current_assessment_id = req.params.id;
      }; 
      res.redirect('/dashboard');
    };
  });


  // STUDENTS -----------------------------------------------------

  app.get('/students/new', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      res.render('students/new');
    } else {
      res.redirect('/sorry');
    };
  });

  app.post('/students', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.body.first_name.length === 0) {
        res.redirect('/users/new');
        console.log('first name cannot be blank');
      }
      else if (req.body.last_name.length === 0) {
        res.redirect('/users/new');
        console.log('last name cannot be blank');
      } 
      else {
        db.collection('students').insert({first_name: req.body.first_name.toLowerCase(), last_name: req.body.last_name.toLowerCase(), email: req.body.email, identification: req.body.identification, grad_year: req.body.grad_year}, function(error, results) {
            res.redirect('/dashboard');
        });
      };
    } else {
      res.redirect('/sorry');
    };
  });

  app.get('/students', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      //if course is selected then need to filter students by course enrolled
      if (req.session.current_course_id.length > 0) {
        db.collection("students").find({course_ids: {$elemMatch: {id: ObjectId(req.session.current_course_id)}}}).toArray(function(error, students) {
          if (students.length > 0) {
            students.sort(function (a, b) {
              if (a.last_name > b.last_name) {
                return 1;
              }
              if (a.last_name < b.last_name) {
                return -1;
              }
              return 0;
            });
            students.map(function(student) {
              student.first_name = student.first_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
              student.last_name = student.last_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            });
            res.json(students);
          } else {
            res.json({});
          }
        });
      } else {  //all students
        db.collection('students').find({}).toArray(function(error, students) {
          console.log('students found '+students.length);
          if (students.length > 0) {
            students.sort(function (a, b) {
              if (a.last_name > b.last_name) {
                return 1;
              };
              if (a.last_name < b.last_name) {
                return -1;
              };
              return 0;
            });
            students.map(function(student) {
              student.first_name = student.first_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
              student.last_name = student.last_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            });
            console.log('returning json '+students);
            req.session.current_course_id = "";
            req.session.current_assessment_id = "";
            res.json(students);
          } else {
            res.json({});
          }
        });
      }
    } else {
      res.json({});
    };
  });

  app.post('/current_student/:id', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.params.id === '0') {
        req.session.current_student_id = "";
      } else {
        req.session.current_student_id = req.params.id;
      }; 
      console.log('current student on the server is '+current_student_id);
      res.redirect('/dashboard');
    };
  });

  app.patch('/students/:id/enroll', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null) && (req.session.current_course_id.length > 0)) {
      //add course to student
      var result = db.collection("students").update({_id: ObjectId(req.params.id)}, {$push: {course_ids: {id: ObjectId(req.session.current_course_id)}}}); 
      //add student to course
      db.collection("users").update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {$push: {"courses.$.student_ids": {id: ObjectId(req.params.id)}}});
      res.json(result); //write result object (not used)
    } else {
      res.json({});
    }
  });

  app.patch('/students/:id/unenroll', function(req, res) {
    //this route needs to be protected once students have grades entered
    if ((req.session.user_id) && (req.session.user_id != null) && (req.session.current_course_id.length > 0)) {
      //remove course from student
      var result = db.collection("students").update({_id: ObjectId(req.params.id)}, {$pull: {course_ids: {id: ObjectId(req.session.current_course_id)}}}); 
      //remove student from course
      db.collection("users").update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {$pull: {"courses.$.student_ids": {id: ObjectId(req.params.id)}}});
      res.json(result); //write result object (not used)
    } else {
      res.json({});
    }
  });

  app.post('/grade', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null) && (req.session.current_course_id.length > 0) && (req.session.current_assessment_id.length > 0) && (req.session.current_student_id.length > 0)) {
      var score = req.params.score;
      var points = req.params.points;
      var frac_score = (score / points);
      console.log('the score is '+score);
      console.log('the points is '+points);
      res.json({});

      // //add score to student
      // db.collection('students').update({_id: ObjectId(current_student_id)}, 
      //   {$push: {assessments: {assessment_id: ObjectId(current_assessment_id),
      //     score: score}}});

      // //add student score to course/assessment
      // db.collection('users').update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(current_course_id), "courses.assessments._id": ObjectId(current_assessment_id)}, {$push: {"courses.assessments.$.student_scores": {student_id: ObjectId(current_student_id), score: }}});

    };


  });



	 // CLEAN UP ---------------------------------------------------

  process.on('exit', function() {
    db.close();
  });


});

