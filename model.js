var util = require('util');

exports.newModel = function() {
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
      forEach: function(act, done) { asArr().forEach(act); done() },
      remove: function(done) { delete data[id]; done(); },
      one: function() { return data[id] || null }
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
    at: function(id, done) { done(null, this.q(id).one()) },
    size: function(done) { return this.q().size(done) },
    toString: function() { return JSON.stringify(data, null, 2); }
  };
};


