var autoController = require('./auto_controller.js');

function install(model, app) {
  app.get('/', function(req, res) {
    res.redirect('/todos');
  });

  var completed = model.q(function(e) { return e.completed });
  var active = model.q(function(e) { return !e.completed });

  var completedTodos = autoController.create('todos_completed', completed);
  var activeTodos = autoController.create('todos_active', active);
  var todo = autoController.create('todo', model, 'id');
  var todos = autoController.create('todos', model);

  app.delete('/todos_completed', completedTodos.delete());
  app.delete('/todos/:id', todo.delete());

  app.post('/todos', todos.post(function(req) {
    return { text: req.body.text, completed: false };
  }));

  app.put('/todos/:id', todo.put());
  app.put('/todos', todos.put());

  function listTodoItems(req, selection, done) {
    selection.map(function(curr) { return curr }, function(err, data) {
      if (err) return done(err);
      completed.size(function(err, completedSize) {
        if (err) return done(err);
        active.size(function(err, activeSize) {
          if (err) return done(err);
          done(null, {
            todoItems: data,
            numCompleted: completedSize,
            numLeft: activeSize
          });
        });
      });
    });
  }
  app.get('/todos', todos.get(listTodoItems));
  app.get('/todos_completed', completedTodos.get(listTodoItems));
  app.get('/todos_active', activeTodos.get(listTodoItems));
}

exports.install = install;

