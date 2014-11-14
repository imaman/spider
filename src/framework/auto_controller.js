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



exports.create = function(pluralName, selection, singularName, idParam, isSingle) {
  isSingle = Boolean(isSingle);
  var name = isSingle ? singularName : pluralName;

  function genericGet(jsonFromReq) {
    jsonFromReq = jsonFromReq || function(req, sel, done) {
      sel.get(done);
    }
    return function(req, res) {
      jsonFromReq(req, selection.q(req.params[idParam]), function(err, data, viewName) {
        if (err) return res.sendStatus(500).end();
        data.byController = data.byController || name;
        if (isSingle)
          data.collectionController = data.collectionController || pluralName;
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        if (req.path.match(/\.json$/)) {
          return res.status(200).json(data).end();
        }
        res.render(viewName, data);
      });
    };
  }
  function getHtmlMulti() {
    return genericGet(function(req, sel, done) {
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
  }
  function getHtmlSingle() {
    return genericGet(function(req, sel, done) {
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
  }

  return {
    singular: function() {
      return exports.create(pluralName, selection, singularName, idParam, true);
    },
    getHtml: function() {
      return isSingle ? getHtmlSingle() : getHtmlMulti();
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
      return genericGet(jsonFromReq);
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

exports.defineResource = function(app, qPlural, namePluarl, nameSingular, options) {
  if (!options.post)
    throw new Error('.post must be specified');
  if (!options.put)
    throw new Error('.put must be specified');

  var idParam = 'id';
  var controller = exports.create(namePluarl, qPlural, nameSingular, idParam);
  var singularController = controller.singular();
  app.get('/' + namePluarl + '.json', controller.get());
  app.get('/' + namePluarl + '.html', controller.getHtml());
  app.get('/' + namePluarl + '/:' + idParam + '.json', singularController.get());
  app.get('/' + namePluarl + '/:' + idParam + '.html', singularController.getHtml());
  app.delete('/' + namePluarl + '/:' + idParam, singularController.delete());

  app.post('/' + namePluarl, controller.post(options.post));
  app.put('/' + namePluarl + '/:' + idParam, singularController.put(options.put));
}

