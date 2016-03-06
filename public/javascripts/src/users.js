var $ = require('jQuery');

$('document').ready(function() {

  if (document.body.classList.contains('users')) {

    console.log('users.js loaded!');

    $('#user-post').on('click', function(event) {
      event.preventDefault();
      $('#user-post').prop('disabled', true);
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-user-post').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/users',
        method: 'post',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          location.href = "/dashboard";
        } else {
          $('#message-user-post').text(result.message).toggleClass('hidden', false);
        };
        $('#user-post').prop('disabled', false);
      });
    });

    $('#user-edit').on('click', function(event) {
      event.preventDefault();
      $.ajax({
        url: '/users/edit',
        method: 'get',
        contentType: 'application/json'
      }).done(function(result) {
        if (result.user) {
          var user = result.user;
          $('#edit-user-firstname').val(user.first_name);
          $('#edit-user-lastname').val(user.last_name);
          $('#edit-user-email').val(user.email);
          location.href = "#editProfileModal";
        } else if (result.message == 'sorry') {
          location.href = "/sorry";
        }
      });
    });

    $('#user-patch').on('click', function(event) {
      event.preventDefault();
      $('#user-patch').prop('disabled', true);
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-user-patch').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/users',
        method: 'patch',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          location.href = "#close";
          location.href = "/dashboard";
        } else if (result.message === 'sorry') {
          location.href = "/sorry";
        } else {
          $('#message-user-patch').text(result.message).toggleClass('hidden', false);
        }
        $('#user-patch').prop('disabled', false);
      });
    });

    $('#user-delete').on('click', function(event) {
      event.preventDefault();
      $('#user-delete').prop('disabled', true);
      if (window.confirm("Are you sure you want to delete your profile?\r\nThis will also delete all your data and log you out.\r\nIt cannot be undone.") === true) { 
        $('#message-user-delete').text('').toggleClass('hidden', true);
        $.ajax({
          url: '/users',
          method: 'delete',
          dataType: 'json'
        }).done(function(result) {
          if (result.message === 'ok') {
            location.href = "/logout";
          } 
          else if (result.message === 'sorry') {
            location.href = "/sorry";
          } 
          else {
            $('#message-user-delete').text(result.message).toggleClass('hidden', false);
          }
          $('#user-delete').prop('disabled', false);
        });
      } else {
        $('#user-delete').prop('disabled', false);
      }
    });

    $('#user-password').on('click', function(event) {
      event.preventDefault();
      $('#user-password').prop('disabled', true);
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      console.log('form serialized');
      $('#message-user-password').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/users/password',
        type: 'patch',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          $('#message-user-password').text("Password updated successfully").toggleClass('green', true).toggleClass('hidden', false);
          setTimeout(function() {
            location.href = "#close";
            location.href = "/dashboard";
            $('#message-user-password').text("").toggleClass('green', false).toggleClass('hidden', true);
            $('#user-password').prop('disabled', false);
          }, 1000);    
        } 
        else if (result.message === 'sorry') {
          location.href = "/sorry";
          $('#user-password').prop('disabled', false);
        } 
        else {
          $('#edit-old-password').val("");
          $('#edit-new-password').val("");
          $('#edit-confirm-new-password').val("");
          $('#message-user-password').text(result.message).toggleClass('hidden', false);
          $('#user-password').prop('disabled', false);
        };
      });
    });

  };

});