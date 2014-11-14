var funflow = require('funflow');
var autoController = require('./auto_controller.js');
var request = require('supertest');
var spider = require('./spider.js');
var Model = require('./model.js');
var expect = require('expect.js');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var url = 'mongodb://localhost:27017/test_spider';

describe('spider', function() {
  var db;
  var collection;
  var app;
  var qBooks;

  before(function(done) {
    MongoClient.connect(url, function(err, db_) {
      if (err) return done(err);
      db = db_;
      collection = db.collection('controller_testing_collection');
      done();
    });
  });
  after(function(done) {
    collection.drop(function() {
      db.close();
      done();
    });
  });
  beforeEach(function(done) {
    collection.removeMany({}, function(err) {
      if (err) return done(err);
      app = spider.createApp(-1, __dirname);
      qBooks = Model.newModel(collection);

      done();
    });
  });

  describe('creation of an app using autoController', function() {
    describe('resource introduced using defineResource()', function() {
      it('is initially empty', function(done) {
        autoController.defineResource(app, qBooks, 'books', 'book', {
          post: function(req) {
            return { title: req.body.title, author: req.body.author }
          },
          put: function(req, sel, done) {
            var data = {};
            if (req.body.title) data.title = req.body.title;
            if (req.body.authro) data.author = req.body.author;
            sel.update(data, done);
          }
        });
        funflow.newFlow(
          function getBooks(done) {
            request(app).get('/books.html').expect(200, done);
          },
          function getBooks2(done) {
            request(app).get('/books.html').expect(200, done);
          }
        )(null, done);
      });
    });
  });
});

