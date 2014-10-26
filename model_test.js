var expect = require('expect.js');
var newModel = require('./model.js').newModel;

describe('model', function() {
  it('is initially empty', function() {
    var model = newModel();
    expect(model.size()).to.be(0);
  });

  it('allows elements to be added', function() {
    var model = newModel();
    model.add({text: '_'});
    expect(model.size()).to.be(1);
  });

  describe('querying', function() {
    it('can find by ID', function() {
      var model = newModel();
      var id = model.add({text: 'SOME_TEXT'});
      var texts = model.q(id).map(function(curr) { return curr.text });
      expect(texts).to.eql(['SOME_TEXT']);
    });
    it('can find by predicate', function() {
      var model = newModel();
      var a1 = model.add({text: 'A1'});
      var b = model.add({text: 'B'});
      var a2 = model.add({text: 'A2'});
      var query = model.q(function(i) { return i.text.indexOf('A') >= 0 });
      var texts = query.map(function(curr) { return curr.text });
      expect(texts).to.contain('A1');
      expect(texts).to.contain('A2');
      expect(texts).not.to.contain('B');
    });
    it('finds all if the query is flasy', function() {
      var model = newModel();
      var a = model.add({text: 'A'});
      var b = model.add({text: 'B'});
      var query = model.q(null);
      var texts = query.map(function(curr) { return curr.text });
      expect(texts).to.contain('A');
      expect(texts).to.contain('B');
      expect(texts).to.have.length(2);
    });

  });

  describe('lookup', function() {
    it('finds an item by its ID', function() {
      var model = newModel();
      var id = model.add({text: 'SOME_TEXT'});
      var item = model.lookup(id).get();

      expect(item).to.have.property('text').equal('SOME_TEXT');
      expect(item).to.have.property('id').equal(id);
    });
    it('returns null when if the ID was not found', function() {
      var model = newModel();
      expect(model.lookup('some_id').get()).to.be(null);
    });
    it('allows forEach on the ID lookup', function() {
      var model = newModel();
      var id = model.add({text: 'SOME_TEXT'});
      var acc = '';
      model.lookup(id).forEach(function(curr) { acc += curr.text });

      expect(acc).to.equal('SOME_TEXT');
    });
    it('allows map on the ID lookup', function() {
      var model = newModel();
      var id = model.add({text: 'SOME_TEXT'});
      var len = model.lookup(id).map(function(curr) { return curr.text.length  });

      expect(len).to.eql([9]);
    });
    it('returns all elements if no ID is specified', function() {
      var model = newModel();
      model.add({text: 'A'});
      model.add({text: 'B'});
      expect(model.lookup().map(function(curr) { return curr.text })).to.contain('A');
      expect(model.lookup().map(function(curr) { return curr.text })).to.contain('B');
    });
  });


  it('can delete an item by ID', function() {
    var model = newModel();
    var id = model.add({text: 'SOME_TEXT'});
    model.q(id).remove();
    expect(model.lookup(id).get()).to.be(null);
  });

  describe('forEach', function() {
    it('provides access to all elements', function() {
      var model = newModel();
      var a = model.add({text: 'A'});
      var b = model.add({text: 'B'});
      model.forEach(function(curr) {
        curr.text = curr.text + curr.text;
      });

      expect(model.lookup(a).get().text).to.equal('AA');
      expect(model.lookup(b).get().text).to.equal('BB');
    });
  });

  describe('remove multiple items', function() {
    it('deletes the item that matches the predicate', function() {
      var model = newModel();
      var a = model.add({text: 'A'});
      model.q(function(curr) { return curr.text == 'A' }).remove();
      expect(model.lookup(a).get()).to.be(null);
    });
    it('deletes only the item that matches the predicate', function() {
      var model = newModel();
      var a = model.add({text: 'A'});
      var b = model.add({text: 'B'});
      model.q(function(curr) { return curr.text == 'A' }).remove();
      expect(model.lookup(a).get()).to.be(null);
      expect(model.lookup(b).get()).to.have.property('text').equal('B');
    });
    it('deletes all items that match the predicate', function() {
      var model = newModel();
      var a1 = model.add({text: 'A'});
      var b = model.add({text: 'B'});
      var a2 = model.add({text: 'A'});
      model.q(function(curr) { return curr.text == 'A' }).remove();
      expect(model.lookup(a1).get()).to.be(null);
      expect(model.lookup(b).get()).not.to.be(null);
      expect(model.lookup(a2).get()).to.be(null);
    });
  });
  describe('findAll', function() {
    it('finds an item that matches the predicate', function() {
      var model = newModel();
      var a = model.add({text: 'A'});
      var all = model.findAll(function(curr) { return curr.text == 'A' });

      expect(all.map(function(curr) { return curr.id })).to.eql([ a ]);
    });
    it('finds all the items that match the predicate', function() {
      var model = newModel();
      var a1 = model.add({text: 'A'});
      var a2 = model.add({text: 'A'});
      var all = model.findAll(function(curr) { return curr.text == 'A' });
      expect(all.map(function(curr) { return curr.id })).to.contain(a1);
      expect(all.map(function(curr) { return curr.id })).to.contain(a2);
    });
    it('finds only the items that match the predicate', function() {
      var model = newModel();
      var a1 = model.add({text: 'A'});
      var b = model.add({text: 'B'});
      var a2 = model.add({text: 'A'});
      var all = model.findAll(function(curr) { return curr.text == 'A' });
      var ids = all.map(function(curr) { return curr.id });
      expect(ids).to.contain(a1);
      expect(ids).to.contain(a2);
      expect(ids).not.to.contain(b);
    });
    it('finds all elements if no predicate is given', function() {
      var model = newModel();
      var a1 = model.add({text: 'A'});
      var b = model.add({text: 'B'});
      var a2 = model.add({text: 'A'});
      var all = model.findAll();
      var ids = all.map(function(curr) { return curr.id });
      expect(ids).to.contain(a1);
      expect(ids).to.contain(a2);
      expect(ids).to.contain(b);
    });
  });
});
