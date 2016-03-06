var $ = require('jQuery');

$('document').ready(function() {

  if (document.body.classList.contains('assessments')) {

    console.log('assessments.js loaded!');

    $('#assessment-new').on('click', function(event) {
      event.preventDefault();
      if ($('#current-course-id').val().length == 0) { 
        $('#assessments-warning').text('You must select a course first.').toggleClass('invisible', false);
        setTimeout(function() {$('#assessments-warning').text('').toggleClass('invisible', true)}, 2000);
      } else {
        $.ajax({
          url: '/assessments/new',
          method: 'get',
          contentType: 'application/json'
        }).done(function(result) {
          if (result.course) {
            var course = result.course;
            course.title = course.title.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            $('#new-assessment-course').html('<h5 class="modal-data">Course Title: '+course.title+'</h5><h5 class="modal-data">Section: '+course.section+'</h5>');
            if (course.auto === "false") {
              $('#new-auto-weighting').html('<label for="weight">Weight:</label><br><input type="number" name="weight" min="1" value="1"/><br>');
            } else {
              $('#new-auto-weighting').html('<h4>Auto Weighting is ON for this course.</h4>');
            }
            location.href = "#newAssessmentModal";
          } else if (result.message == "sorry") {
            location.href = "/sorry";
          }
        });
      }
    });

    $('#assessment-post').on('click', function(event) {
      event.preventDefault();
      $('#assessment-post').prop('disabled', true);
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-assessment-post').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/assessments',
        method: 'post',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          $('#message-assessment-post').text("Assessment created!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function() {
            $('#assessment-post').prop('disabled', false);
            location.href = "#close";
            location.href = "/dashboard";
          }, 1000); 
        } else if (result.message === 'sorry') {
          $('#assessment-post').prop('disabled', false);
          location.href = "/sorry";
        } else {
          $('#message-assessment-post').text(result.message).toggleClass('hidden', false);
          $('#assessment-post').prop('disabled', false);
        };
      });
    });

    $('#assessment-edit').on('click', function(event) {
      event.preventDefault();
      if ($('#current-course-id').val().length == 0) { 
        $('#assessments-warning').text('You must select a course first.').toggleClass('invisible', false);
        setTimeout(function() {$('#assessments-warning').text('').toggleClass('invisible', true)}, 2000);
      } else {
        $.ajax({
          url: '/assessments/edit',
          method: 'get',
          contentType: 'application/json'
        }).done(function(result) {
          if (result.course) {
            var course = result.course;
            var assessment = result.assessment;
            var position = result.position;
            course.title = course.title.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            $('#edit-assessment-course').html('<h5 class="modal-data">Course Title: '+course.title+'</h5><h5 class="modal-data">Section: '+course.section+'</h5>');
            $('#edit-assessment-name').val(assessment.name);
            $('#edit-assessment-type').val(assessment.type);
            $('#edit-assessment-points').val(assessment.points);
            if (course.auto === "false") {
              $('#edit-auto-weighting').html('<label for="weight">Weight:</label><br><input type="number" name="weight" min="1" value="'+assessment.weight+'"/><br>');
            } else {
              $('#edit-auto-weighting').html('<h4>Auto Weighting is ON for this course.</h4>');
            }
            $('#edit-assessment-position').val(position);
            location.href = "#editAssessmentModal";
          } else if (result.message == "sorry") {
            location.href = "/sorry";
          }
        });
      }
    });

    $('#assessment-patch').on('click', function(event) {
      event.preventDefault();
      $('#assessment-patch').prop('disabled', true);
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-assessment-patch').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/assessments',
        method: 'patch',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          $('#message-assessment-patch').text("Assessment updated!").toggleClass('hidden', false).toggleClass('green', true);
          setTimeout(function() {
            $('#assessment-patch').prop('disabled', false);
            location.href = "#close";
            location.href = "/dashboard";
          }, 1000);
        } else if (result.message === 'sorry') {
          $('#assessment-patch').prop('disabled', false);
          location.href = "/sorry";
        } else {
          $('#message-assessment-patch').text(result.message).toggleClass('hidden', false);
          $('#assessment-patch').prop('disabled', false);
        };
      });
    });

    $('#assessment-delete').on('click', function(event) {
      event.preventDefault();
      $('#assessment-delete').prop('disabled', true);
      if (window.confirm("Are you sure you want to delete this assessment?\r\nThis will also delete all scores for this assessment.\r\nIt cannot be undone.") === true) {
        $('#message-assessment-delete').text('').toggleClass('hidden', true);
        $.ajax({
          url: '/assessments',
          method: 'delete',
          dataType: 'json'
        }).done(function(result) {
          if (result.message === 'ok') {
            location.href = "#close";
            location.href = "/dashboard";
          } else if (result.message === 'sorry') {
            location.href = "/sorry";
          } else {
            $('#message-assessment-delete').text(result.message).toggleClass('hidden', false);
          };
          $('#assessment-delete').prop('disabled', false);
        });
      } else {
        $('#assessment-delete').prop('disabled', false);
      }
    });

  };

});