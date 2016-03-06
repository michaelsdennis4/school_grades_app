var $ = require('jQuery');

$('document').ready(function() {

  if (document.body.classList.contains('index')) {

    console.log('index.js loaded!');

    $('#login').on('click', function(event) {
      event.preventDefault();
      $('#login').prop('disabled', true);
      var $form = $(event.target.parentNode);
      var data = $form.serializeArray();
      $('#message-login').text('').toggleClass('hidden', true);
      $.ajax({
        url: '/login',
        method: 'post',
        data: data,
        dataType: 'json'
      }).done(function(result) {
        if (result.message === 'ok') {
          location.href = "/dashboard";
        } else {
          $('#message-login').text(result.message).toggleClass('hidden', false);
        };
        $('#login').prop('disabled', false);
      });
    });

  };

});