var express = require('express');
var router = express.Router();
var Recurso = require('../models/recurso'); // TODO amanha: renomear

// Ping
router.get('/', function (req, res) {
  res.jsonp({ ok: true, msg: 'API EngWeb pronta' });
});

// =====================================================================
// CRUD generico  -  trocar "/recursos" pelo nome pedido (e.g. /edicoes).
// O model usa { strict: false }, por isso aceita qualquer shape de
// documento que importes.
// =====================================================================

// GET /recursos                  -> lista completa
// GET /recursos?campo=valor      -> filtro simples por query-string
router.get('/recursos', function (req, res) {
  var filtro = {};
  // TODO amanha: mapear query-strings (ex.: ?org=X) para campos do dataset
  // if (req.query.CAMPO) filtro.CAMPO = req.query.CAMPO;

  Recurso.find(filtro)
    .then(function (data) { res.jsonp(data); })
    .catch(function (err) { res.status(500).jsonp({ error: err.message }); });
});

// GET /recursos/:id
router.get('/recursos/:id', function (req, res) {
  Recurso.findOne({ id: req.params.id })
    .then(function (data) {
      if (!data) return res.status(404).jsonp({ error: 'Nao encontrado' });
      res.jsonp(data);
    })
    .catch(function (err) { res.status(500).jsonp({ error: err.message }); });
});

// POST /recursos
router.post('/recursos', function (req, res) {
  Recurso.create(req.body)
    .then(function (data) { res.status(201).jsonp(data); })
    .catch(function (err) { res.status(400).jsonp({ error: err.message }); });
});

// PUT /recursos/:id
router.put('/recursos/:id', function (req, res) {
  Recurso.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })
    .then(function (data) {
      if (!data) return res.status(404).jsonp({ error: 'Nao encontrado' });
      res.jsonp(data);
    })
    .catch(function (err) { res.status(400).jsonp({ error: err.message }); });
});

// DELETE /recursos/:id
router.delete('/recursos/:id', function (req, res) {
  Recurso.findOneAndDelete({ id: req.params.id })
    .then(function (data) {
      if (!data) return res.status(404).jsonp({ error: 'Nao encontrado' });
      res.jsonp({ ok: true, removed: data });
    })
    .catch(function (err) { res.status(500).jsonp({ error: err.message }); });
});

// =====================================================================
// Padroes de agregacao que costumam aparecer (apagar/adaptar amanha).
// =====================================================================

// distinct ordenado (e.g. lista de autores/interpretes/...)
// router.get('/distintos', async function (req, res) {
//   try {
//     var pipeline = [
//       { $unwind: '$SUB_ARRAY' },
//       { $group: { _id: { nome: '$SUB_ARRAY.NOME', extra: '$SUB_ARRAY.EXTRA' } } },
//       { $project: { _id: 0, nome: '$_id.nome', extra: '$_id.extra' } },
//       { $sort: { nome: 1 } },
//     ];
//     res.jsonp(await Recurso.aggregate(pipeline));
//   } catch (err) { res.status(500).jsonp({ error: err.message }); }
// });

// group-by com lista (e.g. /paises?papel=org -> pais + [anos])
// router.get('/agrupado', async function (req, res) {
//   try {
//     var pipeline = [
//       { $match: { CAMPO_CHAVE: { $exists: true } } },
//       { $group: { _id: '$CAMPO_CHAVE', valores: { $addToSet: '$CAMPO_ANO' } } },
//       { $project: { _id: 0, chave: '$_id', valores: 1 } },
//       { $sort: { chave: 1 } },
//     ];
//     res.jsonp(await Recurso.aggregate(pipeline));
//   } catch (err) { res.status(500).jsonp({ error: err.message }); }
// });

module.exports = router;
