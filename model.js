

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
      forEach: function(act) { asArr().forEach(act) },
      map: function(f) { return asArr().map(f) },
      get: function() { return asArr() },
      remove: function() { delete data[id] },
      size: function() { return asArr().length },
      one: function() { return data[id] || null }
    };
  }

  function selectAll(pred) {
    pred = pred || function() { return true };
    return {
      q: function(arg) { return arg ? pick(arg) : this },
      forEach: function(act) { this.get().forEach(act) },
      map: function(f) { return this.get().map(f) },
      remove: function() { this.forEach(function(curr) { delete data[curr.id] }) },
      get: function() { return all().filter(pred) },
      size: function() { return this.get().length },
    };
  }

  return {
    q: pick,
    add: function(obj) { obj.id = nextId(); data[obj.id] = obj; return obj.id; },
    at: function(id, done) { done(null, this.q(id).one()) },
    size: function() { return this.q().size() },
    toString: function() { return JSON.stringify(data, null, 2); }
  };
};


