var autoController = require('./auto_controller.js');

function install(model, app) {
  app.get('/', function(req, res) {
    res.redirect('/todos');
  });

  var completed = model.q(function(e) { return e.completed });
  var active = model.q(function(e) { return !e.completed });

  var completedTodos = autoController.create('todo_completed', completed);
  var activeTodos = autoController.create('todo_active', active);
  var todo = autoController.create(null, model, 'id');
  var todos = autoController.create('todo', model);

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
      done(null, {
        todoItems: data,
        numCompleted: completed.size(),
        numLeft: active.size()
      });
    });
  }
  app.get('/todos', todo.get(listTodoItems));
  app.get('/todos_completed', completedTodos.get(listTodoItems));
  app.get('/todos_active', activeTodos.get(listTodoItems));
}

exports.install = install;

