var express = require('express');
var router = express.Router();
var Livro = require('../models/livro');

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------
// GET /api/livros            -> lista todos
// GET /api/livros?search=X   -> filtra por titulo OU autor (case-insensitive)
// ---------------------------------------------------------------------
router.get('/', async function (req, res) {
  try {
    var filtro = {};
    if (req.query.search) {
      var q = new RegExp(escapeRegex(req.query.search), 'i');
      filtro = { $or: [{ titulo: q }, { autor: q }] };
    }
    var livros = await Livro.find(filtro);
    res.jsonp(livros);
  } catch (err) {
    res.status(500).jsonp({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// POST /api/livros  -> cria um novo livro
// ---------------------------------------------------------------------
router.post('/', async function (req, res) {
  try {
    var livro = await Livro.create(req.body);
    res.status(201).jsonp(livro);
  } catch (err) {
    res.status(400).jsonp({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// PUT /api/livros/:id  -> actualiza (toggle do campo "lido", mas aceita
// qualquer subset dos campos do schema).
// ---------------------------------------------------------------------
router.put('/:id', async function (req, res) {
  try {
    var livro = await Livro.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!livro) return res.status(404).jsonp({ error: 'Livro nao encontrado: ' + req.params.id });
    res.jsonp(livro);
  } catch (err) {
    res.status(400).jsonp({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// DELETE /api/livros/:id
// ---------------------------------------------------------------------
router.delete('/:id', async function (req, res) {
  try {
    var livro = await Livro.findByIdAndDelete(req.params.id);
    if (!livro) return res.status(404).jsonp({ error: 'Livro nao encontrado: ' + req.params.id });
    res.jsonp({ ok: true, removed: livro });
  } catch (err) {
    res.status(500).jsonp({ error: err.message });
  }
});

module.exports = router;
