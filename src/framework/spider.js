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

function x(port, done) {
  var flow = funflow.newFlow(
    function create(port, done) {
      console.log('L.31');
      createApp(port, done);
    },
    function listen(app, done) {
      console.log('L.35');
      this.app = app;
      this.server = app.listen(app.get('port'), done)
    },
    function serverIsUp(next) {
      console.log('> Express server started at http://localhost:' + this.app.get('port'));
      next();
    }
  );
  console.log('L.44');
  flow(null, port, done);
}

exports.run = function(port, done) {
  console.log('@@@@ ' + port);
  x(port, done);
};


//
//
