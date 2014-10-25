var spider = require('./src/framework/spider.js');


function install(app) {
  app.get('/', function(req, res) {
    res.type('txt').send('Hi there');
  });
  app.get('/todos', function(req, res) {
    res.sendFile(__dirname + '/index.html');
  });
}

function ready(app) {
  console.log('>> Express server started at http://localhost:' + app.get('port'));
}

function done(err) {
  console.log('done. err=' + err);
}

spider.run(3000, __dirname, install, ready, done);

