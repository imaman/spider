var autoController = require('./src/framework/auto_controller.js');
var funflow = require('funflow');

function install(model, app) {
  var completed = model.q({completed: true});
  var active = model.q({completed: false});

  var completedTodos = autoController.create('todos_completed', completed);
  var activeTodos = autoController.create('todos_active', active);
  var todos = autoController.create('todos', model);
  var todo = autoController.create('todo', model, 'id');

  app.get('/', todos.get(listTodoItems));

  app.post('/todos', todos.post(function(req) {
    return { text: req.body.text, completed: false };
  }));
  app.put('/todos', todos.put(updateItem));
  app.get('/todos', todos.get(listTodoItems));
  app.get('/todos.json', todos.get(listTodoItems));

  app.put('/todos/:id', todo.put(updateItem));
  app.delete('/todos/:id', todo.delete());

  app.get('/todos_completed', completedTodos.get(listTodoItems));
  app.delete('/todos_completed', completedTodos.delete());

  app.get('/todos_active', activeTodos.get(listTodoItems));

  function updateItem(req, selection, done) {
    var data = {};
    var comp = req.param('completed');
    if (comp !== undefined) {
      data.completed = comp;
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

