

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

  function select(id) {
    function asArr() {
      var temp = data[id] || null;
      return (temp ? [temp] : []);
    }

    return {
      forEach: function(act) { asArr().forEach(act) },
      map: function(f) { return asArr().map(f) },
      get: function() { return data[id] || null },
      remove: function() { delete data[id] }
    };
  }

  function selectAll(pred) {
    pred = pred || function() { return true };
    return {
      forEach: function(act) { this.get().forEach(act) },
      map: function(f) { return this.get().map(f) },
      remove: function() { this.forEach(function(curr) { delete data[curr.id] }) },
      get: function() { return all().filter(pred) }
    };
  }

  return {
    add: function(obj) { obj.id = nextId(); data[obj.id] = obj; return obj.id; },
    removeAll: function(pred) { selectAll(pred).remove(); },
    forEach: function(f) { selectAll().forEach(f); },
    lookup: function(id) { return id === undefined ? selectAll() : select(id); },
    remove: function(id) { select(id).remove(); },
    findAll: function(pred) { return selectAll(pred).get(); },
    size: function() { return selectAll().get().length; },
    toString: function() { return JSON.stringify(data, null, 2); }
  };
};


