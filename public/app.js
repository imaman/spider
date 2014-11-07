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

  function itemIdOf(e) {
    return $(e).closest('li').attr('item_id');
  }

  function putJson(path, data) {
    $.ajax({
      url: path,
      type: 'PUT',
      contentType : 'application/json',
      processData: false,
      data: JSON.stringify(data),
    }).always(function() {
      window.location.reload();
    });
  }

  $('.toggle').change(function() {
    var box = $(this);
    putJson('/todos/' + itemIdOf(this), {
      completed: box.prop('checked')
    });
  });

  var list = $('#todo-list');

  list.on('dblclick', 'label', function(e) {
    var $input = $(e.target).closest('li').addClass('editing').find('.edit');
	  $input.val($input.val()).focus();
  });
  list.on('focusout', '.edit', function() {
    var el = $(this);
    var id = itemIdOf(this);
    putJson('/todos/' + id, {
      text: el.val()
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
    $.ajax({
      url: '/todos/' + itemIdOf(this),
      type: 'DELETE'
    }).always(function() {
      window.location.reload();
    });
  });

  $('#toggle-all').change(function() {
    var box = $(this);
    putJson('/todos', {
      completed: box.prop('checked')
    });
  });
});
