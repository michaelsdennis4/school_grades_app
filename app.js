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
//var mongoUri    = 'mongodb://localhost:27017/school_grades'

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({secret: 'enifohqeni'}));  
app.use(express.static('public'));
app.set('view engine', 'ejs');


var session;


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
	  res.render('index.ejs')
	});

  app.post('/login', function(req, res) {
    db.collection('users').find({email: req.body.email}).toArray(function(error, results) {
      if ((error) || (results.length == 0)) {
        console.log('user not found');
        res.json({message: 'User not found'});
      } 
      else {
        var user = results[0];
        if (bcrypt.compareSync(req.body.password, user.password_digest) === true) {
          session = req.session;
          session.user_id = user._id;
          user.first_name = user.first_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
          user.last_name = user.last_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
          session.username = user.first_name +' '+user.last_name;
          session.current_term = user.current_term;
          session.current_course_id = "";
          session.current_assessment_id = "";
          session.current_student_id = "";
          console.log('user logged in!');
          //res.redirect('/dashboard');
          res.json({message: 'ok'});
        } else {
          //res.redirect('/');
          console.log('password incorrect');
          res.json({message: 'Password incorrect'});
        };
      };
    });
  });

  app.get('/logout',function(req, res) {
    req.session.user_id = null;
    req.session.username = null;
    req.session.current_term = null;
    req.session.current_course_id = null;
    req.session.current_assessment_id = null;
    req.session.current_student_id = null;
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
      res.render('dashboard', {session: req.session});
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

  app.get('/users/edit', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      db.collection('users').find({_id: ObjectId(req.session.user_id)}).toArray(function(error, results) {
        if (!error) {
          var user = results[0];
          res.render('users/edit.ejs', {user: user});
        } else {
          res.redirect('/dashboard');
        };
    });
    } else {
      res.redirect('/sorry');
    };  
  });

  app.post('/users', function(req, res){
    db.collection('users').find({email: req.body.email}).toArray(function(error, users) {
      if (users.length > 0) {
        //res.redirect('/users/new');
        console.log('the user already exists');
        res.json({message: 'User already exists'});
      } 
      else if (req.body.password != req.body.password_confirmation) { 
        //res.redirect('/users/new');
        console.log('passwords do not match');
        res.json({message: 'Passwords do not match'});
      } 
      else if (req.body.first_name.length === 0) {
        //res.redirect('/users/new');
        console.log('first name cannot be blank');
        res.json({message: 'First name cannot be blank'});
      }
      else if (req.body.last_name.length === 0) {
        //res.redirect('/users/new');
        console.log('last name cannot be blank');
        res.json({message: 'Last name cannot be blank'});
      }
      else if (req.body.email.length === 0) {
        //res.redirect('/users/new');
        console.log('email cannot be blank');
        res.json({message: 'Email cannot be blank'});
      }
      else if (req.body.password.length < 6) {
        //res.redirect('/users/new');
        console.log('password too short');
        res.json({message: 'Password must be at least 6 characters.'});
      }
      else {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.password, salt);
        var new_user = {first_name: req.body.first_name, last_name: req.body.last_name, email: req.body.email, password_digest: hash, current_term: "2015.1"};
        db.collection('users').insert(new_user, function(error, result) {
          if ((!error) && (result)) {
            console.log('new user id is '+new_user._id);
            session = req.session;
            session.user_id = new_user._id;
            new_user.first_name = new_user.first_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            new_user.last_name = new_user.last_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            session.username = new_user.first_name +' '+new_user.last_name;
            session.current_term = new_user.current_term;
            session.current_course_id = "";
            session.current_assessment_id = "";
            session.current_student_id = "";
            console.log('user logged in!');
            //res.redirect('/dashboard');
            res.json({message: 'ok'});
          } else {
            //res.redirect('/users/new');
            console.log('error creating user');
            res.json({message: 'Error creating user'});
          };
        });
      };
    });
  });

  app.patch('/users', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.body.first_name.length === 0) {
          //res.redirect('/users/edit');
          console.log('first name cannot be blank');
          res.json({message: 'First name cannot be blank'});
      }
      else if (req.body.last_name.length === 0) {
        //res.redirect('/users/edit');
        console.log('last name cannot be blank');
        res.json({message: 'Last name cannot be blank'});
      }
      else if (req.body.email.length === 0) {
        //res.redirect('/users/edit');
        console.log('email cannot be blank');
        res.json({message: 'Email cannot be blank'});
      }
      else {
        db.collection('users').update({_id: ObjectId(req.session.user_id)}, {$set: {first_name: req.body.first_name, last_name: req.body.last_name, email: req.body.email}}, function(error, result) {
          if (!error) {
            req.body.first_name = req.body.first_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            req.body.last_name = req.body.last_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            req.session.username = req.body.first_name +' '+req.body.last_name;
          };
          res.json({message: 'ok'});
        });     
      };
    } else {
      //res.redirect('/sorry');
      res.json({message: 'sorry'});
    };
  });

  app.patch('/users/password', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.body.new_password.length < 6) {
        //res.redirect('/users/new');
        console.log('password too short');
        res.json({message: 'Password must be at least 6 characters.'});
      } else {
        db.collection('users').find({_id: ObjectId(req.session.user_id)}).toArray(function(error, results) {
          if ((!error) && (results) && (results.length > 0)) {
            var user = results[0];
            if (req.body.new_password != req.body.confirm_new_password) { 
              console.log('new passwords do not match');
              //res.redirect('/users/edit');
              res.json({message: 'New passwords do not match'});
            } else if (bcrypt.compareSync(req.body.old_password, user.password_digest) === true) {
              var salt = bcrypt.genSaltSync(10);
              var hash = bcrypt.hashSync(req.body.new_password, salt);
              db.collection('users').update({_id: ObjectId(user._id)}, {$set: {password_digest: hash}}, function(error, result) {
                if ((!error) && (result)) {
                  console.log('password changed');
                  //res.redirect('/dashboard');
                  res.json({message: 'ok'});
                } else {
                  console.log('error updating password');
                  //res.redirect('/users/edit');
                  res.json({message: 'Error updating password'});
                };
              });
            } else {
              console.log('incorrect password');
              //res.redirect('/users/edit');
              res.json({message: 'Existing password incorrect'});
            };
          } else {
            console.log('user not found');
            //res.redirect('/logout');
            res.json({message: 'User not found'});
          };
        });
      };
    } else {
      //res.redirect('/sorry');
      res.json({message: 'sorry'});
    };
  });

  app.delete('/users', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      //delete all this user's students
      db.collection('students').remove({user_id: ObjectId(req.session.user_id)}, {multi: true}, function(error, results) {
        if (!error) {
          console.log("user's students deleted");
        } else {
          console.log("error deleting user's students");
        };
      });
      //delete the user
      db.collection('users').remove({_id: ObjectId(req.session.user_id)}, function(error, result) {
        if (!error) {
          console.log('user deleted');
          //res.redirect('/logout');
          res.json({message: 'ok'});
        } else {
          console.log('error deleting user');
          //res.redirect('/users/edit');
          res.json({message: 'Error deleting user'});
        };
      });
    } else {
      //res.redirect('/sorry');
      res.json({message: 'sorry'});
    };
  });

  app.patch('/term', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      var term = req.body.current_year+'.'+req.body.current_term;
      db.collection('users').update({_id: ObjectId(req.session.user_id)}, {$set: {current_term: term}}, function(error, result) {
        if (!error) {
          req.session.current_term = term;
          req.session.current_course_id = "";
          req.session.current_assessment_id = "";
          req.session.current_student_id = "";
          res.render('dashboard.ejs', {session: req.session});
        } else {
          res.redirect('/dashboard');
        };
      });      
    } else {
      res.redirect('/sorry');
    }
  });



//COURSES -----------------------------------------------

  app.get('/courses', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      var term;
      if (req.query.term) {
        term = req.query.term;
      } else {
        term = req.session.current_term;
      };
      db.collection('users').find({_id: ObjectId(req.session.user_id)}).toArray(function(error, results) { 
        var courses = [];
        if ((!error) && (results) && (results.length > 0) && (results[0].courses) && (results[0].courses.length > 0)) {
          results[0].courses.forEach(function(course) {
            if (course.term === term) {
              courses.push(course);
            };
          });
          if (courses.length > 0) {
            courses.sort(function (a, b) {
              if (a.title.toLowerCase()+a.section > b.title.toLowerCase()+b.section) {
                return 1;
              }
              if (a.title.toLowerCase()+a.section < b.title.toLowerCase()+b.section) {
                return -1;
              }
              return 0;
            });
            courses.map(function(course) {
              course.title = course.title.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            });
          }; 
        };
        //get all student scores (for current user only)
        var student_scores = [];
        db.collection('students').find({}).toArray(function(error, results) {
          if ((!error) && (results) && (results.length > 0)) {
            results.forEach(function(student) {
              if ((student.scores) && (student.scores.length > 0)) {
                student.scores.forEach(function(score) {
                    student_scores.push(score);
                });
              };
            });
          }; 
          console.log('returning '+courses.length+' courses');
          console.log('returning '+student_scores.length+' student scores');
          res.json({courses: courses, student_scores: student_scores});
        });
      });
    } else {
      res.json({courses: [], student_scores: []});
    };
  });
  
  app.get('/courses/new', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      res.render('courses/new.ejs');
    } else {
      res.redirect('/sorry');
    }; 
  });

  app.get('/courses/edit', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.session.current_course_id.length > 0) {
        db.collection('users').find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {_id: 0, "courses.$": 1}).toArray(function(error, results) {
          if ((results) && (results.length > 0) && (results[0].courses) && (results[0].courses.length > 0)) {
            var course = results[0].courses[0];
            res.render('courses/edit.ejs', {course: course});
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

  app.post('/courses', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.body.title.length === 0) {
        //res.redirect('/courses/new');
        console.log('title cannot be blank');
        res.json({message: 'Title cannot be blank'});
      } 
      else {
        var term = req.body.year+'.'+req.body.term;
        var new_course = {_id: ObjectId(), title: req.body.title, section: req.body.section, term: term, auto: req.body.auto}; 
        db.collection('users').update({_id: ObjectId(req.session.user_id)}, {$push: {courses: new_course}}, function(error, results) {
          if (!error) {
            console.log('new course created');
            //res.redirect('/dashboard');
            //update current course to one just created
            req.session.current_course_id = new_course._id;
            console.log("current course updated "+req.session.current_course_id);
            res.json({message: 'ok'});
          } else {
            console.log('error creating course');
            //res.redirect('/courses/new');
            res.json({message: 'Error creating course'});
          };
        });
      };
    } else {
      res.json({message: 'sorry'});
    };
  });

  app.patch('/courses', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.session.current_course_id.length > 0) {
        if (req.body.title.length === 0) {
          //res.redirect('/courses/edit');
          console.log('title cannot be blank');
          res.json({message: 'Title cannot be blank'});
        } else { 
          var term = req.body.year+'.'+req.body.term;
          db.collection('users').update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {$set: {"courses.$.title": req.body.title, "courses.$.section": req.body.section, "courses.$.term": term, "courses.$.auto": req.body.auto}}, function(error, result) {
            if (!error) {
              console.log('course updated');
              //res.redirect('/dashboard'); 
              res.json({message: 'ok'});
            } else {
              console.log('error updating course');
              //res.redirect('/courses/edit');
              res.json({message: 'Error updating course'});
            };
          });
        };
      } else {
        console.log("no course selected");
        //res.redirect('/dashboard');
        res.json({message: 'No course selected'});
      };
    } else {
      //res.redirect('/sorry');
      res.json({message: 'sorry'});
    };
  });

  app.delete('/courses', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.session.current_course_id.length > 0) {
        //delete all scores for this course
        db.collection('students').update({user_id: ObjectId(req.session.user_id), "scores.course_id": ObjectId(req.session.current_course_id)}, {$pull: {scores: {course_id: ObjectId(req.session.current_course_id)}}}, {multi: true}, function(error, result) {
          if (!error) {
            console.log('course scores deleted');           
          } else {
            console.log('error deleting course scores');
          };
        });
        //delete this course from students enrolled in
        db.collection('students').update({user_id: ObjectId(req.session.user_id), "course_ids.id": ObjectId(req.session.current_course_id)}, {$pull: {course_ids: {id: ObjectId(req.session.current_course_id)}}}, {multi: true}, function(error, result) {
          if (!error) {
            console.log('students unenrolled from course');           
          } else {
            console.log('error unenrolling students from course');
          };
        });
        //delete course
        db.collection('users').update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {$pull: {courses: {_id: ObjectId(req.session.current_course_id)}}}, function(error, results) {
          if (!error) {
            console.log('course deleted');
            //res.redirect('/dashboard');
            res.json({message: 'ok'});
          } else {
            console.log('error deleting course');
            //res.redirect('/courses/edit');
            res.json({message: 'Error deleting course'});
          };
        });
      } else {
        console.log("no course selected");
        //res.redirect('/dashboard');
        res.json({message: 'No course selected'});
      };
    } else {
      //res.redirect('/sorry');
      res.json({message: 'sorry'});
    };
  });

  app.post('/current_course/:id', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.params.id === '0') {
        req.session.current_course_id = "";
      } else {
        req.session.current_course_id = req.params.id;
      };
      //clear current assessment and student when changing current course
      //req.session.current_assessment_id = "";
      //req.session.current_student_id = "";
      console.log("current course updated "+req.session.current_course_id);
      res.json({});
    };
  });

  app.get('/enrollment', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null) && (req.session.current_course_id.length > 0)) {
      db.collection("users").find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {_id: 0, 'courses.$': 1}).toArray(function(error, results) {
        if ((results.length > 0) && (results[0].courses.length > 0)) {
          var course = results[0].courses[0];
          db.collection("students").find({user_id: ObjectId(req.session.user_id), is_active: "true"}).toArray(function(error, students) {
            if (students.length > 0) {
              students.sort(function (a, b) {
                if (a.last_name.toLowerCase() > b.last_name.toLowerCase()) {
                  return 1;
                }
                if (a.last_name.toLowerCase() < b.last_name.toLowerCase()) {
                  return -1;
                }
                return 0;
              });
              students.forEach(function(student) {
                student.first_name = student.first_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
                student.last_name = student.last_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
                student.advisor = student.advisor.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
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

  app.get('/courses/copy', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {  
      var terms = [];
      db.collection('users').distinct("courses.term", function(error, results) {
        if ((!error) && (results) && (results.length > 0)) {
          terms = results;
          terms.sort(function (a, b) {
            if (a < b) {
              return 1;
            }
            if (a > b) {
              return -1;
            }
            return 0;
          });
        };
        res.render('courses/copy.ejs', {session: req.session, terms: terms});
      });     
    } else {
      res.redirect('/sorry');
    };
  });

  app.post('/courses/:id/copy', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      db.collection('users').find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.params.id)}, {_id: 0, "courses.$": 1}).toArray(function(error, results) {
        if ((results) && (results.length > 0) && (results[0].courses) && (results[0].courses.length > 0)) {
          var original_course = results[0].courses[0];
          var new_course;
          console.log('copy students is '+req.body.copy_students);
          if (req.body.copy_students === 'true') {
            new_course = {_id: ObjectId(), title: original_course.title, section: original_course.section, term: req.session.current_term, auto: original_course.auto, student_ids: original_course.student_ids};
          } else {
            new_course = {_id: ObjectId(), title: original_course.title, section: original_course.section, term: req.session.current_term, auto: original_course.auto};
          };
          //create new course
          db.collection('users').update({_id: ObjectId(req.session.user_id)}, {$push: {courses: new_course}}, function(error, results) {
            if (!error) {
              console.log('course copied');
              //add course to students
              if (req.body.copy_students === 'true') {
                new_course.student_ids.forEach(function(student) {
                  db.collection('students').update({_id: ObjectId(student.id)}, {$push: {course_ids: {id: new_course._id}}}, function(error, result) {
                    if (!error) {
                      console.log('student '+student.id+' added to course');
                    } else {
                      console.log('error adding student '+student.id+' to course');
                    };
                  });
                });
              };
              res.json({result: true});             
            } else {
              console.log('error copying course');
              res.json({result: false});
            };
          });
        } else {
          console.log('course not found');
          res.json({result: false});
        };
      });
    } else {
      res.json({result: false});
    };
  });


//ASSESSMENTS --------------------------------------------------

  app.get('/assessments', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null) && (req.session.current_course_id.length > 0)) {
      var assessments = [];
      db.collection('users').find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {_id: 0, 'courses.$': 1}).toArray(function(error, results) {  
        if ((!error) && (results) && (results.length > 0) && (results[0].courses[0].assessments)) {
          assessments = results[0].courses[0].assessments;
          if (assessments.length > 0) {
            assessments.map(function(assessment) {
              assessment.name = assessment.name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            });
          };
        };
        //get all student scores for this course
        var student_scores = [];
        db.collection('students').find({}).toArray(function(error, results) {
          if ((!error) && (results) && (results.length > 0)) {
            results.forEach(function(student) {
              if ((student.scores) && (student.scores.length > 0)) {
                student.scores.forEach(function(score) {
                  if (score.course_id.toString() == req.session.current_course_id.toString()) {
                    student_scores.push(score);
                  };
                });
              };
            });
          }; 
          console.log('returning '+assessments.length+' assessments');
          console.log('returning '+student_scores.length+' student scores');
          res.json({assessments: assessments, student_scores: student_scores});
        });
      });
    } else {
      res.json({assessments: [], student_scores: []});
    };
  });

  app.get('/assessments/new', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.session.current_course_id.length > 0) {
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

  app.get('/assessments/edit', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if ((req.session.current_course_id.length > 0) && (req.session.current_assessment_id.length > 0)) {
        db.collection("users").find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {_id: 0, 'courses.$': 1}).toArray(function(error, results) {
          if (results.length > 0) {
            var course = results[0].courses[0];
            for (var i=0; i< course.assessments.length; i++) {
              if (course.assessments[i]._id.toString() == req.session.current_assessment_id.toString()) {
                var assessment = course.assessments[i];
                var position = i;
                break;
              };
            };
            if (assessment) {
              res.render('assessments/edit.ejs', {course: course, assessment: assessment, position: position});
            } else {
              res.redirect('/dashboard');
            };
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
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.session.current_course_id.length === 0) {
        console.log('no course selected');
        //res.redirect('/dashboard');
        res.json({message: 'No course selected'});
      }
      else if (req.body.name.length === 0) {
        console.log('name cannot be blank');
        //res.redirect('/assessments/new');
        res.json({message: 'Name cannot be blank'});
      } 
      else {
        var weight;
        if (req.body.weight) {
          weight = req.body.weight;
        } else {
          weight = req.body.points;
        };
        var new_assessment = {_id: ObjectId(), name: req.body.name, type: req.body.type, points: req.body.points, weight: weight};
        db.collection('users').update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {$push: {"courses.$.assessments": new_assessment}}, function(error, results) {
          if (!error) {
            console.log('new assessment created');
            //res.redirect('/dashboard');
            //update current assessment to one just created
            req.session.current_assessment_id = new_assessment._id;
            console.log("current assessment updated "+req.session.current_assessment_id);
            res.json({message: 'ok'});
          } else {
            console.log('error creating assessment');
            //res.redirect('/assessments/new');
            res.json({message: 'Error creating assessment'});
          };
        });
      };
    } else {
      res.json({message: 'sorry'});
    };
  });

  app.patch('/assessments', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if ((req.session.current_course_id.length > 0) && (req.session.current_assessment_id.length > 0)) {
        if (req.body.name.length === 0) {
          console.log('name cannot be blank');
          //res.redirect('/assessments/edit');
          res.json({message: 'Name cannot be blank'});
        } 
        else {
          var weight;
          if (req.body.weight) {
            weight = req.body.weight;
          } else {
            weight = req.body.points;
          };
          var updateNode = {};
          var key = "courses.$.assessments."+parseInt(req.body.position)+".name";
          updateNode[key] = req.body.name;
          key = "courses.$.assessments."+parseInt(req.body.position)+".type";
          updateNode[key] = req.body.type;
          key = "courses.$.assessments."+parseInt(req.body.position)+".points";
          updateNode[key] = req.body.points;
          key = "courses.$.assessments."+parseInt(req.body.position)+".weight";
          updateNode[key] = weight;
          db.collection('users').update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id), "courses.assessments._id": ObjectId(req.session.current_assessment_id)}, {$set: updateNode}, function(error, result) {
            if (!error) {
              console.log('assessment updated');
              //update points and weight for all student scores for this assessment
              db.collection("students").update({"scores.assessment_id": ObjectId(req.session.current_assessment_id)}, {$set: {"scores.$.points": req.body.points, "scores.$.weight": weight}}, {multi: true}, function(error, result) {
                if (!error) {
                  console.log('student scores updated');
                  //res.redirect('/dashboard');
                  res.json({message: 'ok'});
                } else {
                  console.log('error updating student scores');
                  //res.redirect('/assessments/edit');
                  res.json({message: 'Error updating student scores'});
                };
              });
            } else {
              console.log('error updating assessment');
              //res.redirect('/assessments/edit');
              res.json({message: 'Error updating assessment'});
            };
          });
        };
      } else {
        console.log('no assessment selected');
        //res.redirect('/dashboard');
        res.json({message: 'No assessment selected'});
      };
    } else {
      //res.redirect('/sorry');
      res.json({message: 'sorry'});
    };
  });

  app.delete('/assessments', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if ((req.session.current_course_id.length > 0) && (req.session.current_assessment_id.length > 0)) {
        //delete student scores for this assessment
        db.collection('students').update({user_id: ObjectId(req.session.user_id), "scores.assessment_id": ObjectId(req.session.current_assessment_id)}, {$pull: {scores: {assessment_id: ObjectId(req.session.current_assessment_id)}}}, {multi: true}, function(error, result) {
          if (!error) {
            console.log('student scores deleted');           
          } else {
            console.log('error deleting student scores');
          };
        });
        //delete assessment
        db.collection('users').update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {$pull: {"courses.$.assessments": {_id: ObjectId(req.session.current_assessment_id)}}}, function(error, results) {
          if (!error) {
            console.log('assessment deleted');
            //res.redirect('/dashboard');
            res.json({message: 'ok'});
          } else {
            console.log('error deleting assessment');
            //res.redirect('/assessments/edit');
            res.json({message: 'Error deleting assessment'});
          };
        });
      } else {
        console.log('no assessment selected');
        //res.redirect('/dashboard');
        res.json({message: 'No assessment selected'});
      };
    } else {
      //res.redirect('/sorry');
      res.json({message: 'sorry'});
    };
  });

  app.post('/current_assessment/:id', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.params.id === '0') {
        req.session.current_assessment_id = "";
      } else {
        req.session.current_assessment_id = req.params.id;
      }; 
      console.log("current assessment updated "+req.session.current_assessment_id);
      res.json({});
    };
  });


// STUDENTS -----------------------------------------------------

  app.get('/students', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      var students = [];
      //if course is selected then need to filter students by course enrolled
      if (req.session.current_course_id.length > 0) {
        db.collection("students").find({user_id: ObjectId(req.session.user_id), course_ids: {$elemMatch: {id: ObjectId(req.session.current_course_id)}}}).toArray(function(error, results) {
          if (results.length > 0) {
            students = results;
            students.sort(function (a, b) {
              if (a.last_name.toLowerCase()+a.first_name.toLowerCase() > b.last_name.toLowerCase()+b.first_name.toLowerCase()) {
                return 1;
              }
              if (a.last_name.toLowerCase()+a.first_name.toLowerCase() < b.last_name.toLowerCase()+b.first_name.toLowerCase()) {
                return -1;
              }
              return 0;
            });
            students.forEach(function(student) {
              student.first_name = student.first_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
              student.last_name = student.last_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
              student.advisor = student.advisor.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            });
          };
          console.log('returning '+students.length+' students');
          res.json(students);
        });
      } else {  //all students
        db.collection('students').find({user_id: ObjectId(req.session.user_id), is_active: "true"}).toArray(function(error, results) {
          if (results.length > 0) {
            students = results;
            students.sort(function (a, b) {
              if (a.last_name.toLowerCase()+a.first_name.toLowerCase() > b.last_name.toLowerCase()+b.first_name.toLowerCase()) {
                return 1;
              }
              if (a.last_name.toLowerCase()+a.first_name.toLowerCase() < b.last_name.toLowerCase()+b.first_name.toLowerCase()) {
                return -1;
              }
              return 0;
            });
            students.forEach(function(student) {
              student.first_name = student.first_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
              student.last_name = student.last_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
              student.advisor = student.advisor.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            });
            req.session.current_course_id = "";
            req.session.current_assessment_id = "";
          }; 
          console.log('returning '+students.length+' students');
          res.json(students);
        });
      };
    } else {
      res.json([]);
    };
  });

  app.get('/students/new', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.session.current_course_id.length > 0) {
        db.collection('users').find({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {_id: 0, "courses.$": 1}).toArray(function(error, results) {
          if ((results) && (results.length > 0)) {
            var course = results[0].courses[0]; 
            res.render('students/new.ejs', {course: course});
          } else {
            res.render('students/new.ejs', {course: null});
          }
        });
      } else {
        res.render('students/new.ejs', {course: null});
      };
    } else {
      res.redirect('/sorry');
    };
  });

  app.get('/students/edit', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.session.current_student_id.length > 0) {
        db.collection("students").find({_id: ObjectId(req.session.current_student_id)}).toArray(function(error, results) {
          if ((results) && (results.length > 0)) {
            var student = results[0];
            student.first_name = student.first_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            student.last_name = student.last_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            student.advisor = student.advisor.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            res.render('students/edit.ejs', {student: student});
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

  app.post('/students', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.body.first_name.length === 0) {
        console.log('first name cannot be blank');
        //res.redirect('/students/new'); 
        res.json({message: 'First name cannot be blank'}); 
      } else if (req.body.last_name.length === 0) {
        console.log('last name cannot be blank');
        //res.redirect('/students/new');
        res.json({message: 'Last name cannot be blank'}); 
      } else {
        var new_student = {user_id: ObjectId(req.session.user_id), first_name: req.body.first_name, last_name: req.body.last_name, email: req.body.email, identification: req.body.identification, advisor: req.body.advisor, grad_year: req.body.grad_year, is_active: req.body.is_active};
        db.collection('students').insert(new_student, function(error, results) {
          if (!error) {
            console.log('student added');
            //enroll student in current course, if selected
            if (req.body.enroll) {
              //add course to student
              db.collection("students").update({_id: ObjectId(new_student._id)}, {$push: {course_ids: {id: ObjectId(req.session.current_course_id)}}}, function(error, result) {
                if (!error) {
                  //add student to course
                  db.collection("users").update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {$push: {"courses.$.student_ids": {id: ObjectId(new_student._id)}}}, function(error, result) {
                    if (!error) {
                      console.log('student enrolled');
                    };
                  });
                };
              });
            };
            //res.redirect('/dashboard');
            //update current student to one just created
            req.session.current_student_id = new_student._id;
            console.log("current student updated "+req.session.current_student_id);
            res.json({message: 'ok'});
          } else {
            console.log('error adding student');
            //res.redirect('/students/new');
            res.json({message: 'Error adding student'}); 
          };
        });   
      };
    } else {
      //res.redirect('/sorry');
      res.json({message: 'sorry'}); 
    };
  });

  app.patch('/students', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.session.current_student_id.length > 0) {
        if (req.body.first_name.length === 0) {
          //res.redirect('/students/edit');
          console.log('first name cannot be blank');
          res.json({message: 'First name cannot be blank'});
        } else if (req.body.last_name.length === 0) {
          //res.redirect('/students/edit');
          console.log('last name cannot be blank');
          res.json({message: 'Last name cannot be blank'});
        } else {
          var is_active = 'false';
          if ((req.body.is_active) && (req.body.is_active === 'true')) {
            is_active = 'true';
          };
          db.collection('students').update({_id: ObjectId(req.session.current_student_id)}, {$set: {first_name: req.body.first_name, last_name: req.body.last_name, email: req.body.email, identification: req.body.identification, advisor: req.body.advisor, grad_year: req.body.grad_year, is_active: is_active}}, function(error, result) {
            if (!error) {
              console.log("student profile updated");
              //res.redirect('/dashboard');
              res.json({message: 'ok'});
            } else {
              console.log('error updating student profile');
              //res.redirect('/students/edit');
              res.json({message: 'Error updating student profile'});
            };
          });
        };
      } else {
        console.log('no student selected');
        //res.redirect('/dashboard');
        res.json({message: 'No student selected'});
      };
    } else {
      //res.redirect('/sorry');
      res.json({message: 'sorry'});
    };
  });

  app.delete('/students', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.session.current_student_id.length > 0) {
        //unenroll from courses
        db.collection('students').find({_id: ObjectId(req.session.current_student_id)}).toArray(function(error, results) {
          if ((results) && (results.length > 0)) {
            if ((results[0].course_ids) && (results[0].course_ids.length > 0)) {
              var course_ids = results[0].course_ids;
              for (var i=0; i < course_ids.length; i++) {
                var course_id = course_ids[i].id;
                //remove student from course
                db.collection("users").update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(course_id)}, {$pull: {"courses.$.student_ids": {id: ObjectId(req.session.current_student_id)}}}, function(error, result) {
                  if (!error) {
                    console.log('student unenrolled');
                  } else {
                    console.log('error unenrolling student');
                  };
                });
              };
            };
          };
        });
        //delete student, including scores
        db.collection('students').remove({_id: ObjectId(req.session.current_student_id)}, function(error, result) {
          if (!error) {
            console.log('student deleted');
            //res.redirect('/dashboard');
            res.json({message: 'ok'});
          } else {
            console.log('error deleting student');
            //res.redirect('/students/edit');
            res.json({message: 'Error deleting student'});
          };
        });
      } else {
        console.log('no student selected');
        //res.redirect('/dashboard');
        res.json({message: 'No student selected'});
      };
    } else {
      //res.redirect('/sorry');
      res.json({message: 'sorry'});
    };
  });

  app.post('/current_student/:id', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null)) {
      if (req.params.id === '0') {
        req.session.current_student_id = "";
      } else {
        req.session.current_student_id = req.params.id;
      }; 
      console.log("current student updated "+req.session.current_student_id);
      res.json({});
    };
  });

  app.patch('/students/:id/enroll', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null) && (req.session.current_course_id.length > 0)) {
      //add course to student
      db.collection("students").update({_id: ObjectId(req.params.id)}, {$push: {course_ids: {id: ObjectId(req.session.current_course_id)}}}, function(error, result) {
        if (!error) {
          //add student to course
          db.collection("users").update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {$push: {"courses.$.student_ids": {id: ObjectId(req.params.id)}}}, function(error, result) {
            if (!error) {
              res.json(result); //write result object (not used)
            };
          });
        };
      });
    };
  });

  app.patch('/students/:id/unenroll', function(req, res) {
    //this route needs to be protected once students have grades entered
    if ((req.session.user_id) && (req.session.user_id != null) && (req.session.current_course_id.length > 0)) {
      //remove course from student
      db.collection("students").update({_id: ObjectId(req.params.id)}, {$pull: {course_ids: {id: ObjectId(req.session.current_course_id)}}}, function(error, result) {
        if (!error) {
          //remove student from course
          db.collection("users").update({_id: ObjectId(req.session.user_id), "courses._id": ObjectId(req.session.current_course_id)}, {$pull: {"courses.$.student_ids": {id: ObjectId(req.params.id)}}}, function(error, result) {
            if (!error) {
              res.json(result); //write result object (not used)
            };
          });
        };
      }); 
    };
  });

  app.post('/grade', function(req, res) {
    if ((req.session.user_id) && (req.session.user_id != null) && (req.session.current_course_id.length > 0) && (req.session.current_assessment_id.length > 0) && (req.session.current_student_id.length > 0)) {
      var score = req.body.score;
      var points = req.body.points;
      var weight = req.body.weight;
      //first check if there is already a score
      db.collection('students').find({_id: ObjectId(req.session.current_student_id), "scores.assessment_id": ObjectId(req.session.current_assessment_id)}, {_id: 0, "scores.$": 1}).toArray(function(error, results) {
        if ((results) && (results.length > 0)) {
          //edit existing score
          db.collection('students').update({_id: ObjectId(req.session.current_student_id), "scores.assessment_id": ObjectId(req.session.current_assessment_id)}, {$set: {"scores.$.score": score, "scores.$.points": points, "scores.$.weight": weight}}, function(error, result) {
            if (!error) {
              console.log('grade updated '+ result);
              res.json({status: true});
            } else {
              console.log('error updating grade');
              res.json({status: false});
            }
          });
        } else {
          //add score to student
          db.collection('students').update({_id: ObjectId(req.session.current_student_id)}, {$push: {scores: {course_id: ObjectId(req.session.current_course_id), assessment_id: ObjectId(req.session.current_assessment_id), score: score, points: points, weight: weight}}}, function(error, result) {
            if (!error) {
              console.log('grade entered '+ result);
              res.json({status: true});
            } else {
              console.log('error entering grade');
              res.json({status: false});
            };
          });
        };   
      }); 
    } else {
      res.json({status: false});
    };
  });



	 // CLEAN UP ---------------------------------------------------

  process.on('exit', function() {
    db.close();
  });


});

