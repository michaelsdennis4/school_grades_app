var $ = require('jQuery');

var React = require('react');
var ReactDOM = require('react-dom');

$('document').ready(function() {

  console.log('main.js loaded!');

  if (document.body.id === 'dashboard') {

    //REACT

    var CoursesTable = React.createClass({
      loadCoursesFromServer: function() {
        $.ajax({
          url: this.props.url,
          dataType: 'json',
          cache: false,
          success: function(data) {
            this.setState({courses: data});
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
      },
      getInitialState: function() {
        return {courses: []};
      },
      componentDidMount: function() {
        this.loadCoursesFromServer();
        //setInterval(this.loadCoursesFromServer, this.props.pollInterval);
      },
      handleClick: function() {
        assessments_table.loadAssessmentsFromServer();
      },
      render: function() {
    	  return (
          <table className="data-table" id="courses" onClick={this.handleClick}>
    	      <thead>
    	    		<tr className="table-header">
                <th className="hidden">Course ID</th>
    	    			<th>Course Title</th>
    	    			<th className="right">Sec.</th>
    	    			<th className="right">Auto Wt.</th>
                <th className="right"># Students</th>
                <th className="right"># Assess.</th>
                <th className="right">Class Avg.</th>
    	    		</tr>
            </thead>
            <tbody>
              {this.state.courses.map(function(course) {
                return <CoursesTableRow key={course._id} course={course} />;
              })}
            </tbody>
    	    </table>
    	  );
      }
    });

    var CoursesTableRow = React.createClass({
      render: function() {
        var course_id = this.props.course._id;
      	var title = this.props.course.title;
    	  var section = this.props.course.section.toLocaleString();
        if (this.props.course.auto === 'true') {
        	var auto = 'On'
      	} else {
      		var auto = 'Off'
      	};
        var num_students = 0;
        if (this.props.course.student_ids) {
          num_students = this.props.course.student_ids.length;
        };
        var num_assessments = 0;
        if (this.props.course.assessments) {
          num_assessments = this.props.course.assessments.length;
        };
        return (
          <tr className="data-row" id="course">
            <td className="hidden">{course_id}</td>
            <td>{title}</td>
            <td className="right">{section}</td>
            <td className="right">{auto}</td> 
            <td className="right">{num_students}</td> 
            <td className="right">{num_assessments}</td> 
            <td className="right"></td> 
          </tr>
        );
      }
    });

    var AssessmentsTable = React.createClass({
      loadAssessmentsFromServer: function() {
        $.ajax({
          url: this.props.url,
          dataType: 'json',
          cache: false,
          success: function(data) {
            this.setState({assessments: data});
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
      },
      getInitialState: function() {
        return {assessments: []};
      },
      componentDidMount: function() {
        this.loadAssessmentsFromServer();
        //setInterval(this.loadAssessmentsFromServer, this.props.pollInterval);
      },
      render: function() {
        return (
          <table className="data-table" id="assessments">
            <thead>
              <tr className="table-header">
                <th className="hidden">Assessment ID</th>
                <th>Assessment Name</th>
                <th>Type</th>
                <th className="right">Points</th>
                <th className="right">Weight</th>
                <th className="right">% Weight</th>
                <th className="right">% Class Avg.</th>
              </tr>
            </thead>
            <tbody>
              {this.state.assessments.map(function(assessment) {
                return <AssessmentsTableRow key={assessment._id} assessment={assessment} />;
              })}
            </tbody>
          </table>
        );  
      }
    });

    var AssessmentsTableRow = React.createClass({
      render: function() {
        var assessment_id = this.props.assessment._id;
        var name = this.props.assessment.name;
        var type = this.props.assessment.type;
        var points = this.props.assessment.points.toLocaleString();
        var weight = this.props.assessment.weight.toLocaleString();
        return (
          <tr className="data-row" id="assessment">
            <td className="hidden">{assessment_id}</td>
            <td>{name}</td>
            <td>{type}</td>
            <td className="right">{points}</td>
            <td className="right">{weight}</td> 
            <td className="right"></td> 
            <td className="right"></td> 
          </tr>
        );
      }
    });

    var StudentsTable = React.createClass({
      loadStudentsFromServer: function() {
        $.ajax({
          url: this.props.url,
          dataType: 'json',
          cache: false,
          success: function(data) {
            this.setState({students: data});
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
      },
      getInitialState: function() {
        return {students: []};
      },
      componentDidMount: function() {
        this.loadStudentsFromServer();
        //setInterval(this.loadAssessmentsFromServer, this.props.pollInterval);
      },
      render: function() {
        return (
          <table className="data-table" id="students">
            <thead>
              <tr className="table-header">
                <th className="hidden">Student ID</th>
                <th>Last Name</th>
                <th>First Name</th>
                <th className="right">Grad Yr.</th>
                <th className="right">Score</th>
                <th className="right">% Score</th>
                <th className="right">Course %</th>
              </tr>
            </thead>
            <tbody>
              {this.state.students.map(function(student) {
                return <StudentsTableRow key={student._id} student={student} />;
              })}
            </tbody>
          </table>
        );
      }
    });

    var StudentsTableRow = React.createClass({
      render: function() {
        var student_id = this.props.student._id;
        var first_name = this.props.student.first_name;
        var last_name = this.props.student.last_name;
        var grad_year = this.props.student.grad_year.toLocaleString();
        var assessment_id = $('#current-assessment-id').val();  
        if ((this.props.student.scores) && (this.props.student.scores.length > 0)) {
          for (var i=0; i < this.props.student.scores.length; i++) {
            if (this.props.student.scores[i].assessment_id.toString() == assessment_id.toString()) {
              var score = this.props.student.scores[i].score;
              var points = this.props.student.scores[i].points;
              if (points > 0) {
                var percent = ((score / points) * 100).toLocaleString();
              } else {
                var percent = 'NA';
              };
              score = score.toLocaleString();
              break;
            };
          };
        };
        return (
          <tr className="data-row" id="student">
            <td className="hidden">{student_id}</td>
            <td>{last_name}</td>
            <td>{first_name}</td>
            <td className="right">{grad_year}</td>
            <td className="right">{score}</td>  
            <td className="right">{percent}</td>
            <td className="right"></td>  
          </tr>
        );
      }
    });

   
    var courses_table = ReactDOM.render(
      <CoursesTable url="/courses" pollInterval={1000} />,
      document.getElementById('courses-box')
    );

    var assessments_table = ReactDOM.render(
      <AssessmentsTable url="/assessments" pollInterval={1000} />,
      document.getElementById('assessments-box')
    );

    var students_table = ReactDOM.render(
      <StudentsTable url="/students" pollInterval={1000} />,
      document.getElementById('students-box')
    );




  
    //EVENT LISTENERS ---------------------------------------------


    $('#current_year').on('change', function(event) {
      var form = event.target.parentNode;
      var submit = form.querySelector('#submit');
      $(submit).trigger('click');
    });

    $('#current_term').on('change', function(event) {
      var form = event.target.parentNode;
      var submit = form.querySelector('#submit');
      $(submit).trigger('click');
    });

    $('.data-table').on('mouseover', function(event) {
      if (event.target.parentNode.getAttribute('class') != 'table-header') {
        $(event.target.parentNode).toggleClass('highlighted', true);
      };
    });

    $('.data-table').on('mouseout', function(event) {
      $(event.target.parentNode).toggleClass('highlighted', false);
    });

    $('.data-table').on('click', function(event) {
      if (event.target.parentNode.getAttribute('class') != 'table-header') {
        var row = event.target.parentNode;
        var table_body = row.parentNode;
        var table = table_body.parentNode;
        var rows = table_body.querySelectorAll('tr');
        for (var i=0; i < rows.length; i++) {
          $(rows[i]).toggleClass('selected', false);
        };
        $(row).toggleClass('selected', true);
        var cells = row.querySelectorAll('td');
        if (table.getAttribute('id') === 'courses') {
          //update current course on the server
          $.ajax({
            url: '/current_course/'+cells[0].textContent,
            method: 'post',
            success: function() {
              console.log('current course updated '+cells[0].textContent);
               //update current course in the DOM
              document.querySelector('#current-course-id').value = cells[0].textContent;
              document.querySelector('#current-course').value = cells[1].textContent + ' (Section '+cells[2].textContent+')';
              //clear current assessment fields
              $('#current-assessment').val("");
              $('#current-assessment-id').val("");  
              $('#score').val(""); 
              $('#points').val(""); 
              $('#current-student').val("");
              $('#current-student-id').val(""); 
              students_table.loadStudentsFromServer(); 
            },
            error: function() {
              console.log('current course NOT updated');
            }
          });
        } else if (table.getAttribute('id') === 'assessments') {
          //update current assessment on the server
          $.ajax({
            url: '/current_assessment/'+cells[0].textContent,
            method: 'post',
            success: function() {
              console.log('current assessment updated '+cells[0].textContent);
              //update current assessment in the DOM
              $('#current-assessment-id').val(cells[0].textContent);
              $('#current-assessment').val(cells[1].textContent +' ('+cells[2].textContent+')');
              $('#points').val(cells[3].textContent);
              $('#weight').val(cells[4].textContent);
              $('#score').val("");
              students_table.loadStudentsFromServer(); 
            },
            error: function() {
              console.log('current assessment NOT updated');
            }
          });
        } else if (table.getAttribute('id') === 'students') {
          //update current student on the server
          $.ajax({
            url: '/current_student/'+cells[0].textContent,
            method: 'post',
            success: function() {
              console.log('current student updated '+cells[0].textContent);
              //update current student in the DOM
              $('#current-student-id').val(cells[0].textContent);
              $('#current-student').val(cells[1].textContent +', '+cells[2].textContent);
              $('#score').val(cells[4].textContent);
            },
            error: function() {
              console.log('current student NOT updated');
            }
          });
        }
      };
    });

    $('#show_all').on('click', function(event) {
      event.preventDefault();
      $.ajax({
        url: '/current_course/0',
        method: 'post',
        success: function() {
          console.log('current course updated');   
        },
        error: function() {
          console.log('current course NOT updated');
        }
      });
      //clear current course fields
      $('#current-course').val("");
      $('#current-course-id').val(""); 
      $.ajax({
        url: '/current_assessment/0',
        method: 'post',
        success: function() {
          console.log('current assessment updated');
        },
        error: function() {
          console.log('current assessment NOT updated');
        }
      });
      //clear current assessment fields
      $('#current-assessment').val("");
      $('#current-assessment-id').val(""); 
      $('#points').val(""); 
      $.ajax({
        url: '/current_student/0',
        method: 'post',
        success: function() {
          console.log('current student updated');
        },
        error: function() {
          console.log('current student NOT updated');
        }
      });
      //clear current student fields
      $('#current-student').val("");
      $('#current-student-id').val(""); 
      $(submit).trigger('click');
    });

    $('#enroll').on('click', function(event) {
      if ($('#current-course-id').val().length == 0) {
        window.alert('You must select a course first.');
        event.preventDefault();
      };
    });

    $('#score').on('keydown', function(event) {
      if ((event.keyCode === 13) && ($('#current-course-id').val().length > 0) && ($('#current-assessment-id').val().length > 0) && ($('#current-student-id').val().length > 0)) {
        var score = parseFloat(event.target.value);
        var points = parseInt($('#points').val());
        var weight = parseInt($('#weight').val());
        //also X for no score
        if (score != NaN) {
          var data = {score: score, points: points, weight: weight};
          $.ajax({
            url: '/grade',
            type: 'post',
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: 'json',
            success: function() {
              console.log('grade entered');
              students_table.loadStudentsFromServer();
            },
            error: function() {
              console.log('grade NOT entered');
            }
          });
        };
        var current_student_id = $('#current-student-id').val();
        var data_rows = document.querySelector('table#students').rows;
        for (var i=0; i < data_rows.length; i++) {
          var cell = data_rows[i].children[0];
          if ((cell.textContent == current_student_id) && (i < (data_rows.length-1))) {
            $(data_rows[i+1].children[0]).trigger('click');
            break;
          };
        };
      };
    });





   
    //INITIALIZATION -----------------------------------------------

    //if already current course then re-select row in courses table
    var current_course_id = $('#current-course-id').val();
    console.log('the current course id is '+current_course_id);
    if (current_course_id.length > 0) {
      var courses_table = document.querySelector('table#courses');
      var data_rows = [];
      //for some reason need a one second delay to get the rows (react)???
      var get_data_rows = function() {
        data_rows = courses_table.rows;
        for (var i=0; i < data_rows.length; i++) {
          var cell = data_rows[i].children[0];
          if (cell.textContent == current_course_id) {
            $(cell).trigger('click');
          };
        };
      };
      setTimeout(get_data_rows, 100);
    };






  } else if (document.body.id === 'enrollment') {

    $('.student_enroll').on('click', function(event) {
      var student_id = event.target.getAttribute('id');
      var enrolled = event.target.checked;
      if (enrolled === true) {
        $.ajax({
          url: '/students/'+student_id+'/enroll',
          method: 'patch',
          dataType: 'json',
          success: function() {
            console.log('enrollment updated');
          },
          error: function() {
            console.log('enrollment NOT updated');
          }
        });
      } else {
        $.ajax({
          url: '/students/'+student_id+'/unenroll',
          method: 'patch',
          dataType: 'json',
          success: function() {
            console.log('enrollment updated');
          },
          error: function() {
            console.log('enrollment NOT updated');
          }
        });
      };
    });

  };


});









