var autoController = require('./src/framework/auto_controller.js');
var funflow = require('funflow');


function install(qTodos, qPlaces, app) {

  autoController.defineResource(app, qPlaces, 'places', 'place', {
    post: function(req) {
      return { when: new Date(), name: req.body.name || '', city: req.body.city || '', country: req.body.country };
    },
    put: function(req, sel, done) {
      var data = {};
      if (req.body.name) data.name = req.body.name;
      if (req.body.city) data.city = req.body.city;
      if (req.body.country) data.country = req.body.country;
      data.when = req.body.when && new Date(req.body.when);
      sel.update(data, done);
    }
  }, { when: 'DATE' });

  var qCompleted= qTodos.q({completed: true});
  var qActive = qTodos.q({completed: false});

  var completedTodos = autoController.create('todos_completed', qCompleted);
  var activeTodos = autoController.create('todos_active', qActive);
  var todos = autoController.create('todos', qTodos, 'todo', 'id');
  var todo = todos.singular();

  app.get('/', todos.get(listTodoItems));

  app.post('/todos', todos.post(function(req) {
    return { text: req.body.text || '', completed: false };
  }));
  app.put('/todos', todos.put(updateItem));
  app.get('/todos', todos.get(listTodoItems));
  app.get('/todos.json', todos.get(listTodoItems));
  app.get('/todos.html', todos.getHtml());

  app.get('/todos/:id.json', todo.get());
  app.get('/todos/:id.html', todo.getHtml());
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
        numCompleted: function com(done) { qCompleted.size(done) },
        numActive: function act(done) { qActive.size(done) }
      },
      function addView(data, done) { done(null, data, 'index') }
    )(null, done);
  }
}

exports.install = install;

