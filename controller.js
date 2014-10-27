
function install(model, app) {
  app.get('/', function(req, res) {
    res.redirect('/todos');
  });

  var completed = model.q(function(e) { return e.completed });
  var active = model.q(function(e) { return !e.completed });

  model.add({text: 'Create a TodoMVC template', completed: true });
  model.add({text: 'Rule the web', completed: false });

  app.delete('/todos', function(req, res) {
    completed.remove();
    res.sendStatus(200).end();
  });
  app.post('/todos', function(req, res) {
    model.add({text: req.body.text, completed: false });
    res.sendStatus(200).end();
  });

  app.put('/todos/:id', function(req, res) {
    var newState = (req.body.completed === 'true');
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
    console.log('model=' + model);
    var isCompleted = req.query.what == 'completed';
    var isActive = req.query.what == 'active';

    var selected = model.q();
    if (isCompleted) {
      selected = completed;
    } else if (isActive) {
      selected = active;
    }

    res.render('index', {
      todoItems: selected.get(),
      numCompleted: completed.size(),
      numLeft: active.size(),
      what: isCompleted ? 'completed' : isActive ? 'active' : ''
    });
  });
}

exports.install = install;

