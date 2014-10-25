var express = require('express');
var jade = require('jade');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var morgan = require('morgan');
var logger = morgan('combined');
var path = require('path');
var funflow = require('funflow');

function createApp(port, done) {
  var app = express();

  app.set('port', port);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.use(logger);
  app.use(bodyParser.json());
  app.use(methodOverride());

  app.use(express.static(__dirname + '/public'));
  done(null, app);
}

exports.run = function(port, install, ready, done) {
  var flow = funflow.newFlow(
    function create(port, done) {
      createApp(port, done);
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
