

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
    return {
      forEach: function(act) { all().filter(pred).forEach(act) },
      remove: function() { this.forEach(function(curr) { delete data[curr.id] }) }
    };
  }

  return {
    add: function(obj) { obj.id = nextId(); data[obj.id] = obj; return obj.id; },
    removeAll: function(pred) { selectAll(pred).remove(); },
    forEach: function(f) { all().forEach(f); },
    lookup: function(id) {
      return select(id).get();
    },
    remove: function(id) {
      select(id).remove();
    },
    findAll: function(pred) {
      return all().filter(pred || function() { return true; });
    },
    size: function() { return all().length; }
  };
};


