var spider = require('./src/framework/spider.js');
var controller = require('./controller.js');
var Model = require('./model.js');
var funflow = require('funflow');

function ready(app) {
  console.log('>> Express server started at http://localhost:' + app.get('port'));
}

var model = Model.newModel();
var flow = funflow.newFlow(
  function populate(done) {
    model.add(
     {text: 'Create a TodoMVC template', completed: true },
     {text: 'Rule the web', completed: false },
     done);
  },
  function(done) {
    spider.run(3000, __dirname, controller.install.bind(null, model), ready, done);
  });

flow(null, function(err) {
    console.log('done. err=' + err);
});


