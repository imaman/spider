var autoController = require('./auto_controller.js');
var funflow = require('funflow');

function install(model, app) {
  var completed = model.q(function(e) { return e.completed });
  var active = model.q(function(e) { return !e.completed });

  var completedTodos = autoController.create('todos_completed', completed);
  var activeTodos = autoController.create('todos_active', active);
  var todos = autoController.create('todos', model);
  var todo = autoController.create('todo', model, 'id');

  app.post('/todos', todos.post(function(req) {
    return { text: req.body.text, completed: false };
  }));

  app.put('/todos', todos.put(updateItem));
  app.get('/todos', todos.get(listTodoItems));
  app.get('/', todos.get(listTodoItems));

  app.put('/todos/:id', todo.put(updateItem));
  app.delete('/todos/:id', todo.delete());

  app.get('/todos_completed', completedTodos.get(listTodoItems));
  app.delete('/todos_completed', completedTodos.delete());

  app.get('/todos_active', activeTodos.get(listTodoItems));

  function updateItem(req, selection, done) {
    var newState = (req.param('completed') === 'true');
    selection.forEach(function(curr) {
      curr.completed = newState;
    }, done);
  }

  function listTodoItems(req, selection, done) {
    funflow.newFlow({
      todoItems: function sel(done) { selection.map(function(curr) { return curr }, done) },
      numCompleted: function com(done) { completed.size(done) },
      numActive: function act(done) { active.size(done) }
    })(null, done);
  }
}

exports.install = install;

