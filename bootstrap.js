var spider = require('./src/framework/spider.js');
var controller = require('./controller.js');
var Model = require('./model.js');


function ready(app) {
  console.log('>> Express server started at http://localhost:' + app.get('port'));
}

function done(err) {
  console.log('done. err=' + err);
}

var model = Model.newModel();
model.add({text: 'Create a TodoMVC template', completed: true });
model.add({text: 'Rule the web', completed: false });

spider.run(3000, __dirname, controller.install.bind(null, model), ready, done);

