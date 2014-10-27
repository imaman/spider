var request = require('supertest');
var spider = require('./src/framework/spider.js');
var controller = require('./controller.js');
var Model = require('./model.js');
var expect = require('expect.js');

describe('controller', function() {
  describe('GET /todos', function() {
    it('lists all todo items', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add({text: 'TODO_1', completed: true});
      controller.install(model, app);
      request(app).
        get('/todos').
        expect(200, /TODO_1/, done);
    });
    it('lists only completed items when ?what=completed', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add({text: 'COMPLETED_TODO', completed: true});
      model.add({text: 'ACTIVE_TODO', completed: false});
      controller.install(model, app);
      request(app).
        get('/todos?what=completed').
        expect(function(res) {
          expect(res.text).to.contain('COMPLETED_TODO');
          expect(res.text).not.to.contain('ACTIVE_TODO');
        }).
        end(done);
    });
    it('lists only completed items when ?what=acive', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add({text: 'COMPLETED_TODO', completed: true});
      model.add({text: 'ACTIVE_TODO', completed: false});
      controller.install(model, app);
      request(app).
        get('/todos?what=active').
        expect(function(res) {
          expect(res.text).not.to.contain('COMPLETED_TODO');
          expect(res.text).to.contain('ACTIVE_TODO');
        }).
        end(done);
    });
  });
});


