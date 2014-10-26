

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
    return {
      get: function() { return data[id] || null },
      remove: function() { data[id] = null }
    };
  }

  function selectAll(pred) {
    pred = pred || function() { return true };
    return {
      forEach: function(act) { this.get().forEach(act) },
      remove: function() { this.forEach(function(curr) { delete data[curr.id] }) },
      get: function() { return all().filter(pred) }
    };
  }

  return {
    add: function(obj) { obj.id = nextId(); data[obj.id] = obj; return obj.id; },
    removeAll: function(pred) { selectAll(pred).remove(); },
    forEach: function(f) { selectAll().forEach(f); },
    lookup: function(id) { return select(id).get(); },
    remove: function(id) { select(id).remove(); },
    findAll: function(pred) { return selectAll(pred).get(); },
    size: function() { return selectAll().get().length; }
  };
};


