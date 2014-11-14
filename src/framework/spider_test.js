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
      it('sets up GET, PUT, POST, DELETE routes', function(done) {
        autoController.defineResource(app, qBooks, 'books', 'book', {
          post: function(req) {
            return { title: req.body.title, author: req.body.author }
          },
          put: function(req, sel, done) {
            sel.update({title: req.body.title, author: req.body.author}, done);
          }
        });
        funflow.newFlow(
          function getBooksInitially(done) {
            request(app).get('/books.json').expect(200).end(done);
          },
          function isEmpty(recap, done) {
            expect(recap.body).to.eql([]);
            done();
          },
          function post(done) {
            request(app).post('/books').send({ title: 'T1', author: 'A1' }).expect(201, done);
          },
          function getBooks(recap, done) {
            this.id = recap.body.id;
            request(app).get('/books.json').expect(200, done);
          },
          function containsThePostedBook(recap, done) {
            expect(recap.body).to.eql([{ _id: this.id, title: 'T1', author: 'A1' }]);
            done();
          },
          function getBooksHtml(done) {
            request(app).get('/books.html').expect(200, done);
          },
          function containsRendering(recap, done) {
            expect(recap.text).to.contain('<td>T1</td>');
            done();
          },
          function getBook(done) {
            request(app).get('/books/' + this.id + '.json').expect(200, done);
          },
          function checkJsonOfPostedBook(recap, done) {
            expect(recap.body).to.eql({
              _id: this.id,
              title: 'T1',
              author: 'A1',
              byController: 'book',
              collectionController: 'books'
            });
            done();
          },
          function getBookHtml(done) {
            request(app).get('/books/' + this.id + '.html').expect(200, done);
          },
          function checkRenderingOfPostedBook(recap, done) {
            expect(recap.text).to.contain('<input type="text" id="input_author" value="A1" class="form-control">');
            expect(recap.text).to.contain('<input type="text" id="input_title" value="T1" class="form-control">');
            done();
          },
          function update(done) {
            request(app).put('/books/' + this.id).send({title: 'NEW_TITLE'}).expect(204, done);
          },
          function getJsonOfUpdatedBook(done) {
            request(app).get('/books/' + this.id + '.json').expect(200, done);
          },
          function checkJsonOfUpdatedBook(recap, done) {
            expect(recap.body).to.have.property('title', 'NEW_TITLE');
            expect(recap.body).to.have.property('author', 'A1');
            done();
          },
          function deleteTheBook(done) {
            request(app).delete('/books/' + this.id).expect(204, done);
          },
          function listBooksAfterDeletion(done) {
            request(app).get('/books.json').expect(200, done);
          },
          function checkAfterDeletion(recap, done) {
            expect(recap.body).to.eql([]);
            done();
          }
        )(null, done);
      });
      it('PUT updates only a single document', function(done) {
        autoController.defineResource(app, qBooks, 'books', 'book', {
          post: function(req) {
            return { title: req.body.title, author: req.body.author }
          },
          put: function(req, sel, done) {
            sel.update({title: req.body.title, author: req.body.author}, done);
          }
        });
        funflow.newFlow(
          function postFirstBook(done) {
            request(app).post('/books').send({title: 'T1', author: 'A1'}).expect(201, done);
          },
          function postSecondBook(recap, done) {
            this.id1 = recap.body.id;
            request(app).post('/books').send({title: 'T2', author: 'A2'}).expect(201, done);
          },
          function listBooks(recap, done) {
            this.id2 = recap.body.id;
            request(app).get('/books.json').expect(200, done);
          },
          function checkList(recap, done) {
            expect(recap.body[0]).to.have.property('title', 'T1');
            expect(recap.body[1]).to.have.property('title', 'T2');
            done();
          },
          function updateFirst(done) {
            request(app).put('/books/' + this.id1).send({title: 'NEW_T1'}).expect(204, done);
          },
          function listBooksAfterPut(done) {
            request(app).get('/books.json').expect(200, done);
          },
          function checkListAfterPut(recap, done) {
            expect(recap.body[0]).to.have.property('title', 'NEW_T1');
            expect(recap.body[1]).to.have.property('title', 'T2');
            done();
          }
        )(null, done);
      });
      it('DELETE removes only the specified document', function(done) {
        autoController.defineResource(app, qBooks, 'books', 'book', {
          post: function(req) {
            return { title: req.body.title, author: req.body.author }
          },
          put: 'NOT_USED'
        });
        funflow.newFlow(
          function postFirstBook(done) {
            request(app).post('/books').send({title: 'T1', author: 'A1'}).expect(201, done);
          },
          function postSecondBook(recap, done) {
            this.id1 = recap.body.id;
            request(app).post('/books').send({title: 'T2', author: 'A2'}).expect(201, done);
          },
          function deleteFirst(done) {
            request(app).delete('/books/' + this.id1).expect(204, done);
          },
          function listBooksAfterDelete(done) {
            request(app).get('/books.json').expect(200, done);
          },
          function checkListAfterDelete(recap, done) {
            var titles = recap.body.map(function(curr) { return curr.title });
            expect(titles).to.eql(['T2']);
            done();
          }
        )(null, done);
      });
      it('POST failures are propagated back to the client side', function(done) {
        autoController.defineResource(app, qBooks, 'books', 'book', {
          post: function(req) {
            throw new Error('Rejected');
          },
          put: 'NOT_USED'
        });
        request(app).post('/books').send({}).expect(400, function(err, recap) {
          expect(err).to.be(null);
          expect(recap.body).to.eql({message: 'Rejected'});
          done();
        });
      });
      it('PUT failures are propagated back to the client side', function(done) {
        autoController.defineResource(app, qBooks, 'books', 'book', {
          post: 'NOT_USED',
          put: function(req, sel, done) {
            done('PUT_REJECTED');
          }
        });
        request(app).put('/books/1234567890ab1234567890ab').send({}).expect(400, function(err, recap) {
          expect(err).to.be(null);
          expect(recap.body).to.have.property('message', 'PUT_REJECTED');
          done();
        });
      });
    });
  });
});

