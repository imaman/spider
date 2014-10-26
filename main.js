var spider = require('./src/framework/spider.js');


function install(app) {
  app.get('/', function(req, res) {
    res.redirect('/todos');
  });

  var ordinal = 0;
  function nextId() {
    var res = ordinal;
    ++ordinal;
    return res;
  }

  var arr = [
    { id: nextId(), text: 'Create a TodoMVC template', completed: true },
    { id: nextId(), text: 'Rule the web', completed: false },
  ];

  app.delete('/todos', function(req, res) {
    arr = arr.filter(function(curr) { return !curr.completed; });
    res.sendStatus(200).end();
  });
  app.post('/todos', function(req, res) {
    arr.push({ id: nextId(), text: req.body.text, completed: false });
    res.sendStatus(200).end();
  });

  app.put('/todos/:id', function(req, res) {
    var candidates = arr.filter(function(curr) { return curr.id == req.params.id });
    if (candidates.length != 1) {
      res.sendStatus(404).end();
      return;
    }

    candidates[0].completed = (req.body.completed === 'true');
    res.sendStatus(200).end();
  });

  app.delete('/todos/:id', function(req, res) {
    var positions = arr.map(function(curr, pos) {
      return curr.id == req.params.id ? pos : -1 });
    positions = positions.filter(function(pos) { return pos >= 0; });
    if (positions.length != 1) {
      res.sendStatus(404).end();
      return;
    }

    arr.splice(positions[0], 1);
    res.sendStatus(200).end();
  });

  app.get('/todos', function(req, res) {
    var isCompleted = req.query.what == 'completed';
    var isActive = req.query.what == 'active';

    var numCompleted =  arr.filter(function(curr) { return curr.completed }).length
    var numLeft = arr.length - numCompleted;
    var selected = arr;
    if (isCompleted || isActive) {
      selected = selected.filter(function(curr) { return curr.completed == isCompleted });
    }
    res.render('index', {
      todoItems: selected,
      numCompleted: numCompleted,
      numLeft: numLeft,
      what: isCompleted ? 'completed' : isActive ? 'active' : ''
    });
  });
}

function ready(app) {
  console.log('>> Express server started at http://localhost:' + app.get('port'));
}

function done(err) {
  console.log('done. err=' + err);
}

spider.run(3000, __dirname, install, ready, done);

