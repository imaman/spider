
function install(model, app) {
  app.get('/', function(req, res) {
    res.redirect('/todos');
  });

  var completed = model.q(function(e) { return e.completed });
  var active = model.q(function(e) { return !e.completed });

  function entityDelete(q, res) {
    q.remove();
    res.sendStatus(200).end();
  }
  function newDeleteController(selection, idParam) {
    if (!idParam) {
      return function(req, res) {
        entityDelete(selection, res);
      };
    }

    return function(req, res) {
      entityDelete(selection.q(req.params[idParam]), res);
    };
  }

  function newController(name, selection, idParam) {
    return {
      post: function(jsonFromReq) {
        return function(req, res) {
          model.add(jsonFromReq(req));
          res.sendStatus(200).end();
        };
      },
      delete: function() { return newDeleteController(selection, idParam) },
      get: function(jsonFromReq) {
        return function(req, res) {
          var data = jsonFromReq(req, selection.q(req.params[idParam]));
          data.byController = data.byController || name;
          res.render('index', data);
        };
      },
      put: function() {
        return function(req, res) {
          var newState = (req.param('completed') === 'true');
          selection.q(req.params[idParam]).forEach(function(curr) {
            curr.completed = newState;
          });
          res.sendStatus(200).end();
        };
      }
    }
  }

  var completedTodosController = newController('todo_completed', completed);
  var activeTodosController = newController('todo_active', active);
  var todoController = newController(null, model, 'id');
  var todosContoller = newController('todo', model);

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

