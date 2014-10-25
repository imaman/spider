$(document).ready(function() {
  $('#clear-completed').click(function() {
    $.ajax({
      ur: '/todos',
      type: 'DELETE'
    }).always(function() {
      window.location.reload();
    });
  });
});
