var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var Jogo = require('../models/jogo');

router.get('/', function (req, res) {
  res.jsonp({ ok: true, msg: 'API jogostabuleiro pronta' });
});

// ---------------------------------------------------------------------
// GET /jogos
//   - sem query  -> lista resumida: _id, name, year, category, minPlayers
//   - ?editora=E -> jogos publicados pela editora E: _id, id, name, year
// ---------------------------------------------------------------------
router.get('/jogos', function (req, res) {
  if (req.query.editora) {
    Jogo.find(
      {
        $or: [
          { 'editoras.id': req.query.editora },
          { 'editoras.name': req.query.editora }
        ]
      },
      { _id: 1, name: 1, year: 1 }
    )
      .then(function (data) { res.jsonp(data); })
      .catch(function (err) { res.status(500).jsonp({ error: err.message }); });
  } else {
    Jogo.find(
      {},
      { _id: 1, name: 1, year: 1, category: 1, minPlayers: 1 }
    )
      .then(function (data) { res.jsonp(data); })
      .catch(function (err) { res.status(500).jsonp({ error: err.message }); });
  }
});

// ---------------------------------------------------------------------
// GET /jogos/:id  -> documento completo (todos os campos)
// ---------------------------------------------------------------------
router.get('/jogos/:id', function (req, res) {
  Jogo.findOne({ $or: [{ id: req.params.id }, { _id: req.params.id }] })
    .then(function (data) {
      if (!data) return res.status(404).jsonp({ error: 'Jogo nao encontrado: ' + req.params.id });
      res.jsonp(data);
    })
    .catch(function (err) { res.status(500).jsonp({ error: err.message }); });
});

// ---------------------------------------------------------------------
// POST /jogos  -> cria um novo jogo
// ---------------------------------------------------------------------
router.post('/jogos', function (req, res) {
  var doc = Object.assign({}, req.body);
  if (!doc._id) doc._id = doc.id || crypto.randomUUID();
  Jogo.create(doc)
    .then(function (data) { res.status(201).jsonp(data); })
    .catch(function (err) { res.status(400).jsonp({ error: err.message }); });
});

// ---------------------------------------------------------------------
// PUT /jogos/:id  -> altera o jogo identificado por id
// ---------------------------------------------------------------------
router.put('/jogos/:id', function (req, res) {
  Jogo.findOneAndUpdate(
    { $or: [{ id: req.params.id }, { _id: req.params.id }] },
    req.body,
    { new: true }
  )
    .then(function (data) {
      if (!data) return res.status(404).jsonp({ error: 'Jogo nao encontrado: ' + req.params.id });
      res.jsonp(data);
    })
    .catch(function (err) { res.status(400).jsonp({ error: err.message }); });
});

// ---------------------------------------------------------------------
// DELETE /jogos/:id
// ---------------------------------------------------------------------
router.delete('/jogos/:id', function (req, res) {
  Jogo.findOneAndDelete({ $or: [{ id: req.params.id }, { _id: req.params.id }] })
    .then(function (data) {
      if (!data) return res.status(404).jsonp({ error: 'Jogo nao encontrado: ' + req.params.id });
      res.jsonp({ ok: true, removed: data });
    })
    .catch(function (err) { res.status(500).jsonp({ error: err.message }); });
});

// ---------------------------------------------------------------------
// GET /autores
// ---------------------------------------------------------------------
router.get('/autores', function (req, res) {
  Jogo.aggregate([
    { $unwind: '$autores' },
    { $group: {
        _id: '$autores.name',
        jogos: { $addToSet: { id: '$id', nome: '$name' } }
    } },
    { $project: { _id: 0, nome: '$_id', jogos: 1 } },
    { $sort: { nome: 1 } }
  ])
    .then(function (data) { res.jsonp(data); })
    .catch(function (err) { res.status(500).jsonp({ error: err.message }); });
});

// ---------------------------------------------------------------------
// GET /categorias
// ---------------------------------------------------------------------
router.get('/categorias', function (req, res) {
  Jogo.aggregate([
    { $group: {
        _id: '$category',
        jogos: { $addToSet: { id: '$id', nome: '$name' } }
    } },
    { $project: { _id: 0, categoria: '$_id', jogos: 1 } },
    { $sort: { categoria: 1 } }
  ])
    .then(function (data) { res.jsonp(data); })
    .catch(function (err) { res.status(500).jsonp({ error: err.message }); });
});

module.exports = router;
