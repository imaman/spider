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
      model.add({text: 'TODO_1', completed: true}, function (err) {
        if (err) return done(err);
        controller.install(model, app);
        request(app).
          get('/todos').
          expect(200, /TODO_1/, done);
      });
    });
  });
  describe('GET /todos_completed', function() {
    it('lists only completed items', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add({text: 'COMPLETED_TODO', completed: true},
         {text: 'ACTIVE_TODO', completed: false},
         function (err) {
        if (err) return done(err);
        controller.install(model, app);
        request(app).
          get('/todos_completed').
          expect(function(res) {
            expect(res.text).to.contain('COMPLETED_TODO');
            expect(res.text).not.to.contain('ACTIVE_TODO');
          }).
          end(done);
      });
    });
  });
  describe('GET /todos_active', function() {
    it('lists only active items', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add({text: 'COMPLETED_TODO', completed: true},
          {text: 'ACTIVE_TODO', completed: false},
          function (err) {
        if (err) return done(err);
        controller.install(model, app);
        request(app).
          get('/todos_active').
          expect(function(res) {
            expect(res.text).not.to.contain('COMPLETED_TODO');
            expect(res.text).to.contain('ACTIVE_TODO');
          }).
          end(done);
      });
    });
  });
  describe('DELETE /todos/:id', function() {
    it('removes the item with the given ID', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add({text: 'TODO_1', completed: true}, function(err, id) {
        if (err) return done(err);
        controller.install(model, app);
        request(app).
          delete('/todos/' + id).
          expect(function(res) {
            expect(model.q(id).one()).to.be(null);
          }).
          expect(200, done);
      });
    });
  });
  describe('PUT /todos/:id', function() {
    it('sets the completion state of the item with the given ID', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add({text: 'TODO_1', completed: false}, function(err, id) {
        if (err) return done(err);
        controller.install(model, app);
        request(app).
          put('/todos/' + id + '?completed=true').
          expect(function(res) {
            expect(model.q(id).one().completed).to.be(true);
          }).
          end(done);
      });
    });
    it('sets the completion state of only the item with the given ID', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add({text: 'TODO_1', completed: false},
          {text: 'TODO_2', completed: false},
          function(err, a, b) {
        if (err) return done(err);
        controller.install(model, app);
        request(app).
          put('/todos/' + a + '?completed=true').
          expect(function(res) {
            expect(model.q(b).one().completed).to.be(false);
          }).
          end(done);
      });
    });
  });
  describe('PUT /todos', function() {
    it('sets the completion state of all items', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add({text: 'TODO_1', completed: true},
          {text: 'TODO_2', completed: true},
          {text: 'TODO_3', completed: true},
          function(err) {
        if(err) return done(err);
        controller.install(model, app);
        request(app).
          put('/todos/?completed=false').
          expect(function(res) {
            expect(model.q().map(function(curr) { return curr.completed })).to.eql([false, false, false]);
          }).
          end(done);
      });
    });
  });

  describe('POST /todos', function() {
    it('creates a new item', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();

      controller.install(model, app);
      request(app).
        post('/todos').
        send({ text: 'TODO_100' }).
        expect(function(res) {
          expect(model.q().map(function(curr) { return curr.text })).to.eql(['TODO_100']);
        }).
        end(done);
    });
    it('500s if the item cannot be added to the DB', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();
      model.add = function() { throw new Error('add() failed') };

      controller.install(model, app);
      request(app).
        post('/todos').
        send({ text: 'TODO_100' }).
        expect(500, done);
    });
  });

  describe('DELETE /todos_completed', function() {
    it('removes completed items', function(done) {
      var app = spider.createApp(-1, __dirname);
      var model = Model.newModel();

      model.add({text: 'COMPLETED_1', completed: true},
          {text: 'ACTIVE', completed: false},
          {text: 'COMPLETED_2', completed: true},
          function(err) {
        if (err) return done(err);
        controller.install(model, app);
        request(app).
          delete('/todos_completed').
          expect(function(res) {
            expect(model.q().map(function(curr) { return curr.text })).to.eql(['ACTIVE']);
          }).
          expect(200, done);
      });
    });
  });
});


