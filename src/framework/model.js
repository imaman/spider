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


function inject(toArray, target) {
  target.map = function(mapper, done) {
    toArray(function(err, data) {
      if (err) return done(err);
      if (mapper)
        data = data.map(mapper);
      done(null, data);
    });
  };
  target.size = function(done) {
    toArray(function(err, data) {
      if (err) return done(err);
      done(null, data.length);
    });
  };
  return target;
}

function nestedArrayQuery(coll, id, fieldName) {
  var byId = {_id: ObjectID.createFromHexString(id)}

  function toArray(f) {
    coll.find(byId).toArray(f);
  }
  return {
    size: function(done) {
      toArray(function(err, x) {
        if (err) return done(err);
        if (x.length !== 1) return done('Size should be 1 but was '  +x.length);
        done(null, x[0][fieldName].length);
      });
    },
    get: function(done) {
      toArray(function(err, x) {
        if (err) return done(err);
        if (x.length !== 1) return done('Size should be 1 but was '  +x.length);
        done(null, x[0][fieldName]);
      });
    },
    add: function(v, done) {
      var change = {};
      change[fieldName] = v;
      coll.updateOne(byId, {$push: change}, done);
    }
  };
}
function singletonQuery(coll, id) {
  var byId = {_id: ObjectID.createFromHexString(id)}

  function toArray(f) {
    coll.find(byId).toArray(f);
  }

  return inject(toArray, {
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
    },
    q: function(subWhere) {
      if (util.isArray(subWhere))
        return nestedArrayQuery(coll, id, subWhere[0]);
      throw new Error('sub-query must be an array');
    }
  });
}

function query(coll, where) {
  function toArray(f) {
    coll.find(where).toArray(f);
  }
  return inject(toArray, {
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
      return !subWhere ? this : query(coll, {$and: [ where, subWhere ]});
    }
  });
}

function newModel(coll) {
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
      if (typeof where === 'string')
        return singletonQuery(coll, where);
      else
        return query(coll, where || {});
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

exports.newModel = newModel;
