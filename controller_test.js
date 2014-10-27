var request = require('supertest');
var spider = require('./src/framework/spider.js');
var controller = require('./controller.js');
var Model = require('./model.js');
var expect = require('expect.js');

describe('controller', function() {
  it('shows a list of todo items', function(done) {
    var app = spider.createApp(3000, __dirname);
    var model = Model.newModel();
    model.add({text: 'TODO_1', completed: true});
    controller.install(model, app);
    request(app).
      get('/todos').
      expect(200, /TODO_1/, done);
  });
});


