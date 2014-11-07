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

  var list = $('#todo-list');

  list.on('dblclick', 'label', function(e) {
    var $input = $(e.target).closest('li').addClass('editing').find('.edit');
	  $input.val($input.val()).focus();
  });
  list.on('focusout', '.edit', function() {
    var el = $(this);
    var id = el.closest('li').find('label').attr('item_id');
    $.ajax({
      url: '/todos/' + id,
      type: 'PUT',
      data: {
        text: el.val()
      }
    }).always(function() {
      window.location.reload();
    });
  });
  list.on('keyup', '.edit', function(e) {
    if (e.which == 13) {
      e.target.blur();
    }
    if (e.which == 27) {
      window.location.reload();
    }
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
      url: '/todos',
      type: 'PUT',
      data: {
        completed: box.prop('checked')
      }
    }).always(function() {
      window.location.reload();
    });
  });
});
