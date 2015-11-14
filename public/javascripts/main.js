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
        // assessments_table.loadAssessmentsFromServer();
        // students_table.loadStudentsFromServer();
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
                <th className="right">% Class Avg.</th>
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
        //setInterval(this.loadAssessmentsFromServer, this.props.pollInterval);
      },
      handleClick: function() {
        //students_table.loadStudentsFromServer();
      },
      render: function() {
        var total_weight = 0;
        if (this.state.assessments.length > 0) {
          this.state.assessments.forEach(function(assessment) {
            total_weight += parseInt(assessment.weight);
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
        var percentage_weight = '0';
        if (this.props.total_weight > 0) {
          percentage_weight = ((this.props.assessment.weight / this.props.total_weight) * 100).toFixed(1).toLocaleString();
        };
        var average_score = "";
        var total_score = 0;
        var count = 0;
        if (this.props.student_scores.length > 0) {
          this.props.student_scores.forEach(function(score){
            if (score.assessment_id.toString() == assessment_id.toString()) {
              if (score.score !== 'X') {
                total_score += ((score.score / score.points) * 100);
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
              points = this.props.student.scores[i].points;
              if ((points > 0) && (score != 'X')) {
                percent = ((score / points) * 100).toLocaleString();
              } else {
                percent = "NA";
              };
              score = score.toLocaleString();
            };
            if ((this.props.student.scores[i].course_id.toString() == course_id.toString()) && (this.props.student.scores[i].score != 'X')) {
              course_percentage += (this.props.student.scores[i].score / this.props.student.scores[i].points * this.props.student.scores[i].weight);
              total_weight += this.props.student.scores[i].weight;
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
            $('#current-assessment').val("");
            $('#current-assessment-id').val("");  
            $('#current-student').val("");
            $('#current-student-id').val("");
            $('#score').val(""); 
            $('#points').val(""); 
            $('#weight').val(""); 
            $(row).toggleClass('selected', true);
            courses_table.loadCoursesFromServer();
            assessments_table.loadAssessmentsFromServer();
            students_table.loadStudentsFromServer();
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
            $('#score').val("");
            $(row).toggleClass('selected', true);
            assessments_table.loadAssessmentsFromServer();
            students_table.loadStudentsFromServer();
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
            $('#current-student').val(cells[1].textContent +', '+cells[2].textContent);
            $('#score').val(cells[4].textContent);
            $(row).toggleClass('selected', true);
            students_table.loadStudentsFromServer();
          });
        };
      };
    });


    $('#show_all').on('click', function(event) {
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
    });

    $('#enroll').on('click', function(event) {
      if ($('#current-course-id').val().length == 0) {
        window.alert('You must select a course first.');
        event.preventDefault();
      };
    });

    $('#score').on('keydown', function(event) {
      if ((event.keyCode === 13) && ($('#current-course-id').val().length > 0) && ($('#current-assessment-id').val().length > 0) && ($('#current-student-id').val().length > 0)) {
        var score;
        if ((event.target.value === 'x') || (event.target.value === 'X')) {
          score = 'X';
        } else {
          score = parseFloat(event.target.value);
        };
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
            dataType: 'json'
          }).done(function() {
            console.log('grade posted');
            students_table.loadStudentsFromServer();
            assessments_table.loadAssessmentsFromServer();
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
            };
            setTimeout(select_next_row, 500);
          });
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
        setTimeout(get_data_rows, 100);
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
            if (cell.textContent.toString() == current_assessment_id.toString()) {
              //$(cell).trigger('click');
              cell.click();
            };
          };
          resetStudent();
        };
        setTimeout(get_data_rows, 100);
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
              // $(cell).trigger('click');
              cell.click();
            };
          };
        };
        setTimeout(get_data_rows, 100);
      };
    };

    resetCourse();





    
    
    
  
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









