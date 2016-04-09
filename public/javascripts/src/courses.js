var $ = require('jQuery');

$('document').ready(function() {
  
  if (document.body.classList.contains('courses')) {

    $('#course-post').on('click', function(event) {
      event.preventDefault();
      $('#course-post').prop('disabled', true);
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-course-post').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/courses',
        method: 'post',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          $('#message-course-post').text("Course created!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function() {
            location.href = "#close";
            location.href = "/dashboard";
            $('#message-course-post').text("").toggleClass('hidden', true).toggleClass('green', false);
            $('#course-post').prop('disabled', false);
          }, 1000);
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
          $('#course-post').prop('disabled', false);
        } else {
          $('#message-course-post').text(result.message).toggleClass('hidden', false);
          $('#course-post').prop('disabled', false);
        };
      });
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
            $("#edit-course-auto").val(course.auto);         
            location.href = "#editCourseModal";
          } else if (result.message == 'sorry') {
            location.href = '/sorry';
          }
        });
      }
    });

    $('#course-patch').on('click', function(event) {
      event.preventDefault();
      $('#course-patch').prop('disabled', true);
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-course-patch').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/courses',
        method: 'patch',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          $('#message-course-patch').text("Course updated!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function() {
            location.href = "#close";
            location.href = "/dashboard";
            $('#course-patch').prop('disabled', false);
          }, 1000);
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
          $('#course-patch').prop('disabled', false);
        } else {
          $('#message-course-patch').text(result.message).toggleClass('hidden', false);
          $('#course-patch').prop('disabled', false);
        };
      });
    });

    $('#enroll').on('click', function(event) {
      event.preventDefault();
      if ($('#current-course-id').val().length == 0) { 
        $('#courses-warning').text('You must select a course first.').toggleClass('invisible', false);
        setTimeout(function() {$('#courses-warning').text('').toggleClass('invisible', true)}, 2000);
      } else {
        $.ajax({
          url: '/enrollment',
          method: 'get',
          contentType: 'application/json'
        }).done(function(result) {
          if ((result.course) && (result.students)) {
            var course = result.course,
                students = result.students,
                enrolled;
            course.title = course.title.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            $('#enrollment-course').html('<h5 class="modal-data">Course Title: '+course.title+'</h5><h5 class="modal-data">Section: '+course.section+'</h5>');
            $('#students-checklist').html('');
            students.forEach(function(student) {
              enrolled = false;
              if ((student.course_ids) && (student.course_ids.length > 0)) {
                student.course_ids.forEach(function(course_id) {
                  if (course_id.id.toString() == course._id.toString()) {
                    enrolled = true;
                  }
                });
              };
              if (enrolled === true) {
                $('#students-checklist').append('<label class="modal-item"><input type="checkbox" class="student-enroll" id="'+student._id+'" value="enrolled" checked/> '+student.last_name+', '+student.first_name+' ('+student.grad_year+')</label><br>'); 

              } else {
                $('#students-checklist').append('<label class="modal-item"><input type="checkbox" class="student-enroll" id="'+student._id+'" value="enrolled"/> '+student.last_name+', '+student.first_name+' ('+student.grad_year+')</label><br>'); 
              }
            });
            $('.student-enroll').on('click', studentEnroll);
            location.href = "#enrollmentModal";
          } else if (result.message == 'sorry') {
            location.href = '/sorry';
          }
        });
      }
    });

    var studentEnroll = function(event) {
      var student_id = event.target.getAttribute('id');
      var enrolled = event.target.checked;
      if (enrolled === true) {
        $.ajax({
          url: '/students/'+student_id+'/enroll',
          method: 'patch',
          dataType: 'json'
        });
      } else {
        $.ajax({
          url: '/students/'+student_id+'/unenroll',
          method: 'patch',
          dataType: 'json'
        });
      }
    };

    $('#enrollment-update').on('click', function(event) {
      event.preventDefault();
      location.href = "#close";
      location.href = "/dashboard";
    });

    $('#course-copy').on('click', function(event) {
      event.preventDefault();  
      $('#term-select').html("");
      $('#courses-checklist').html("");
      $('#no-courses-found').toggleClass('hidden', true);
      $('#courses-list').toggleClass('hidden', true);
      //get terms
      $.ajax({
        url: '/courses/terms',
        method: 'get',
        contentType: 'application/json'
      }).done(function(result) {
        if (result.terms) {
          var terms = result.terms;
          //update modal window select with terms
          terms.forEach(function(term) {
            if (term.toString() != result.current_term.toString()) {
              $('#term-select').append('<option value="'+term+'">'+term.split('.')[0]+' Term '+term.split('.')[1]+'</option>')
            }
          });
          location.href = "#copyCoursesModal";
        } else if (result.message == 'sorry') {
          location.href = '/sorry';
        }
      });
    });

    $('#term-select').on('change', function(event) {
      $('#courses-checklist').html("");
      $('#no-courses-found').toggleClass('hidden', true);
      $('#courses-list').toggleClass('hidden', true);
      var term = event.target.value;
      if (term.length > 0) {
        data = {term: term};
        $.ajax({
          url: '/courses',
          method: 'get',
          data: data,
          dataType: 'json',
          contentType: 'application/json'
        }).done(function(results) {
          if ((results) && (results.courses.length > 0)) {
            var courses = results.courses;
            courses.forEach(function(course) { 
              $('#courses-checklist').append('<label><input type="checkbox" class="copy-course" id="'+course._id+'" value="copy"/> '+course.title+' (Section: '+course.section+')</label><br>');
            });
            $('#courses-checklist').append('<br><br>');
            $('#courses-list').toggleClass('hidden', false);
          } else {
            $('#no-courses-found').toggleClass('hidden', false);
          }   
        });
      };
    });

    $('#courses-copy').on('click', function(req, res) {
      event.preventDefault();
      $('#courses-copy').prop('disabled', true);
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
        $.ajax({
          url: '/courses/'+courses[count]+'/copy',
          method: 'post',
          data: JSON.stringify(data),
          contentType: "application/json",
          dataType: 'json'
        }).done(function(result) {
          count++;
          if (count < courses.length) {
            copyCourse(count);
          } else {
            $('#message-courses-copy').toggleClass('green', true).toggleClass('hidden', false).text('Course(s) copied successfully!');
            setTimeout(function() {
              location.href = "#close";
              location.href = "/dashboard";
              $('#message-courses-copy').toggleClass('green', false).toggleClass('hidden', true).text('');
              $('#courses-copy').prop('disabled', false);
            }, 1000); 
          }
        });
      }
      if (courses.length > 0) {
        copyCourse(0);
      } else {
        $('#message-courses-copy').toggleClass('red', true).toggleClass('hidden', false).text('No courses copied.');
        setTimeout(function() {
          location.href = "#close";
          location.href = "/dashboard";
          $('#message-courses-copy').toggleClass('red', false).toggleClass('hidden', false).text('');
          $('#courses-copy').prop('disabled', false);
        }, 1000); 
      }
    });
  };

  $('#course-delete').on('click', function(event) {
    event.preventDefault();
    $('#course-delete').prop('disabled', true);
    if (window.confirm("Are you sure you want to delete this course?\r\nThis will also delete all assessments and scores for this course.\r\nIt cannot be undone.") === true) {
      $('#message-course-delete').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/courses',
        method: 'delete',
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          location.href = "#close";
          location.href = "/dashboard";
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
        } else {
          $('#message-course-delete').text(result.message).toggleClass('hidden', false);
        }
        $('#course-delete').prop('disabled', false);
      });
    } else {
      $('#course-delete').prop('disabled', false);
    }
  });

});