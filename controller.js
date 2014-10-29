
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
      entityDelete(selection.q(req.params[idParam]));
    };
  }

  function newController(selection, idParam) {
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
          res.render('index', jsonFromReq(req, selection.q(req.params[idParam])));
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

  var completedTodosController = newController(completed);
  var todoController = newController(model, 'id');
  var todosContoller = newController(model);

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
      numLeft: active.size(),
      what: 'todos'
    };
  }));

  app.get('/todos_completed', function(req, res) {
    res.render('index', {
      todoItems: completed.get(),
      numCompleted: completed.size(),
      numLeft: active.size(),
      what: 'todos_completed'
    });
  });

  app.get('/todos_active', function(req, res) {
    res.render('index', {
      todoItems: active.get(),
      numCompleted: completed.size(),
      numLeft: active.size(),
      what: 'todos_active'
    });
  });
}

exports.install = install;

