var spider = require('./src/framework/spider.js');
var controller = require('./controller.js');


function ready(app) {
  console.log('>> Express server started at http://localhost:' + app.get('port'));
}

function done(err) {
  console.log('done. err=' + err);
}

spider.run(3000, __dirname, controller.install, ready, done);

