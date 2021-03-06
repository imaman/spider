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

function nestedArrayElementQuery(coll, id, fieldName, key, val) {
  var byId = {_id: ObjectID.createFromHexString(id)}

  var projection = {};
  projection[fieldName] = true;

  function one(f) {
    coll.findOne(byId, projection, f);
  }
  return {
    remove: function(done) {
      var change = {$pull: {}};
      change['$pull'][fieldName] = val;
      if (key) {
        change['$pull'][fieldName] = {};
        change['$pull'][fieldName][key] = val;
      }
      coll.update(byId, change, done);
    },
    update: function(change, done) {
      var setter = {};
      Object.keys(change).forEach(function(k) {
        setter[fieldName + '.$.' + k] = change[k];
      });

      var cond = { _id: byId._id };
      cond[fieldName + '.' + key] = val;
      coll.update(cond, {$set: setter}, done);
    },
    get: function(done) {
      var cond = { _id: byId._id };
      var elemCond = {};
      elemCond[fieldName] = { $elemMatch: {} };
      elemCond[fieldName]['$elemMatch'][key] = val;
      coll.findOne(byId, elemCond, function(err, element) {
        if (err) return done(err);
        var arr = element[fieldName];
        if (arr.length != 1) return done('Expected exactly one match but found ' + arr.lengh);
        done(null, arr[0]);
      });
    }
  }
}

function nestedArrayQuery(coll, id, fieldName) {
  var byId = {_id: ObjectID.createFromHexString(id)}

  var projection = {};
  projection[fieldName] = true;

  function one(f) {
    coll.findOne(byId, projection, f);
  }
  return {
    map: function(mapper, done) {
      this.get(function(err, arr) {
        if (err) return done(err);
        done(null, arr.map(mapper));
      });
    },
    size: function(done) {
      this.get(function(err, arr) {
        if (err) return done(err);
        done(null, arr.length);
      });
    },
    remove: function(done) {
      var change = {};
      change[fieldName] = [];
      coll.updateOne(byId, {$set: change}, done);
    },
    get: function(done) {
      one(function(err, element) {
        if (err) return done(err);
        done(null, element[fieldName]);
      });
    },
    add: function(v, done) {
      var change = {};
      change[fieldName] = v;
      coll.updateOne(byId, {$push: change}, done);
    },
    q: function(key, val) {
      if (arguments.length === 1) {
        val = key;
        key = undefined;
      }
      return nestedArrayElementQuery(coll, id, fieldName, key, val);
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
