var expect = require('expect.js');
var model = require('./model.js');
var funflow = require('funflow');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var url = 'mongodb://localhost:27017/test_150';

describe('model', function() {
  var db;
  var collection;

  function newModel(c) {
    return model.newModel(c);
  }

  before(function(done) {
    MongoClient.connect(url, function(err, db_) {
      if (err) return done(err);
      db = db_;
      collection = db.collection('model_testing');
      done();
    });
  });
  after(function(done) {
    collection.drop(function(err) {
      db.close();
      done();
    });
  });

  afterEach(function(done) {
    collection.drop(function() {
      done(null);
    });
  });

  it('is initially empty', function() {
    var model = newModel(collection);
    model.size(function(err, value) {
      if (err) return done(err);
      expect(value).to.be(0);
    });
  });

  it('allows elements to be added', function(done) {
    var model = newModel(collection);
    model.add({text: '_'}, function(err) {
      if (err) return done(err);
      model.size(function(err, value) {
        if (err) return done(err);
        expect(value).to.be(1);
        done();
      });
    });
  });

  describe('querying', function() {
    it('can find by ID', function(done) {
      var model = newModel(collection);
      model.add({text: 'SOME_TEXT'}, function(err, id) {
        if (err) return done(err);
        model.q(id).map(function(curr) { return curr.text }, function(err, texts) {
          if (err) return done(err);
          expect(texts).to.eql(['SOME_TEXT']);
          done();
        });
      });
    });
    it('can find by predicate', function(done) {
      var model = newModel(collection);
      model.add({text: 'A1'}, {text: 'B'}, {text: 'A2'}, function(err, a1, b, a2) {
        if (err) return done(err);
        var query = model.q({ text: { $regex: /^A/ }});
        query.map(function(curr) { return curr.text }, function(err, texts) {
          if (err) return done(err);
          expect(texts).to.contain('A1');
          expect(texts).to.contain('A2');
          expect(texts).not.to.contain('B');
          done();
        });
      });
    });
    it('finds all if the query is falsy', function(done) {
      var model = newModel(collection);
      model.add({text: 'A'}, {text: 'B'}, function(err, a, b) {
        if(err) return done(err);
        var query = model.q(null);
        query.map(function(curr) { return curr.text }, function(err, texts) {
          if (err) return done(err);
          expect(texts).to.contain('A');
          expect(texts).to.contain('B');
          expect(texts).to.have.length(2);
          done();
        });
      });
    });
    it('reports result set size', function(done) {
      var model = newModel(collection);
      model.q({text: 'some_weird_value'}).size(function(err, size) {
        if (err) return done(err);
        expect(size).to.equal(0);
        model.add({text: 'A'}, function(err, id) {
          if (err) return done(err);
          expect(id).not.to.be(null);
          model.add({text: 'B'}, {text: 'A'}, function(err, idA, idB) {
            if (err) return done(err);
            model.q().size(function(err, sz) {
              if (err) return done(err);
              expect(sz).to.equal(3);
              model.q({text: 'A'}).size(function(err, sz) {
                if (err) return done(err);
                expect(sz).to.equal(2);
                model.q(id).size(function(err, sz) {
                  if (err) return done(err);
                  expect(sz).to.equal(1);
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('is lazily evaluated', function(done) {
      var model = newModel(collection);
      var q = model.q({ text: { $regex: /^A/ }});

      var flow = funflow.newFlow(
        function sizeWhenEmpty(done) { q.size(done) },
        function is0(value, done) {
          expect(value).to.equal(0);
          model.add({text: 'A'}, done);
        },
        function sizeAfterA(done) { q.size(done) },
        function is1(value, done) {
          expect(value).to.equal(1);
          model.add({text: 'A'}, done);
        },
        function sizeAfterB(done) { q.size(done) },
        function is2(value, done) {
          expect(value).to.equal(2);
          model.q().remove(done);
        },
        function sizeAfterRemove(done) { q.size(done) },
        function is0again(value, err) {
          expect(value).to.equal(0);
          done();
        }
      )(null, done);
    });
  });

  describe('updates', function() {
    it('can change existing fields of an item', function(done) {
      var model = newModel(collection);
      model.add({text: 'OLD_TEXT'}, function(err, id) {
        if(err) return done(err);
        model.q(id).update({text: 'NEW_TEXT'}, function(err) {
          if(err) return done(err);
          model.at(id, function(err, item) {
            expect(item).to.have.property('text').equal('NEW_TEXT');
            done();
          });
        });
      });
    });
    it('changes only the specified fields of that item', function(done) {
      var model = newModel(collection);
      model.add({a: 'A1', b: 'B1', c: 'C1'}, function(err, id) {
        if(err) return done(err);
        model.q(id).update({b: 'B2', c: 'C2'}, function(err) {
          if(err) return done(err);
          model.at(id, function(err, item) {
            expect(item).to.have.property('a', 'A1');
            expect(item).to.have.property('b', 'B2');
            expect(item).to.have.property('c', 'C2');
            done();
          });
        });
      });
    });
    it('ignores undefined fields', function(done) {
      var model = newModel(collection);
      model.add({a: 'A1', b: 'B1'}, function(err, id) {
        if(err) return done(err);
        model.q(id).update({b: 'B2', a: undefined}, function(err) {
          if(err) return done(err);
          model.at(id, function(err, item) {
            expect(item).to.have.property('a', 'A1');
            expect(item).to.have.property('b', 'B2');
            done();
          });
        });
      });
    });
    it('can update multiple items at once', function(done) {
      var model = newModel(collection);
      model.add({n: 100}, {n: 200}, function(err, id) {
        if(err) return done(err);
        model.q().update({n: 500}, function(err) {
          if(err) return done(err);
          model.q().map(function(curr) { return curr.n }, function(err, ns) {
            if (err) return done(err);
            expect(ns).to.eql([500, 500]);
            done();
          });
        });
      });
    });
    it('ignores undefined fields (also) when updating multiple items', function(done) {
      var model = newModel(collection);
      model.add({n: 100, m: 1}, {n: 200, m: 2}, function(err, id) {
        if(err) return done(err);
        model.q().update({n: 500, m: undefined}, function(err) {
          if(err) return done(err);
          model.q().map(function(curr) { return curr.n + '/' + curr.m }, function(err, items) {
            if (err) return done(err);
            items.sort();
            expect(items).to.eql(['500/1', '500/2']);
            done();
          });
        });
      });
    });
  });

  describe('at', function() {
    it('finds an item by its ID', function(done) {
      var model = newModel(collection);
      model.add({text: 'SOME_TEXT'}, function(err, id) {
        if(err) return done(err);
        model.at(id, function(err, item) {
          expect(item).to.have.property('text').equal('SOME_TEXT');
          expect(item).to.have.property('_id').eql(id);
          done();
        });
      });
    });
    xit('returns null when if the ID was not found', function(done) {
      var model = newModel(collection);
      expectAt(model, '0123456789AB01234567890AB', null, done);
    });
  });


  it('can delete an item by ID', function(done) {
    var model = newModel(collection);
    model.add({text: 'SOME_TEXT'}, function(err, id) {
      if (err) return done(err);
      model.q(id).remove(function(err) {
        if (err) return done(err);
        expectAt(model, id, null, done);
      });
    });
  });

  function expectAt(model, id, expected, done) {
    model.at(id, function(err, value) {
      expect(err).to.be(null);
      expect(value).to.equal(expected);
      done();
    });
  }

  describe('remove multiple items', function() {
    it('deletes the item that matches the predicate', function(done) {
      var model = newModel(collection);
      model.add({text: 'A'}, function(err, a) {
        if (err) return done(err);
        model.q({ text: { $regex: /^A/ }}).remove(function(err) {
          if (err) return done(err);
          expectAt(model, a, null, done);
        });
      });
    });
    it('deletes only the item that matches the predicate', function(done) {
      var model = newModel(collection);
      model.add({text: 'A'}, {text: 'B'}, function(err, a, b) {
        if (err) return done(err);
        model.q({ text: 'A'}).remove(function(err) {
          if (err) return done(err);
          expectAt(model, a, null, function() {
            model.at(b, function(err, value) {
              expect(value).to.have.property('text').equal('B');
              done();
            });
          });
        });
      });
    });
    it('deletes all items that match the predicate', function(done) {
      var model = newModel(collection);
      model.add({text: 'A'}, {text: 'B'}, {text: 'A'}, function(err, a1, b, a2) {
        if (err) return done(err);
        model.q({ text: 'A'}).remove(function(err) {
          if (err) return done(err);
          expectAt(model, a1, null, function() {
            model.at(b, function(err, value) {
              expect(value).not.to.be(null);
              expectAt(model, a2, null, done);
            });
          });
        });
      });
    });
  });

  describe('nested array queries', function() {
    it('is created by passing the field name inside an array as a sub-query', function() {
      var model = newModel(collection);
      model.q('1234567890ab1234567890ab').q(['arrName']);
    });
    it('returns the size of the nested array', function(done) {
      var model = newModel(collection);
      funflow.newFlow(
        function createDoc(done) {
          model.add({names: []}, done);
        },
        function size(id, done) {
          this.id = id;
          this.q = model.q(id).q(['names']);
          this.q.size(done);
        },
        function shouldBeZero(size, done) {
          expect(size).to.equal(0);
          done();
        },
        function addAnElement(done) {
          this.q.add('John', done);
        },
        function checkSucces(done) {
          this.q.get(done);
        },
        function checkContent(data, done) {
          expect(data).to.eql(['John']);
          this.q.size(done);
        },
        function sizeAfterInsertion(size, done) {
          expect(size).to.equal(1);
          done();
        }
      )(null, function(e) {
        done(e && e.flowTrace);
      });
    });
  });
});
