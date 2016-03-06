var $ = require('jQuery');

$('document').ready(function() {

  if (document.body.classList.contains('students')) {

    console.log('students.js loaded!');

    $('#student-new').on('click', function(event){
      event.preventDefault();
      $.ajax({
        url: '/students/new',
        method: 'get',
        contentType: 'application/json'
      }).done(function(result) {
        if (result.course) {
          var course = result.course;
          course.title = course.title.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
          $('#new-student-course').html('<label for="enroll"><input class="modal-checkbox" type="checkbox" name="enroll" value="enroll" checked />Enroll this student in '+course.title+' (Section '+course.section+')</label><br>');
          location.href="#newStudentModal";    
        } else if (result.message == 'sorry') {
          location.href = "/sorry";
        } else {
          location.href="#newStudentModal";
        }
      });
    });

    $('#student-post').on('click', function(event) {
      event.preventDefault();
      $('#student-post').prop('disabled', true);
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-student-post').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/students',
        method: 'post',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          $('#message-student-post').text("Student added!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function() {
            //clear form
            $('#new-student-firstname').val("");
            $('#new-student-lastname').val("");
            $('#new-student-email').val("");
            $('#new-student-identification').val("");
            $('#new-student-advisor').val("");
            $('#new-student-gradyear').val("");
            $('#student-post').prop('disabled', false);
          }, 1000);    
        } else if (result.message === 'sorry') {
          $('#student-post').prop('disabled', false);
          location.href = "/sorry";
        } else {
          $('#message-student-post').text(result.message).toggleClass('hidden', false);
          $('#student-post').prop('disabled', false);
        };
      });
    });

    $('#new-students-done').on('click', function(event) {
      event.preventDefault();
      $('#new-students-done').prop('disabled', true);
      //check to see if the form has data
      if (($('#edit-student-firstname').val().length > 0) ||
        ($('#new-student-lastname').val().length > 0) ||
        ($('#new-student-email').val().length > 0) ||
        ($('#new-student-identification').val().length > 0) ||
        ($('#new-student-advisor').val().length > 0) ||
        ($('#new-student-gradyear').val().length > 0)) {
        if (window.confirm('There is unsubmitted data in the form.\r\nDo you want to add the student?') === true) {
          $('#student-post').click();
          setTimeout(function() {
            $('#new-students-done').prop('disabled', false);
            location.href = "#close";
            location.href = "/dashboard";
          }, 1000);
        } else {
          $('#new-students-done').prop('disabled', false);
          location.href = "#close";
          location.href = "/dashboard";
        }
      } else {
        $('#new-students-done').prop('disabled', false);
        location.href = "#close";
        location.href = "/dashboard";
      }
    });

    $('#student-edit').on('click', function(event) {
      event.preventDefault();
      $.ajax({
        url: '/students/edit',
        method: 'get',
        contentType: 'application/json'
      }).done(function(result) {
        if (result.student) {
          var student = result.student;
          $('#edit-student-firstname').val(student.first_name);
          $('#edit-student-lastname').val(student.last_name);
          $('#edit-student-email').val(student.email);
          $('#edit-student-identification').val(student.identification);
          $('#edit-student-advisor').val(student.advisor);
          $('#edit-student-gradyear').val(student.grad_year);
          if (student.is_active === 'true') {
            $('#edit-student-isactive').prop("checked", true );
          }
          location.href = "#editStudentModal";
        } else if (result.message == 'sorry') {
          location.href = "/sorry";
        }
      });
    });

    $('#student-patch').on('click', function(event) {
      event.preventDefault();
      $('#student-patch').prop('disabled', true);
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-student-patch').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/students',
        method: 'patch',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          $('#message-student-patch').text("Student updated!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function() {
            $('#student-patch').prop('disabled', false);
            location.href = "#close";
            location.href = "/dashboard";
          }, 1000);
        } else if (result.message === 'sorry') {
          $('#student-patch').prop('disabled', false);
          location.href = "/sorry";
        } else {
          $('#message-student-patch').text(result.message).toggleClass('hidden', false);
          $('#student-patch').prop('disabled', false);
        };
      });
    });

    $('#student-delete').on('click', function(event) {
      event.preventDefault();
      $('#student-delete').prop('disabled', true);
      if (window.confirm("Are you sure you want to delete this student?\r\nThis will also delete all scores for this student.\r\nIt cannot be undone.") === true) {
        $('#message-student-delete').text('').toggleClass('hidden', true);
        $.ajax({
          url: '/students',
          method: 'delete',
          dataType: 'json'
        }).done(function(result) {
          if (result.message === 'ok') {
            location.href = "#close";
            location.href = "/dashboard";
          } else if (result.message === 'sorry') {
            location.href = "/sorry";
          } else {
            $('#message-student-delete').text(result.message).toggleClass('hidden', false);   
          };
          $('#student-delete').prop('disabled', false);
        });
      };
    });

  };

});









