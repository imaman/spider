var util = require('util');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;


function normalizeChange(obj) {
  Object.keys(obj).forEach(function(k) {
    var v = obj[k];
    if (v === undefined) {
      delete obj[k];
    }
  });
}


function singletonQuery(coll, where) {
  var id = ObjectID.createFromHexString(where);
  var byId = {_id: id};

  function toArray(f) {
    coll.find(byId).toArray(f);
  }

  return {
    map: function(mapper, done) {
      toArray(function(err, data) {
        if (err) return done(err);
        if (mapper)
          data = data.map(mapper);
        done(null, data);
      });
    },
    size: function(done) {
      toArray(function(err, data) {
        if (err) return done(err);
        done(null, data.length);
      });
    },
    remove: function(done) {
      coll.removeOne(byId, done);
    },
    update: function(change, done) {
      normalizeChange(change);
      coll.update(byId, {$set: change}, done);
    },
    get: function(done) {
      toArray(function(err, data) {
        if (err) return done(err);
        var len = data.length;
        if (len > 1) return done('more than one.');
        if (len == 0) return done(null, null);
        done(null, data[0]);
      });
    }
  };
}

function pluralQuery(coll, where) {
  return {
    map: function(mapper, done) {
      coll.find(where).toArray(function(err, data) {
        if (err) return done(err);
        if (mapper)
          data = data.map(mapper);
        done(null, data);
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
    },
    update: function(change, done) {
      normalizeChange(change);
      coll.updateMany(where, {$set: change}, done);
    },
    get: function(done) {
      return this.map(null, done);
    },
    q: function(subWhere) {
      var d = where;
      if (subWhere) {
        d = {$and: [ where, subWhere ]};
      }
      return pick(coll, d)
    }
  }
}

function pick(coll, where) {
  if (typeof where === 'string')
    return singletonQuery(coll, where);
  else
    return pluralQuery(coll, where || {});
}

function create(coll) {
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
      return pick(coll, where);
    },
    at: function(id, done) {
      coll.findOne({_id: ObjectID.createFromHexString(id)}, function(err, data) {
        if (err) return done(err);
        if (!data) return done(null, data);
        data._id = data._id.toHexString();
        done(null, data);
      });
    },
    newModel: function(coll) {
      return create(coll);
    }
  };
}

exports.newModel = create;
