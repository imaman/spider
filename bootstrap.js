var spider = require('./src/framework/spider.js');
var controller = require('./controller.js');
var Model = require('./src/framework/model.js');
var funflow = require('funflow');
var MongoClient = require('mongodb').MongoClient;

function ready(app) {
  console.log('>> Express server started at http://localhost:' + app.get('port'));
}

var url = 'mongodb://localhost:27017/prod_150';

var db;
var qToods;
var qPlaces;


var flow = funflow.newFlow(
  function create(done) {
    MongoClient.connect(url, done);
  },
  function populate(db_, done) {
    db = db_;
    qToods = Model.newModel(db.collection('todos'));
    qPlaces = Model.newModel(db.collection('places'));
    done();
  },
  function(done) {
    spider.run(3000, __dirname, controller.install.bind(null, qToods, qPlaces), ready, done);
  });

flow(null, function(err) {
    console.log('done. err=' + err);
});


