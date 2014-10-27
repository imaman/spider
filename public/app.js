$(document).ready(function() {
  $('#clear-completed').click(function() {
    $.ajax({
      url: '/todos_completed',
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

  $('.toggle').change(function() {
    var box = $(this);
    $.ajax({
      url: '/todos/' + box.attr('item_id'),
      type: 'PUT',
      data: {
        completed: box.prop('checked')
      }
    }).always(function() {
      window.location.reload();
    });
  });

  $('.destroy').click(function() {
    var button = $(this);
    $.ajax({
      url: '/todos/' + button.attr('item_id'),
      type: 'DELETE'
    }).always(function() {
      window.location.reload();
    });
  });

  $('#toggle-all').change(function() {
    var box = $(this);
    $.ajax({
      url: '/todos/_ALL_',
      type: 'PUT',
      data: {
        completed: box.prop('checked')
      }
    }).always(function() {
      window.location.reload();
    });
  });
});
