

exports.newModel = function() {
  var ordinal = 0;
  function nextId() {
    var res = ordinal;
    ++ordinal;
    return res;
  }

  var arr = [
    { id: nextId(), text: 'Create a TodoMVC template', completed: true },
    { id: nextId(), text: 'Rule the web', completed: false },
  ];

  return {
    add: function(obj) { obj.id = nextId(); arr.push(obj); },
    removeAll: function(pred) {
      arr = arr.filter(function(curr) { return !pred(curr); });
    },
    forEach: function(f) { arr.forEach(f); },
    lookup: function(id) {
      var res = arr.filter(function(curr) { return curr.id == id });
      if (res.length != 1)
        throw new Error('Lookup of ID ' + id + ' has failed');
      return res[0];
    },
    remove: function(id) {
      var positions = arr.map(function(curr, pos) {
        return curr.id == id ? pos : -1
      });
      positions = positions.filter(function(pos) { return pos >= 0; });
      if (positions.length != 1)
        throw new Error('Lookup of ID ' + id + ' has failed');

      arr.splice(positions[0], 1);
    },
    findAll: function(pred) {
      return arr.filter(pred || function() { return true; });
    },
    size: function() { return arr.length; }
  };
};


