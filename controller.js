var autoController = require('./auto_controller.js');

function install(model, app) {
  app.get('/', function(req, res) {
    res.redirect('/todos');
  });

  var completed = model.q(function(e) { return e.completed });
  var active = model.q(function(e) { return !e.completed });

  var completedTodosController = autoController.create('todo_completed', completed);
  var activeTodosController = autoController.create('todo_active', active);
  var todoController = autoController.create(null, model, 'id');
  var todosContoller = autoController.create('todo', model);

  app.delete('/todos_completed', completedTodosController.delete());
  app.delete('/todos/:id', todoController.delete());

  app.post('/todos', todosContoller.post(function(req) {
    return { text: req.body.text, completed: false };
  }));

  app.put('/todos/:id', todoController.put());
  app.put('/todos', todosContoller.put());

  app.get('/todos', todoController.get(function(req, selection) {
    return {
      todoItems: selection.get(),
      numCompleted: completed.size(),
      numLeft: active.size()
    };
  }));
  app.get('/todos_completed', completedTodosController.get(function(req, selection) {
    return {
      todoItems: selection.get(),
      numCompleted: completed.size(),
      numLeft: active.size()
    };
  }));

  app.get('/todos_active', activeTodosController.get(function(req, selection) {
    return {
      todoItems: selection.get(),
      numCompleted: completed.size(),
      numLeft: active.size()
    };
  }));
}

exports.install = install;

