var $ = require('jQuery');

var React = require('react');
var ReactDOM = require('react-dom');

$('document').ready(function() {

  console.log('main.js loaded!');

  if (document.body.classList.contains('dashboard')) {

    console.log('dashboard js loaded!');

//DASHBOARD REACT------------------------------------------------

    var CoursesTable = React.createClass({
      loadCoursesFromServer: function() {
        $.ajax({
          url: this.props.url,
          dataType: 'json',
          cache: false,
          success: function(data) {
            this.setState({courses: data.courses, student_scores: data.student_scores});
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
      },
      getInitialState: function() {
        return {courses: [], student_scores: []};
      },
      componentDidMount: function() {
        this.loadCoursesFromServer();
      },
      handleClick: function() {

      },
      render: function() {
        var student_scores = this.state.student_scores;
    	  return (
          <table className="data-table" id="courses" onClick={this.handleClick}>
    	      <thead>
    	    		<tr className="table-header">
                <th className="hidden">Course ID</th>
    	    			<th>Course Title</th>
    	    			<th className="right">Sec.</th>
    	    			<th className="right">Auto Wt.</th>
                <th className="right"># Students</th>
                <th className="right"># Assessments</th>
                <th className="right">% Class Avg.</th>
    	    		</tr>
            </thead>
            <tbody>
              {this.state.courses.map(function(course) {
                return <CoursesTableRow key={course._id} course={course} student_scores={student_scores} />;
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
        var class_average = "";
        var total_score;
        var count;
        var average;
        var averages = [];
        //iterate through course assessments
        if (this.props.course.assessments) {
          for (var i=0; i < this.props.course.assessments.length; i++) {
            var assessment = this.props.course.assessments[i];
            total_score = 0;
            count = 0;
            this.props.student_scores.forEach(function(score) {
              if (score.assessment_id.toString() == assessment._id.toString()) {
                if (score.score !== 'X') {
                  total_score += ((parseFloat(score.score) / parseFloat(score.points)) * 100);
                  count++;
                };
              };
            });
            if (count > 0) {
              average = (total_score / count);
              averages.push({average: average, weight: parseFloat(assessment.weight)});
            };
          };
          //calculate overall class average
          total_score = 0;
          var total_weight = 0;
          averages.forEach(function(average) {
            total_score += (average.average * average.weight);
            total_weight += average.weight;
          });
          if (total_weight > 0) {
            class_average = (total_score / total_weight).toFixed(1).toLocaleString();
          };
        };
        return (
          <tr className="data-row" id="course">
            <td className="hidden">{course_id}</td>
            <td>{title}</td>
            <td className="right">{section}</td>
            <td className="right">{auto}</td> 
            <td className="right">{num_students}</td> 
            <td className="right">{num_assessments}</td> 
            <td className="right">{class_average}</td> 
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
            this.setState({assessments: data.assessments, student_scores: data.student_scores});
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
      },
      getInitialState: function() {
        return {assessments: [], student_scores: []};
      },
      componentDidMount: function() {
        this.loadAssessmentsFromServer();
      },
      handleClick: function() {

      },
      render: function() {
        var total_weight = 0;
        if (this.state.assessments.length > 0) {
          this.state.assessments.forEach(function(assessment) {
            total_weight += parseFloat(assessment.weight);
          });
        };
        var student_scores = this.state.student_scores;
        return (
          <table className="data-table" id="assessments" onClick={this.handleClick}>
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
                return <AssessmentsTableRow key={assessment._id} assessment={assessment} total_weight={total_weight} student_scores={student_scores}/>;
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
        var percentage_weight = "";
        if (this.props.total_weight > 0) {
          percentage_weight = ((parseFloat(this.props.assessment.weight) / this.props.total_weight) * 100).toFixed(1).toLocaleString();
        };
        var average_score = "";
        var total_score = 0;
        var count = 0;
        if ((this.props.student_scores) && (this.props.student_scores.length > 0)) {
          this.props.student_scores.forEach(function(score){
            if (score.assessment_id.toString() == assessment_id.toString()) {
              if (score.score !== 'X') {
                total_score += ((parseFloat(score.score) / parseFloat(score.points)) * 100);
                count++;
              };
            };
          });
          if (count > 0) {
            average_score = (total_score / count).toFixed(1).toLocaleString();
          };
        };
        return (
          <tr className="data-row" id="assessment">
            <td className="hidden">{assessment_id}</td>
            <td>{name}</td>
            <td>{type}</td>
            <td className="right">{points}</td>
            <td className="right">{weight}</td> 
            <td className="right">{percentage_weight}</td> 
            <td className="right">{average_score}</td> 
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
        var num = 0;
        return (
          <table className="data-table" id="students">
            <thead>
              <tr className="table-header">
                <th className="hidden">Student ID</th>
                <th>#</th>
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
                num++;
                return <StudentsTableRow key={student._id} num={num} student={student} />;
              })}
            </tbody>
          </table>
        );
      }
    });

    var StudentsTableRow = React.createClass({
      render: function() {
        var student_id = this.props.student._id;
        var num = this.props.num;
        var first_name = this.props.student.first_name;
        var last_name = this.props.student.last_name;
        var grad_year = this.props.student.grad_year.toLocaleString();
        var course_id = $('#current-course-id').val(); 
        var assessment_id = $('#current-assessment-id').val(); 
        var score = "";
        var points = "";
        var percent = ""; 
        var course_percentage = "";
        if ((this.props.student.scores) && (this.props.student.scores.length > 0)) {
          course_percentage = 0;
          var total_weight = 0;
          for (var i=0; i < this.props.student.scores.length; i++) {
            if (this.props.student.scores[i].assessment_id.toString() == assessment_id.toString()) {
              score = this.props.student.scores[i].score;
              if (score !== 'X') {
                score = parseFloat(score);
              };
              points = parseFloat(this.props.student.scores[i].points);
              if ((points > 0) && (score !== 'X')) {
                percent = ((score / points) * 100).toLocaleString();
                score = score.toLocaleString();
              } else {
                percent = "NA";
              };
            };
            if ((this.props.student.scores[i].course_id.toString() == course_id.toString()) && (this.props.student.scores[i].score !== 'X')) {
              course_percentage += (parseFloat(this.props.student.scores[i].score) / parseFloat(this.props.student.scores[i].points) * parseFloat(this.props.student.scores[i].weight));
              total_weight += parseFloat(this.props.student.scores[i].weight);
            };
          };
          if (total_weight > 0) {
            course_percentage = ((course_percentage / total_weight) * 100).toFixed(1).toLocaleString();
          } else {
            course_percentage = "";
          };
        };
        return (
          <tr className="data-row" id="student">
            <td className="hidden">{student_id}</td>
            <td>{num}</td>
            <td>{last_name}</td>
            <td>{first_name}</td>
            <td className="right">{grad_year}</td>
            <td className="right">{score}</td>  
            <td className="right">{percent}</td>
            <td className="right">{course_percentage}</td>  
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
 
//DASHBOARD EVENT LISTENERS ---------------------------------------------


    $('#current-year').on('change', function(event) {
      $('#current-term').val("1");
      $('#term-submit').click();
    });

    $('#current-term').on('change', function(event) {
      $('#term-submit').click();
    });

    $('.data-table').on('mouseover', function(event) {
      if (event.target.parentNode.getAttribute('class') != 'table-header') {
        $(event.target.parentNode).toggleClass('highlighted', true);
      };
    });

    $('#course-edit').on('click', function(event) {
      event.preventDefault(); 
      if ($('#current-course-id').val().length == 0) { 
        $('#courses-warning').text('You must select a course first.').toggleClass('invisible', false);
        setTimeout(function() {$('#courses-warning').text('').toggleClass('invisible', true)}, 2000);
      } else {
        //get current course
        $.ajax({
          url: '/courses/edit',
          method: 'get',
          contentType: 'application/json'
        }).done(function(result) {
          if (result.course) {
            var course = result.course;
            //update modal window with current course data
            $('#edit-course-title').val(course.title);
            $('#edit-course-section').val(course.section);
            $('#edit-course-year').val(course.term.split('.')[0]);
            $('#edit-course-term').val(course.term.split('.')[1]);
            $("#edit-course-auto select").val("false");         
            location.href = "#editCourseModal";
          } else if (result.message == 'sorry') {
            location.href = '/sorry';
          }
        });
      }
    });

    $('#enroll').on('click', function(event) {
      if ($('#current-course-id').val().length == 0) {
        event.preventDefault();
        $('#courses-warning').text('You must select a course first.').toggleClass('invisible', false);
        setTimeout(function() {$('#courses-warning').text('').toggleClass('invisible', true)}, 2000);
      };
    });

    $('#assessment-new').on('click', function(event) {
      if ($('#current-course-id').val().length == 0) {
        event.preventDefault();
        $('#assessments-warning').text('You must select a course first.').toggleClass('invisible', false);
        setTimeout(function() {$('#assessments-warning').text('').toggleClass('invisible', true)}, 2000);
      };
    });

    $('#assessment-edit').on('click', function(event) {
      if ($('#current-assessment-id').val().length == 0) {
        event.preventDefault();
        $('#assessments-warning').text('You must select an assessment first.').toggleClass('invisible', false);
        setTimeout(function() {$('#assessments-warning').text('').toggleClass('invisible', true)}, 2000);
      };
    });

    $('#student-edit').on('click', function(event) {
      if ($('#current-student-id').val().length == 0) {
        event.preventDefault();
        $('#students-warning').text('You must select a student first.').toggleClass('invisible', false);
        setTimeout(function() {$('#students-warning').text('').toggleClass('invisible', true)}, 2000);
      };
    });

    $('#show-all-students').on('click', function(event) {
      event.preventDefault();
      $.ajax({
        url: '/current_course/0',
        method: 'post'
      }).done(function() {
        //clear current course fields
        $('#current-course').val("");
        $('#current-course-id').val(""); 
        console.log('current course deleted'); 
        courses_table.loadCoursesFromServer();
      });
      $.ajax({
        url: '/current_assessment/0',
        method: 'post'
      }).done(function() {
        //clear current assessment fields
        $('#current-assessment').val("");
        $('#current-assessment-id').val("");  
        console.log('current assessment deleted');
        assessments_table.loadAssessmentsFromServer();
      });
      $.ajax({
        url: '/current_student/0',
        method: 'post'
      }).done(function() {
        //clear current student fields
        $('#current-student').val("");
        $('#current-student-id').val(""); 
        console.log('current student deleted');
        students_table.loadStudentsFromServer();
      });
      $('#score').val(""); 
      $('#points').val(""); 
      $('#weight').val(""); 
      $('.data-row').toggleClass('selected', false);
    });

    $('.data-table').on('mouseout', function(event) {
      $(event.target.parentNode).toggleClass('highlighted', false);
    });

    $('.data-table').on('click', function(event) {
      if (!event.target.parentNode.classList.contains('table-header')) {
        var row = event.target.parentNode;
        var table_body = row.parentNode;
        var table = table_body.parentNode;
        var rows = table_body.querySelectorAll('tr');
        for (var i=0; i < rows.length; i++) {
          $(rows[i]).toggleClass('selected', false);
        };
        var cells = row.querySelectorAll('td');
        if (table.getAttribute('id') === 'courses') {
          //update current course on the server
          $.ajax({
            url: '/current_course/'+cells[0].textContent,
            method: 'post'
          }).done(function() {
            console.log('current course updated '+cells[0].textContent);
             //update current course in the DOM
            document.querySelector('#current-course-id').value = cells[0].textContent;
            document.querySelector('#current-course').value = cells[1].textContent + ' (Section '+cells[2].textContent+')';
            //clear current student and assessment fields
            $.ajax({
              url: '/current_assessment/0',
              method: 'post'
            }).done(function() {
              $('#current-assessment').val("");
              $('#current-assessment-id').val("");
              $('.data-table#assessments').find('.data-row').toggleClass('selected', false); 
              assessments_table.loadAssessmentsFromServer();
              $.ajax({
                url: '/current_student/0',
                method: 'post'
              }).done(function() {
                $('#current-student').val("");
                $('#current-student-id').val("");
                $('.data-table#students').find('.data-row').toggleClass('selected', false);
                students_table.loadStudentsFromServer();
                $('#score').val(""); 
                $('#points').val(""); 
                $('#weight').val(""); 
                $(row).toggleClass('selected', true); 
              });
            });  
          });
        } else if (table.getAttribute('id') === 'assessments') {
          //update current assessment on the server
          $.ajax({
            url: '/current_assessment/'+cells[0].textContent,
            method: 'post'
          }).done(function() {
            console.log('current assessment updated '+cells[0].textContent);
            //update current assessment in the DOM
            $('#current-assessment-id').val(cells[0].textContent);
            $('#current-assessment').val(cells[1].textContent +' ('+cells[2].textContent+')');
            $('#points').val(cells[3].textContent);
            $('#weight').val(cells[4].textContent);
            $(row).toggleClass('selected', true);
            console.log('assessment before load students '+cells[0].textContent);
            students_table.loadStudentsFromServer();
            console.log('assessment after load students '+cells[0].textContent);
            setTimeout(function() {
              $('#score').val($('.data-table#students').find('.data-row.selected').find('td:nth-child(6)').text());
              $('#score').focus();
            }, 100);
          });
        } else if (table.getAttribute('id') === 'students') {
          //update current student on the server
          $.ajax({
            url: '/current_student/'+cells[0].textContent,
            method: 'post'
          }).done(function() {
            console.log('current student updated '+cells[0].textContent);
            //update current student in the DOM
            $('#current-student-id').val(cells[0].textContent);
            $('#current-student').val(cells[2].textContent +', '+cells[3].textContent);
            $('#score').val(cells[5].textContent);
            $(row).toggleClass('selected', true);
          });
        }
        //if course, assessment, and student selected, then click on score box
        if (($('#current-course-id').val().length > 0) && ($('#current-assessment-id').val().length > 0) && ($('#current-student-id').val().length > 0)) {
          $('#score').focus();
        }
      }
    });

    $('#score').on('keydown', function(event) {
      if (event.keyCode === 13) {
        if (($('#current-course-id').val().length > 0) && ($('#current-assessment-id').val().length > 0) && ($('#current-student-id').val().length > 0)){
          var score;
          if (event.target.value.length === 0) {
            score = null;
          } else if ((event.target.value === 'x') || (event.target.value === 'X')) {
            score = 'X';
          } else {
            score = parseFloat(event.target.value);
          };
          var points = parseInt($('#points').val());
          var weight = parseInt($('#weight').val());
          var cancelRed = function() {
            $('#score').toggleClass('red', false);
            $('#score').val($('.data-table#students').find('.data-row.selected').find('td:nth-child(6)').text());
          };
          if ((score === null) || (score === 'X') || (!isNaN(score))) {
            var data = {score: score, points: points, weight: weight};
            $.ajax({
              url: '/grade',
              type: 'post',
              data: JSON.stringify(data),
              contentType: "application/json",
              dataType: 'json'
            }).done(function(result) {
              if ((result) && (result.status === false)) {
                console.log('error posting grade');
                $('#score').toggleClass('red', true); 
                setTimeout(cancelRed, 100);  
              } else {
                console.log('grade posted');
                $('#score').toggleClass('green', true);
                students_table.loadStudentsFromServer();
                assessments_table.loadAssessmentsFromServer();
                courses_table.loadCoursesFromServer();
                //select next row in table
                var select_next_row = function() {
                  var current_student_id = $('#current-student-id').val();
                  var data_rows = document.querySelector('table#students').rows;
                  for (var i=1; i < data_rows.length; i++) {
                    var cell = data_rows[i].children[0];
                    if ((cell.textContent.toString() == current_student_id.toString()) && (i < (data_rows.length-1))) {
                      data_rows[i+1].children[1].click();
                      break;
                    };
                  };
                  $('#score').toggleClass('green', false);
                };
                setTimeout(select_next_row, 100);
              };
            });
          } else {
            console.log('entry not recognized');
            $('#score').toggleClass('red', true); 
            setTimeout(cancelRed, 100);
          };
        } else {
          console.log('course, assessment, or student not selected');
          $('#score').toggleClass('red', true); 
          setTimeout(cancelRed, 100);
        };
      };
    });
 
//DASHBOARD INITIALIZATION -----------------------------------------------

    var current_course_id = $('#current-course-id').val();
    var current_assessment_id = $('#current-assessment-id').val();
    var current_student_id = $('#current-student-id').val();
   
    var resetCourse = function() {  
      console.log('the current course id is '+current_course_id);
      //reselect current course
      if (current_course_id.length > 0) {
        var courses_table = document.querySelector('table#courses');
        var data_rows = [];
        //for some reason need a one second delay to get the rows (react)???
        var get_data_rows = function() {
          data_rows = courses_table.rows;
          for (var i=0; i < data_rows.length; i++) {
            var cell = data_rows[i].children[0];
            if (cell.textContent.toString() == current_course_id.toString()) {
              cell.click();
            };
          };
          resetAssessment();
        };
        setTimeout(get_data_rows, 500);
      } else {
        resetStudent();
      };
    };

    var resetAssessment = function() {
      console.log('the current assessment id is '+current_assessment_id);
      //re-select current assessment   
      if (current_assessment_id.length > 0) {
        var assessments_table = document.querySelector('table#assessments');
        var data_rows = [];
        //for some reason need a one second delay to get the rows (react)???
        var get_data_rows = function() {
          data_rows = assessments_table.rows;
          for (var i=0; i < data_rows.length; i++) {
            var cell = data_rows[i].children[0];
            if (cell.textContent.toString() == current_assessment_id.toString()){
              cell.click();
            };
          };
          resetStudent();
        };
        setTimeout(get_data_rows, 100);
      } else {
        resetStudent();
      };
    };

    var resetStudent = function() {
      console.log('the current student id is '+current_student_id);
      //reselect current student     
      if (current_student_id.length > 0) {
        var students_table = document.querySelector('table#students');
        var data_rows = [];
        //for some reason need a one second delay to get the rows (react)???
        var get_data_rows = function() {
          data_rows = students_table.rows;
          for (var i=0; i < data_rows.length; i++) {
            var cell = data_rows[i].children[0];
            if (cell.textContent.toString() == current_student_id.toString()) {
              cell.click();
            };
          };
        };
        setTimeout(get_data_rows, 100);
      };
    };

    resetCourse();

  };


//INDEX EVENT LISTENERS-------------------------------------------------

  if (document.body.classList.contains('index')) {

    console.log('index js loaded!');

    $('#login').on('click', function(event) {
      event.preventDefault();
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-login').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/login',
        type: 'post',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          console.log('login successful');
          location.href = "/dashboard";
        } else {
          console.log(result.message);
          $('#message-login').text(result.message).toggleClass('hidden', false);
        };
      });
    });

  };

//USERS EVENT LISTENERS-------------------------------------------------

  if (document.body.classList.contains('users')) {

    console.log('users js loaded!');

    $('#user-post').on('click', function(event) {
      event.preventDefault();
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-user-post').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/users',
        type: 'post',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          console.log('new user created successfully');
          location.href = "/dashboard";
        } else {
          console.log(result.message);
          $('#message-user-post').text(result.message).toggleClass('hidden', false);
        };
      });
    });

    $('#user-patch').on('click', function(event) {
      event.preventDefault();
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-user-patch').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/users',
        type: 'patch',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          console.log('user updated successfully');
          location.href = "/dashboard";
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
        } else {
          console.log(result.message);
          $('#message-user-patch').text(result.message).toggleClass('hidden', false);
        };
      });
    });

    $('#user-password').on('click', function(event) {
      event.preventDefault();
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-user-password').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/users/password',
        type: 'patch',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          console.log('password updated successfully');
          location.href = "/dashboard";
        } 
        else if (result.message === 'sorry') {
          location.href = "/sorry";
        } 
        else {
          console.log(result.message);
          $('#message-user-password').text(result.message).toggleClass('hidden', false);
        };
      });
    });

    $('#user-delete').on('click', function(event) {
      event.preventDefault();
      if (window.confirm("Are you sure you want to delete your profile?\r\nThis will also delete all your data and log you out.\r\nIt cannot be undone.") === true) { 
        $('#message-user-delete').text('').toggleClass('hidden', true);
        $.ajax({
          url: '/users',
          type: 'delete',
          dataType: 'json'
        }).done(function(result) {
          if (result.message === 'ok') {
            console.log('user deleted successfully');
            location.href = "/logout";
          } 
          else if (result.message === 'sorry') {
            location.href = "/sorry";
          } 
          else {
            console.log(result.message);
            $('#message-user-delete').text(result.message).toggleClass('hidden', false);
          };
        });
      };
    });

  };
   
//COURSES EVENT LISTENERS---------------------------------------------
  
  if (document.body.classList.contains('courses')) {

    console.log('courses js loaded!');

    $('#course-select').on('click', function(event) {
      event.preventDefault();
      var term = event.target.value;
      if (term.length > 0) {
        data = {term: term};
        $.ajax({
          url: '/courses',
          type: 'get',
          data: data,
          dataType: 'json'
        }).done(function(results) {
          if ((results) && (results.courses.length > 0)) {
            var courses = results.courses;
            courses.forEach(function(course) { 
              $('#courses-checklist').append('<label><input type="checkbox" class="copy-course" id="'+course._id+'" value="copy"/>'+course.title+' (Section: '+course.section+')</label><br>');
            });
            $('#courses-checklist').append('<br><br>');
            $('#courses-list').toggleClass('hidden', false);
          }
        });
      };
    });

    $('#course-post').on('click', function(event) {
      event.preventDefault();
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-course-post').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/courses',
        type: 'post',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          console.log('new course created successfully');
          $('#message-course-post').text("Course created!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function() {
            location.href = "#close";
          }, 1000);
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
        } else {
          console.log(result.message);
          $('#message-course-post').text(result.message).toggleClass('hidden', false);
        };
      });
    });

    $('#course-patch').on('click', function(event) {
      event.preventDefault();
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-course-patch').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/courses',
        type: 'patch',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          console.log('course updated successfully');
          $('#message-course-patch').text("Course updated!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function() {
            location.href = "/dashboard#close";
          }, 1000);
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
        } else {
          console.log(result.message);
          $('#message-course-patch').text(result.message).toggleClass('hidden', false);
        };
      });
    });

    $('#course-delete').on('click', function(event) {
      event.preventDefault();
      if (window.confirm("Are you sure you want to delete this course?\r\nThis will also delete all assessments and scores for this course.\r\nIt cannot be undone.") === true) {
        $('#message-course-delete').text('').toggleClass('hidden', true);
        $.ajax({
          url: '/courses',
          type: 'delete',
          dataType: 'json'
        }).done(function(result) {
          if (result.message === 'ok') {
            console.log('course deleted successfully');
            location.href = "/dashboard";
          } else if (result.message === 'sorry') {
            location.href = "/sorry";
          } else {
            console.log(result.message);
            $('#message-course-delete').text(result.message).toggleClass('hidden', false);
          };
        });
      };
    });

    $('.student-enroll').on('click', function(event) {
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

    $('#courses-copy').on('click', function(req, res) {
      event.preventDefault();
      var $this = $(this.parentNode);
      var courses = [];
      var checklist = document.querySelector('#courses-checklist');
      var items = checklist.querySelectorAll('.copy-course');
      var data; 
      if (document.querySelector('#copy-students').checked === true) {
        data = {copy_students: 'true'};
      } else {
        data = {copy_students: 'false'};
      };
      for (var i=0; i < items.length; i++) {
        if (items[i].checked === true) {
          courses.push(items[i].getAttribute('id'));
        };
      };     
      var copyCourse = function(count) {
        console.log('data is '+data.copy_students);
        $.ajax({
          url: '/courses/'+courses[count]+'/copy',
          type: 'post',
          data: JSON.stringify(data),
          contentType: "application/json",
          dataType: 'json'
        }).done(function(result) {
          console.log('course copied');
          count++;
          if (count < courses.length) {
            copyCourse(count);
          } else {
            console.log ('all courses copied');
            $this.unbind('submit').submit();
          };
        });
      };
      if (courses.length > 0) {
        copyCourse(0);
      } else {
        $this.unbind('submit').submit();
      };
    });

  };

//ASSESSMENTS EVENT LISTENERS-------------------------------------------

  if (document.body.classList.contains('assessments')) {

    console.log('assessments js loaded!');

    $('#assessment-post').on('click', function(event) {
      event.preventDefault();
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-assessment-post').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/assessments',
        type: 'post',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          console.log('new assessment created successfully'); 
          $('#message-assessment-post').text("Assessment created!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function() {
            location.href = "/dashboard";
          }, 1000); 
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
        } else {
          console.log(result.message);
          $('#message-assessment-post').text(result.message).toggleClass('hidden', false);
        };
      });
    });

    $('#assessment-patch').on('click', function(event) {
      event.preventDefault();
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-assessment-patch').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/assessments',
        type: 'patch',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          console.log('assessment updated successfully');
          $('#message-assessment-patch').text("Assessment updated!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function(){
            location.href = "/dashboard";
          }, 1000);
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
        } else {
          console.log(result.message);
          $('#message-assessment-patch').text(result.message).toggleClass('hidden', false);
        };
      });
    });

    $('#assessment-delete').on('click', function(event) {
      event.preventDefault();
      if (window.confirm("Are you sure you want to delete this assessment?\r\nThis will also delete all scores for this assessment.\r\nIt cannot be undone.") === true) {
        $('#message-assessment-delete').text('').toggleClass('hidden', true);
        $.ajax({
          url: '/assessments',
          type: 'delete',
          dataType: 'json'
        }).done(function(result) {
          if (result.message === 'ok') {
            console.log('assessment deleted successfully');
            location.href = "/dashboard";
          } else if (result.message === 'sorry') {
            location.href = "/sorry";
          } else {
            console.log(result.message);
            $('#message-assessment-delete').text(result.message).toggleClass('hidden', false);
          };
        });
      };
    });

  };

//STUDENTS EVENT LISTENERS---------------------------------------------

  if (document.body.classList.contains('students')) {

    console.log('students js loaded!');

    $('#student-post').on('click', function(event) {
      event.preventDefault();
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-student-post').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/students',
        type: 'post',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          console.log('new student created successfully');
          $('#message-student-post').text("Student added!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function() {
            location.href = "/students/new";
          }, 1000);    
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
        } else {
          console.log(result.message);
          $('#message-student-post').text(result.message).toggleClass('hidden', false);
        };
      });
    });

    $('#student-patch').on('click', function(event) {
      event.preventDefault();
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-student-patch').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/students',
        type: 'patch',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          console.log('student updated successfully');
          $('#message-student-patch').text("Student updated!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function(){
            location.href = "/dashboard";
          }, 1000);
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
        } else {
          console.log(result.message);
          $('#message-student-patch').text(result.message).toggleClass('hidden', false);
        };
      });
    });

    $('#student-delete').on('click', function(event) {
      event.preventDefault();
      if (window.confirm("Are you sure you want to delete this student?\r\nThis will also delete all scores for this student.\r\nIt cannot be undone.") === true) {
        $('#message-student-delete').text('').toggleClass('hidden', true);
        $.ajax({
          url: '/students',
          type: 'delete',
          dataType: 'json'
        }).done(function(result) {
          if (result.message === 'ok') {
            console.log('student deleted successfully');
            location.href = "/dashboard";
          } else if (result.message === 'sorry') {
            location.href = "/sorry";
          } else {
            console.log(result.message);
            $('#message-student-delete').text(result.message).toggleClass('hidden', false);
          };
        });
      };
    });

  };

});









