function entityDelete(q, res) {
  q.remove(function (err) {
    res.sendStatus(err ? 500 : 204).end();
  });
}

function newDeleteController(selection, idParam) {
  if (!idParam) {
    return function(req, res) {
      entityDelete(selection, res);
    };
  }

  return function(req, res) {
    entityDelete(selection.q(req.params[idParam]), res);
  };
}

exports.create = function(name, selection, idParam, collectionController) {
  return {
    getHtmlMulti: function() {
      return this.get(function(req, sel, done) {
        sel.get(function(err, value) {
          if (err) return done(err);
          var keys = {};
          value.forEach(function(curr) {
            Object.keys(curr).forEach(function(key) {
              keys[key] = true;
            });
          });
          keys = Object.keys(keys);
          keys.sort();
          var acc = [];
          value.forEach(function(curr) {
            var rec = keys.map(function(k) {
              return {key: k, value: curr[k]};
            });
            acc.push({id: curr._id, values: rec});
          });
          done(null, { tableHeader: keys, tableBody: acc }, 'table');
        });
      });
    },
    getHtmlSingle: function() {
      return this.get(function(req, sel, done) {
        sel.get(function(err, value) {
          var type = { _id: 'fixed', completed: 'bool' }
          if (err) return done(err);
          var keys = Object.keys(value);
          keys.sort();
          pairs = keys.map(function(k) {
            return {key: k, value: value[k], type: type[k]};
          });
          done(null, {id: value._id, payload: pairs}, 'element');
        });
      });
    },
    post: function(jsonFromReq) {
      return function(req, res) {
        selection.add(jsonFromReq(req), function(err, id) {
          if (err) return res.sendStatus(500).end();
          res.status(201).send({id: id.toString()}).end();
        });
      };
    },
    delete: function() { return newDeleteController(selection, idParam) },
    get: function(jsonFromReq) {
      jsonFromReq = jsonFromReq || function(req, sel, done) {
        sel.get(done);
      }
      return function(req, res) {
        jsonFromReq(req, selection.q(req.params[idParam]), function(err, data, viewName) {
          if (err) return res.sendStatus(500).end();
          data.byController = data.byController || name;
          data.collectionController = data.collectionController || collectionController;
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          if (req.path.match(/\.json$/)) {
            return res.status(200).json(data).end();
          }
          res.render(viewName, data);
        });
      };
    },
    put: function(mutationFromReq) {
      return function(req, res) {
        mutationFromReq(req, selection.q(req.params[idParam]), function(err) {
          res.sendStatus(err ? 500 : 204).end();
        });
      };
    }
  }
}

