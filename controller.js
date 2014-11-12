var autoController = require('./src/framework/auto_controller.js');
var funflow = require('funflow');

function install(model, app) {
  var completed = model.q({completed: true});
  var active = model.q({completed: false});

  var completedTodos = autoController.create('todos_completed', completed);
  var activeTodos = autoController.create('todos_active', active);
  var todos = autoController.create('todos', model);
  var todo = autoController.create('todo', model, 'id', 'todos');

  app.get('/', todos.get(listTodoItems));

  app.post('/todos', todos.post(function(req) {
    return { text: req.body.text, completed: false };
  }));
  app.put('/todos', todos.put(updateItem));
  app.get('/todos', todos.get(listTodoItems));
  app.get('/todos.json', todos.get(listTodoItems));
  app.get('/todos.html', todos.get(function(req, sel, done) {
    sel.get(function(err, value) {
      if (err) return done(err);
      var keys = {};
      value.forEach(function(curr) {
        Object.keys(curr).forEach(function(key) {
          keys[key] = true;
        });
      });
      keys = Object.keys(keys);
      keys.sort();
      var acc = [];
      value.forEach(function(curr) {
        var rec = keys.map(function(k) {
          return {key: k, value: curr[k]};
        });
        acc.push({id: curr._id, values: rec});
      });
      done(null, { tableHeader: keys, tableBody: acc }, 'table');
    });
  }));

  app.get('/todos/:id.json', todo.get());
  app.get('/todos/:id', todo.get(function(req, sel, done) {
    sel.get(function(err, value) {
      var type = { _id: 'fixed', completed: 'bool' }
      if (err) return done(err);
      var keys = Object.keys(value);
      keys.sort();
      pairs = keys.map(function(k) {
        return {key: k, value: value[k], type: type[k]};
      });
      done(null, {id: value._id, payload: pairs}, 'todo_item');
    });
  }));
  app.put('/todos/:id', todo.put(updateItem));
  app.delete('/todos/:id', todo.delete());

  app.get('/todos_completed', completedTodos.get(listTodoItems));
  app.delete('/todos_completed', completedTodos.delete());

  app.get('/todos_active', activeTodos.get(listTodoItems));

  function updateItem(req, selection, done) {
    var data = {};
    if (req.body.completed !== undefined) {
      data.completed = req.body.completed;
    }
    var text = req.param('text');
    if (text != null) {
      data.text = text;
    }
    selection.update(data, done);
  }

  function listTodoItems(req, selection, done) {
    funflow.newFlow({
        todoItems: function sel(done) { selection.map(null, done) },
        numCompleted: function com(done) { completed.size(done) },
        numActive: function act(done) { active.size(done) }
      },
      function addView(data, done) { done(null, data, 'index') }
    )(null, done);
  }
}

exports.install = install;

