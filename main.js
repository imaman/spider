var spider = require('./src/framework/spider.js');

function newModel() {
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

  return {
    add: function(obj) { obj.id = nextId(); arr.push(obj); },
    removeAll: function(pred) {
      arr = arr.filter(function(curr) { return !pred(curr); });
    },
    forEach: function(f) { arr.forEach(f); },
    lookup: function(id) {
      var res = arr.filter(function(curr) { return curr.id == id });
      if (res.length != 1)
        throw new Error('Lookup of ID ' + id + ' has failed');
      return res[0];
    },
    remove: function(id) {
      var positions = arr.map(function(curr, pos) {
        return curr.id == id ? pos : -1
      });
      positions = positions.filter(function(pos) { return pos >= 0; });
      if (positions.length != 1)
        throw new Error('Lookup of ID ' + id + ' has failed');

      arr.splice(positions[0], 1);
    },
    findAll: function(pred) {
      return arr.filter(pred || function() { return true; });
    },
    size: function() { return arr.length; }
  };
}

function install(app) {
  app.get('/', function(req, res) {
    res.redirect('/todos');
  });

  var model = newModel();
  app.delete('/todos', function(req, res) {
    model.removeAll(function(curr) { return curr.completed; });
    res.sendStatus(200).end();
  });
  app.post('/todos', function(req, res) {
    model.add({text: req.body.text, completed: false });
    res.sendStatus(200).end();
  });

  app.put('/todos/:id', function(req, res) {
    var newState = (req.body.completed === 'true');
    if (req.params.id == '_ALL_') {
      model.forEach(function(curr) {
        curr.completed = newState;
      });
      res.sendStatus(200).end();
      return;
    }
    model.lookup(req.params.id).completed = newState;
    res.sendStatus(200).end();
  });

  app.delete('/todos/:id', function(req, res) {
    model.remove(req.params.id);
    res.sendStatus(200).end();
  });

  app.get('/todos', function(req, res) {
    var isCompleted = req.query.what == 'completed';
    var isActive = req.query.what == 'active';

    var numCompleted = model.findAll(function(curr) { return curr.completed }).length;
    var numLeft = model.size() - numCompleted;
    var selected = model.findAll();
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

