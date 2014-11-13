var express = require('express');
var jade = require('jade');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var morgan = require('morgan');
var logger = morgan('combined');
var path = require('path');
var funflow = require('funflow');

exports.createApp = function(port, rootDir) {
  var app = express();

  app.set('port', port);
  app.set('views', [path.join(rootDir, 'views'), path.join(rootDir, 'auto_views')]);
  app.set('view engine', 'jade');

  app.use(logger);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(methodOverride());

  app.use(express.static(rootDir + '/bower_components'));
  app.use(express.static(rootDir + '/css'));
  app.use(express.static(rootDir + '/public'));
  return app;
}

exports.run = function(port, rootDir, install, ready, done) {
  var flow = funflow.newFlow(
    function create(port, done) {
      done(null, exports.createApp(port, rootDir));
    },
    function listen(app, done) {
      this.app = app;
      install(app);
      this.server = app.listen(app.get('port'), done);
    },
    function serverIsUp(done) {
      ready(this.app);
      done();
    }
  );
  flow(null, port, done);
};


//
//
