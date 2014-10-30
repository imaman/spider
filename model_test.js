var expect = require('expect.js');
var newModel = require('./model.js').newModel;

describe('model', function() {
  it('is initially empty', function() {
    var model = newModel();
    expect(model.size()).to.be(0);
  });

  it('allows elements to be added', function(done) {
    var model = newModel();
    model.add({text: '_'}, function(err) {
      if (err) return done(err);
      expect(model.size()).to.be(1);
      done();
    });
  });

  describe('querying', function() {
    xit('can find by ID', function() {
      var model = newModel();
      var id = model.add({text: 'SOME_TEXT'});
      var texts = model.q(id).map(function(curr) { return curr.text });
      expect(texts).to.eql(['SOME_TEXT']);
    });
    it('can find by predicate', function(done) {
      var model = newModel();
      model.add({text: 'A1'}, {text: 'B'}, {text: 'A2'}, function(err, a1, b, a2) {
        if (err) return done(err);
        var query = model.q(function(i) { return i.text.indexOf('A') >= 0 });
        var texts = query.map(function(curr) { return curr.text });
        expect(texts).to.contain('A1');
        expect(texts).to.contain('A2');
        expect(texts).not.to.contain('B');
        done();
      });
    });
    it('finds all if the query is falsy', function(done) {
      var model = newModel();
      model.add({text: 'A'}, {text: 'B'}, function(err, a, b) {
        if(err) return done(err);
        var query = model.q(null);
        var texts = query.map(function(curr) { return curr.text });
        expect(texts).to.contain('A');
        expect(texts).to.contain('B');
        expect(texts).to.have.length(2);
        done();
      });
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
    it('is lazily evaluated', function(done) {
      var model = newModel();
      var q = model.q(function(e) { return e.text == 'A' });
      expect(q.size()).to.equal(0);

      model.add({text: 'A'}, function(err) {
        if (err) return done(err);
        expect(q.size()).to.equal(1);

        model.add({text: 'A'}, function(err) {
          if (err) return done(err);
          expect(q.size()).to.equal(2);

          model.q().remove(function(err) {
            if (err) return done(err);
            expect(q.size()).to.equal(0);
            done();
          });
        });
      });
    });
  });

  describe('at', function() {
    it('finds an item by its ID', function(done) {
      var model = newModel();
      model.add({text: 'SOME_TEXT'}, function(err, id) {
        if(err) return done(err);
        model.at(id, function(err, item) {
          expect(item).to.have.property('text').equal('SOME_TEXT');
          expect(item).to.have.property('id').equal(id);
          done();
        });
      });
    });
    it('returns null when if the ID was not found', function(done) {
      var model = newModel();
      expectAt(model, 'some_id', null, done);
    });
  });


  it('can delete an item by ID', function(done) {
    var model = newModel();
    model.add({text: 'SOME_TEXT'}, function(err, id) {
      if (err) return done(err);
      model.q(id).remove(function(err) {
        if (err) return done(err);
        expectAt(model, id, null, done);
      });
    });
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
      model.add({text: 'A'}, function(err, a) {
        if (err) return done(err);
        model.q(function(curr) { return curr.text == 'A' }).remove(function(err) {
          if (err) return done(err);
          expectAt(model, a, null, done);
        });
      });
    });
    it('deletes only the item that matches the predicate', function(done) {
      var model = newModel();
      model.add({text: 'A'}, {text: 'B'}, function(err, a, b) {
        if (err) return done(err);
        model.q(function(curr) { return curr.text == 'A' }).remove(function(err) {
          if (err) return done(err);
          expectAt(model, a, null, function() {
            model.at(b, function(err, value) {
              expect(value).to.have.property('text').equal('B');
              done();
            });
          });
        });
      });
    });
    it('deletes all items that match the predicate', function(done) {
      var model = newModel();
      model.add({text: 'A'}, {text: 'B'}, {text: 'A'}, function(err, a1, b, a2) {
        if (err) return done(err);
        model.q(function(curr) { return curr.text == 'A' }).remove(function(err) {
          if (err) return done(err);
          expectAt(model, a1, null, function() {
            model.at(b, function(err, value) {
              expect(value).not.to.be(null);
              expectAt(model, a2, null, done);
            });
          });
        });
      });
    });
  });
});
