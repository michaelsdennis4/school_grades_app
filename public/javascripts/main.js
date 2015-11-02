var $ = require('jQuery');

var React = require('react');
var ReactDOM = require('react-dom');

$('document').ready(function() {

  console.log('main.js loaded!');

  if (document.body.id !== 'dashboard') { return };

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
      if (this.state.courses.length > 0) {
    	  return (
    	    <table className="data-table" id="courses" onClick={this.handleClick}>
    	      <thead>
    	    		<tr className="table-header">
                <th className="hidden">Course ID</th>
    	    			<th>Course Title</th>
    	    			<th>Section</th>
    	    			<th>Auto Weight</th>
    	    		</tr>
            </thead>
            <tbody>
              {this.state.courses.map(function(course) {
                return <CoursesTableRow key={course._id} course={course} />;
              })}
            </tbody>
    	    </table>
    	  );
      } else {
        return (
          <table className="data-table" id="courses">
            <thead>
              <tr className="table-header">
                <th className="hidden">Course ID</th>
                <th>Course Title</th>
                <th>Section</th>
                <th>Auto Weight</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        );
      };
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
      return (
        <tr className="data-row">
          <td className="hidden">{course_id}</td>
          <td>{title}</td>
          <td>{section}</td>
          <td>{auto}</td>  
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
      if (this.state.assessments.length > 0) {
        return (
          <table className="data-table" id="assessments">
            <thead>
              <tr className="table-header">
                <th className="hidden">Assessment ID</th>
                <th>Assessment Name</th>
                <th>Type</th>
                <th>Points</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {this.state.assessments.map(function(assessment) {
                return <AssessmentsTableRow key={assessment._id} assessment={assessment} />;
              })}
            </tbody>
          </table>
        );
      } else {
        return (
          <table className="data-table" id="assessments">
            <thead>
              <tr className="table-header">
                <th className="hidden">Assessment ID</th>
                <th>Assessment Name</th>
                <th>Type</th>
                <th>Points</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        );
      };
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
        <tr className="data-row">
          <td className="hidden">{assessment_id}</td>
          <td>{name}</td>
          <td>{type}</td>
          <td>{points}</td>
          <td>{weight}</td>  
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
        //update current course in the DOM
        document.querySelector('#current-course-id').value = cells[0].textContent;
        document.querySelector('#current-course').value = cells[1].textContent + ' (Section '+cells[2].textContent+')';
        //update current course on the server
        $.ajax({
          url: '/current_course/'+cells[0].textContent,
          method: 'post',
          success: function() {
            console.log('current course updated '+cells[0].textContent);
            //clear current assessment fields
            $('#current-assessment').val("");
            $('#current-assessment-id').val("");    
          },
          error: function() {
            console.log('current course NOT updated');
          }
        });
      } else if (table.getAttribute('id') === 'assessments') {
        //update current assessment in the DOM
        document.querySelector('#current-assessment-id').value = cells[0].textContent;
        document.querySelector('#current-assessment').value = cells[1].textContent +' ('+cells[2].textContent+')';
        //update current assessment on the server
        $.ajax({
          url: '/current_assessment/'+cells[0].textContent,
          method: 'post',
          success: function() {
            console.log('current assessment updated '+cells[0].textContent);
          },
          error: function() {
            console.log('current assessment NOT updated');
          }
        });
      }
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
        if (cell.textContent === current_course_id) {
          $(cell).trigger('click');
        };
      };
    };
    setTimeout(get_data_rows, 1000);
  };


});









