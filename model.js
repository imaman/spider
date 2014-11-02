var util = require('util');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

exports.newModel = function(coll) {
  if (!coll) return inMemoryModel();

  function pick(where) {
    if (typeof where === 'string') {
      var id = ObjectID.createFromHexString(where);
      return {
        remove: function(done) {
          coll.removeOne({_id: id}, done);
        }
      };
    }
    return {
      map: function(mapper, done) {
        coll.find(where).toArray(function(err, data) {
          if (err) return done(err);
          done(null, data.map(mapper));
        });
      },
      size: function(done) {
        coll.find(where).toArray(function(err, data) {
          if (err) return done(err);
          done(null, data.length);
        });
      },
      remove: function(done) {
        coll.removeMany(where, function(err) {
          return done(err);
        });
      }
    }
  }

  return {
    size: function(done) {
      coll.count({}, done);
    },
    add: function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var done = args.pop();
      coll.insertMany(args, function(err, writeOpData) {
        if (err) return done(err);
        var ids = writeOpData.ops.map(function(curr) { return curr._id.toHexString() });
        done.bind(null, null).apply(null, ids);
      });
    },
    q: function(where) {
      return pick(where);
    },
    at: function(id, done) {
      coll.findOne({_id: ObjectID.createFromHexString(id)}, function(err, data) {
        if (err) return done(err);
        if (!data) return done(null, data);
        data._id = data._id.toHexString();
        done(null, data);
      });
    }
  };
}
/*
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
*/


function inMemoryModel() {
  var ordinal = 0;
  function nextId() {
    var res = ordinal;
    ++ordinal;
    return res;
  }

  var data = {};

  function all() {
    return Object.keys(data).filter(function(key) { return key }).map(function(key) { return data[key]; });
  }

  function pick(arg) {
    return (arg === null || arg === undefined) ? selectAll() :
      typeof(arg) === 'function' ? selectAll(arg) : select(arg)
  }

  function select(id) {
    function asArr() {
      var temp = data[id] || null;
      return (temp ? [temp] : []);
    }

    return {
      map: function(f, done) { done(null, asArr().map(f)) },
      forEach: function(act, done) { asArr().forEach(act); done() },
      remove: function(done) { delete data[id]; done(); },
      one: function(done) {
        var len = asArr().length;
        if (len > 0) return done('more than one');
        if (len == 0) return done(null, null);
        done(null, asArr()[0]);
      }
    };
  }

  function selectAll(pred) {
    pred = pred || function() { return true };
    return {
      q: function(arg) { return arg ? pick(arg) : this },
      forEach: function(act, done) { all().filter(pred).forEach(act); done() },
      remove: function(done) { this.forEach(function(curr) { delete data[curr.id] }, done) },
      size: function(done) { done(null, all().filter(pred).length); },
      map: function(f, done) { done(null, all().filter(pred).map(f)) }
    };
  }

  return {
    q: pick,
    add: function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var done = args.pop();
      var res = [null];
      args.forEach(function(curr) {
        curr.id = nextId(); data[curr.id] = curr; res.push(curr.id);
      });
      done.apply(null, res);
    },
    // Debugging/Testing purposes
    at: function(id, done) {
      this.q(id).map(function(curr) { return curr }, function(err, arr) {
        if (err) return done(err);
        if (arr.length > 1) return done('more than one result');
        if (arr.length == 0) return done(null, null);
        done(null, arr[0]);
      });
    },
    size: function(done) { return this.q().size(done) },
    toString: function() { return JSON.stringify(data, null, 2); }
  };
};


