var request = require('supertest');
var spider = require('./src/framework/spider.js');
var controller = require('./controller.js');
var Model = require('./src/framework/model.js');
var expect = require('expect.js');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var url = 'mongodb://localhost:27017/test_150';

describe('controller', function() {
  var db;
  var collection;
  var app;
  var model;

  function newModel() {
    return Model.newModel(collection);
  }

  before(function(done) {
    MongoClient.connect(url, function(err, db_) {
      if (err) return done(err);
      db = db_;
      collection = db.collection('controller_testing');
      done();
    });
  });
  after(function(done) {
    collection.drop(function(err) {
      db.close();
      done();
    });
  });
  beforeEach(function(done) {
    collection.removeMany({}, done);
    app = spider.createApp(-1, __dirname);
    model = newModel();
    controller.install(model, app);
  });

  describe('GET /', function() {
    it('lists all todo items', function(done) {
      model.add({text: 'TODO_1', completed: true}, function (err) {
        if (err) return done(err);
        request(app).
          get('/').
          expect(200, /TODO_1/, done);
      });
    });
  });
  describe('GET /todos', function() {
    it('lists all todo items', function(done) {
      model.add({text: 'TODO_1', completed: true}, function (err) {
        if (err) return done(err);
        request(app).
          get('/todos').
          expect(200, /TODO_1/, done);
      });
    });
  });
  describe('GET /todos.json', function() {
    it('sends back a JSON object of all todo items', function(done) {
      model.add({text: 'TODO_1', completed: true}, function (err, id) {
        if (err) return done(err);
        request(app).
          get('/todos.json').
          expect('Content-Type', /json/).
          expect(200, {
            byController: 'todos',
            numCompleted: 1,
            numActive: 0,
            todoItems: [{
              text: 'TODO_1',
              completed: true,
              _id: id
            }]
          }).
          end(done);
      });
    });
  });
  describe('GET /todos_completed', function() {
    it('lists only completed items', function(done) {
      model.add({text: 'COMPLETED_TODO', completed: true},
         {text: 'ACTIVE_TODO', completed: false},
         function (err) {
        if (err) return done(err);
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
      model.add({text: 'COMPLETED_TODO', completed: true},
          {text: 'ACTIVE_TODO', completed: false},
          function (err) {
        if (err) return done(err);
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

  describe('GET /todos:id', function() {
    it('responds with the JSON representation of an item', function(done) {
      model.add({text: 'A', completed: true}, function(err, id) {
        if (err) return done(err);
        request(app).
          get('/todos/' + id + '.json').
          expect(function(recap) {
            expect(recap.body).to.eql({
              _id: id,
              text: 'A',
              completed: true,
              byController: 'todo'
            });
          }).
          end(done);
      });
    });
  });
  describe('DELETE /todos/:id', function() {
    it('removes the item with the given ID', function(done) {
      model.add({text: 'TODO_1', completed: true}, function(err, id) {
        if (err) return done(err);
        request(app).
          delete('/todos/' + id).
          expect(function(res) {
            model.q(id).one(function(err, value) {
              if (err) return done(err);
              expect(value).to.be(null);
            });
          }).
          expect(200, done);
      });
    });
  });
  describe('PUT /todos/:id', function() {
    it('sets the completion state of an item when .completed is true', function(done) {
      model.add({text: 'TODO_1', completed: false}, function(err, id) {
        if (err) return done(err);
        request(app).
          put('/todos/' + id).
          send({completed: true}).
          expect(function(res) {
            model.q(id).one(function(err, data) {
              if (err) return done(err);
              expect(data.completed).to.be(true);
              expect(data.text).to.equal('TODO_1');
            });
          }).
          end(done);
      });
    });
    it('clears the completion state of an item when .completed is false', function(done) {
      model.add({text: 'TODO_1', completed: true}, function(err, id) {
        if (err) return done(err);
        request(app).
          put('/todos/' + id).
          send({completed: false}).
          expect(function(res) {
            model.q(id).one(function(err, data) {
              if (err) return done(err);
              expect(data.completed).to.be(false);
              expect(data.text).to.equal('TODO_1');
            });
          }).
          end(done);
      });
    });
    it('sets the completion state of only the item with the given ID', function(done) {
      model.add({text: 'TODO_1', completed: false},
          {text: 'TODO_2', completed: false},
          function(err, a, b) {
        if (err) return done(err);
        request(app).
          put('/todos/' + a).
          send({completed: true}).
          expect(function(res) {
            model.q(b).map(function(curr) { return curr.completed },
              function(err, states) {
                if (err) return done(err);
                expect(states).to.eql([false]);
              });
          }).
          end(done);
      });
    });
    it('sets the text of an item when .text is specified', function(done) {
      model.add({text: 'TODO_1', completed: true},
          function(err, id) {
        if (err) return done(err);
        request(app).
          put('/todos/' + id).
          send({text: 'new text'}).
          expect(function(res) {
            model.q(id).one(function(err, data) {
              if (err) return done(err);
              expect(data.text).to.equal('new text');
              expect(data.completed).to.be(true);
            });
          }).
          end(done);
      });
    });
  });
  describe('PUT /todos', function() {
    it('sets the completion state of all items', function(done) {
      model.add({text: 'TODO_1', completed: true},
          {text: 'TODO_2', completed: true},
          {text: 'TODO_3', completed: true},
          function(err) {
        if(err) return done(err);
        request(app).
          put('/todos').
          send({completed: false}).
          expect(function(res) {
            model.q().map(function(curr) { return curr.completed },
              function(err, states) {
                if (err) return done(err);
                expect(states).to.eql([false, false, false]);
              });
          }).
          end(done);
      });
    });
  });

  describe('POST /todos', function() {
    it('creates a new item', function(done) {
      request(app).
        post('/todos').
        send({ text: 'TODO_100' }).
        expect(function(res) {
          model.q().map(function(curr) { return curr.text },
            function(err, texts) {
              if (err) return done(err);
              expect(texts).to.eql(['TODO_100']);
            });
        }).
        end(done);
    });
    it('500s if the item cannot be added to the DB', function(done) {
      model.add = function() { throw new Error('add() failed') };

      request(app).
        post('/todos').
        send({ text: 'TODO_100' }).
        expect(500, done);
    });
  });

  describe('DELETE /todos_completed', function() {
    it('removes completed items', function(done) {
      model.add({text: 'COMPLETED_1', completed: true},
          {text: 'ACTIVE', completed: false},
          {text: 'COMPLETED_2', completed: true},
          function(err) {
        if (err) return done(err);
        request(app).
          delete('/todos_completed').
          expect(function(res) {
            model.q().map(function(curr) { return curr.text },
              function(err, texts) {
                if (err) return done(err);
                expect(texts).to.eql(['ACTIVE']);
              });
          }).
          expect(200, done);
      });
    });
  });
});


