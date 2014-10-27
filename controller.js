
function install(model, app) {
  app.get('/', function(req, res) {
    res.redirect('/todos');
  });

  var completed = model.q(function(e) { return e.completed });
  var active = model.q(function(e) { return !e.completed });

  app.delete('/todos_completed', function(req, res) {
    completed.remove();
    res.sendStatus(200).end();
  });
  app.post('/todos', function(req, res) {
    model.add({text: req.body.text, completed: false });
    res.sendStatus(200).end();
  });

  app.put('/todos/:id', function(req, res) {
    var newState = (req.param('completed') === 'true');
    var selector = req.params.id;
    if (selector == '_ALL_') {
      selector = undefined;
    }

    model.q(selector).forEach(function(curr) {
      curr.completed = newState;
    });
    res.sendStatus(200).end();
  });

  app.delete('/todos/:id', function(req, res) {
    model.q(req.params.id).remove();
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

