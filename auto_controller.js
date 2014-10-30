function entityDelete(q, res) {
  q.remove(function (err) {
    res.sendStatus(err ? 500 : 200).end();
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

exports.create = function(name, selection, idParam) {
  return {
    post: function(jsonFromReq) {
      return function(req, res) {
        selection.add(jsonFromReq(req), function(err) {
          res.sendStatus(err ? 500 : 200).end();
        });
      };
    },
    delete: function() { return newDeleteController(selection, idParam) },
    get: function(jsonFromReq) {
      return function(req, res) {
        var data = jsonFromReq(req, selection.q(req.params[idParam]));
        data.byController = data.byController || name;
        res.render('index', data);
      };
    },
    put: function() {
      return function(req, res) {
        var newState = (req.param('completed') === 'true');
        selection.q(req.params[idParam]).forEach(function(curr) {
          curr.completed = newState;
        });
        res.sendStatus(200).end();
      };
    }
  }
}

