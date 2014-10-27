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
  describe('DELETE /todos/:id', function() {
    it('removes the item with the given ID', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      var id = model.add({text: 'TODO_1', completed: true});
      controller.install(model, app);
      request(app).
        delete('/todos/' + id).
        expect(function(res) {
          expect(model.q(id).one()).to.be(null);
        }).
        end(done);
    });
  });
  describe('PUT /todos/:id', function() {
    it('sets the completion state of the item with the given ID', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      var id = model.add({text: 'TODO_1', completed: false});
      controller.install(model, app);
      request(app).
        put('/todos/' + id + '?completed=true').
        expect(function(res) {
          expect(model.q(id).one().completed).to.be(true);
        }).
        end(done);
    });
    it('sets the completion state of only the item with the given ID', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      var a = model.add({text: 'TODO_1', completed: false});
      var b = model.add({text: 'TODO_2', completed: false});

      controller.install(model, app);
      request(app).
        put('/todos/' + a + '?completed=true').
        expect(function(res) {
          expect(model.q(b).one().completed).to.be(false);
        }).
        end(done);
    });
    it('sets the completion state of all items when id is _ALL_', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add({text: 'TODO_1', completed: true});
      model.add({text: 'TODO_2', completed: true});
      model.add({text: 'TODO_3', completed: true});

      controller.install(model, app);
      request(app).
        put('/todos/_ALL_?completed=false').
        expect(function(res) {
          expect(model.q().map(function(curr) { return curr.completed })).to.eql([false, false, false]);
        }).
        end(done);
    });
  });
});


