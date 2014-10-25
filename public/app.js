$(document).ready(function() {
  $('#clear-completed').click(function() {
    $.ajax({
      ur: '/todos',
      type: 'DELETE'
    }).always(function() {
      window.location.reload();
    });
  });

  $('#new-todo').keypress(function(e) {
    if (e.which == 13) {
      var data = { text: $(this).val().trim() };
      $.post('/todos', data).always(function() {
        window.location.reload();
      });
    }
  });
});
