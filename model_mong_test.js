var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;
var expect = require('expect.js');

var url = 'mongodb://localhost:27017/test_140';

describe('mongodb-persisted model', function() {
  var db;
  var collection;
  before(function(done) {
    MongoClient.connect(url, function(err, db_) {
      if (err) return done(err);
      db = db_;
      collection = db.collection('todos');
      done();
    });
  });
  after(function(done) {
    collection.drop(function(err) {
      db.close();
      done(err);
    });
  });

  it('retrieves stored data', function(done) {
    collection.insertMany([{text: 'TODO_1'}, {text: 'TODO_2'}], function(err, insertResult) {
      if (err) return done(err);
      var ids = insertResult.ops.map(function(curr) { return curr._id.toHexString() })
      collection.update({text: 'TODO_1'}, { $set: { completed: true } }, function(err) {
        if (err) return done(err);
        collection.findOne({_id: ObjectID.createFromHexString(ids[0])}, {text: true, completed: true}, function(err, doc) {
          if (err) return done(err);
          expect(doc.text).to.eql('TODO_1');
          expect(doc.completed).to.be(true);
          collection.removeMany({_id: ObjectID.createFromHexString(ids[0])}, function(err, removeResult) {
            if (err) return done(err);
            expect(removeResult.result.n).to.equal(1);
            done();
          });
        });
      });
    });
  });
});
