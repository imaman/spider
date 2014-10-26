

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

  var result = {
    add: function(obj) { obj.id = nextId(); data[obj.id] = obj; },
    removeAll: function(pred) {
      all().filter(function(curr) { return pred(curr); }).forEach(function(curr) {
        delete data[curr.id];
      });
    },
    forEach: function(f) { all().forEach(f); },
    lookup: function(id) {
      return data[id];
    },
    remove: function(id) {
      delete data[id];
    },
    findAll: function(pred) {
      return all().filter(pred || function() { return true; });
    },
    size: function() { return all().length; }
  };

  result.add({text: 'Create a TodoMVC template', completed: true });
  result.add({text: 'Rule the web', completed: false });

  return result;
};


