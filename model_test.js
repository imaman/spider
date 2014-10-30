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
    xit('can find by ID', function() {
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
    it('finds all if the query is falsy', function() {
      var model = newModel();
      var a = model.add({text: 'A'});
      var b = model.add({text: 'B'});
      var query = model.q(null);
      var texts = query.map(function(curr) { return curr.text });
      expect(texts).to.contain('A');
      expect(texts).to.contain('B');
      expect(texts).to.have.length(2);
    });
    xit('reports result set size', function() {
      var model = newModel();
      expect(model.q('non_existing_id').size()).to.equal(0);
      var id = model.add({text: 'A'});
      expect(id).not.to.be(null);
      model.add({text: 'B'});
      model.add({text: 'A'});
      expect(model.q().size()).to.equal(3);
      expect(model.q(function(e) { return e.text == 'A' }).size()).to.equal(2);
      expect(model.q(id).size()).to.equal(1);
    });
    it('is lazily evaluated', function() {
      var model = newModel();
      var q = model.q(function(e) { return e.text == 'A' });
      expect(q.size()).to.equal(0);

      model.add({text: 'A'});
      expect(q.size()).to.equal(1);

      model.add({text: 'A'});
      expect(q.size()).to.equal(2);

      model.q().remove();
      expect(q.size()).to.equal(0);
    });
  });

  describe('at', function() {
    it('finds an item by its ID', function(done) {
      var model = newModel();
      var id = model.add({text: 'SOME_TEXT'});
      model.at(id, function(err, item) {
        expect(item).to.have.property('text').equal('SOME_TEXT');
        expect(item).to.have.property('id').equal(id);
        done();
      });
    });
    it('returns null when if the ID was not found', function(done) {
      var model = newModel();
      expectAt(model, 'some_id', null, done);
    });
  });


  it('can delete an item by ID', function(done) {
    var model = newModel();
    var id = model.add({text: 'SOME_TEXT'});
    model.q(id).remove();
    expectAt(model, id, null, done);
  });

  function expectAt(model, id, expected, done) {
    model.at(id, function(err, value) {
      expect(err).to.be(null);
      expect(value).to.equal(expected);
      done();
    });
  }

  describe('remove multiple items', function() {
    it('deletes the item that matches the predicate', function(done) {
      var model = newModel();
      var a = model.add({text: 'A'});
      model.q(function(curr) { return curr.text == 'A' }).remove();
      expectAt(model, a, null, done);
    });
    it('deletes only the item that matches the predicate', function(done) {
      var model = newModel();
      var a = model.add({text: 'A'});
      var b = model.add({text: 'B'});
      model.q(function(curr) { return curr.text == 'A' }).remove();
      expectAt(model, a, null, function() {
        model.at(b, function(err, value) {
          expect(value).to.have.property('text').equal('B');
          done();
        });
      });
    });
    it('deletes all items that match the predicate', function(done) {
      var model = newModel();
      var a1 = model.add({text: 'A'});
      var b = model.add({text: 'B'});
      var a2 = model.add({text: 'A'});
      model.q(function(curr) { return curr.text == 'A' }).remove();
      expectAt(model, a1, null, function() {
        model.at(b, function(err, value) {
          expect(value).not.to.be(null);
          expectAt(model, a2, null, done);
       });
      });
    });
  });
});
