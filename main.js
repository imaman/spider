var spider = require('./src/framework/spider.js');


function done(err) {
  console.log('done. err=' + err);
}

function ready(app) {
  app.get('/', function(req, res) {
    res.type('txt').send('Hi there');
  });
}

spider.run(3000, ready, done);

