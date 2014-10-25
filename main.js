var spider = require('./src/framework/spider.js');


function install(app) {
  app.get('/', function(req, res) {
    res.type('txt').send('Hi there');
  });
  app.get('/todos', function(req, res) {
    var isCompleted = req.query.what == 'completed';
    var isActive = req.query.what == 'active';
    var arr = [
      { text: 'Create a TodoMVC template', completed: true },
      { text: 'Rule the web', completed: false },
    ];

    var numCompleted =  arr.filter(function(curr) { return curr.completed }).length
    var numLeft = arr.length - numCompleted;
    if (isCompleted || isActive) {
      arr = arr.filter(function(curr) { return curr.completed == isCompleted });
    }
    res.render('index', {
      todoItems: arr,
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

