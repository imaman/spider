
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
      delete: function() { return newDeleteController(selection, idParam) }
    }
  }

  var completedTodosController = newController(completed);
  var todoController = newController(model, 'id');

  app.delete('/todos_completed', completedTodosController.delete());
  app.delete('/todos/:id', todoController.delete());

  app.post('/todos', function(req, res) {
    model.add({text: req.body.text, completed: false });
    res.sendStatus(200).end();
  });

  app.put('/todos/:id', function(req, res) {
    var newState = (req.param('completed') === 'true');
    model.q(req.params.id).forEach(function(curr) {
      curr.completed = newState;
    });
    res.sendStatus(200).end();
  });

  app.put('/todos', function(req, res) {
    var newState = (req.param('completed') === 'true');
    model.q().forEach(function(curr) {
      curr.completed = newState;
    });
    res.sendStatus(200).end();
  });

  app.get('/todos', function(req, res) {
    res.render('index', {
      todoItems: model.q().get(),
      numCompleted: completed.size(),
      numLeft: active.size(),
      what: ''
    });
  });

  app.get('/todos_completed', function(req, res) {
    res.render('index', {
      todoItems: completed.get(),
      numCompleted: completed.size(),
      numLeft: active.size(),
      what: 'completed'
    });
  });

  app.get('/todos_active', function(req, res) {
    res.render('index', {
      todoItems: active.get(),
      numCompleted: completed.size(),
      numLeft: active.size(),
      what: 'active'
    });
  });
}

exports.install = install;

