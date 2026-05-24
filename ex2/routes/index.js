var express = require('express');
var axios = require('axios');
var router = express.Router();

var API_URL = process.env.API_URL || 'http://localhost:25000';

// Helper para falhas da API
function apiError(res, err) {
  console.error('Erro a chamar a API:', err.message);
  res.status(500).render('error', {
    message: 'Erro a falar com a API',
    error: { status: 500, stack: err.message },
  });
}

// =====================================================================
// PAGINA PRINCIPAL  -  GET /
// Tabela com todos os registos.
// TODO amanha: confirmar o nome da rota da API (e.g. /edicoes, /livros, ...)
// =====================================================================
router.get('/', async function (req, res) {
  try {
    var r = await axios.get(API_URL + '/RECURSO'); // TODO: trocar /RECURSO
    res.render('index', { title: 'EngWeb 2026', lista: r.data });
  } catch (err) {
    apiError(res, err);
  }
});

// =====================================================================
// PAGINA DE CATEGORIA  -  GET /<categoria>/:valor
// (definida ANTES de /:id para nao colidir)
// TODO amanha: ajustar o nome (paises, autores, generos, ...) e a logica.
// =====================================================================
router.get('/CATEGORIA/:valor', async function (req, res) {
  try {
    // Estrategia geral: buscar todos os itens da API e filtrar/agrupar localmente.
    var r = await axios.get(API_URL + '/RECURSO'); // TODO
    var listaA = []; // TODO: preencher conforme o enunciado
    var listaB = []; // TODO: preencher conforme o enunciado (se aplicavel)

    res.render('categoria', {
      title: req.params.valor,
      titulo: req.params.valor,
      tituloA: 'Lista A',
      listaA: listaA,
      tituloB: 'Lista B',
      listaB: listaB,
    });
  } catch (err) {
    apiError(res, err);
  }
});

// =====================================================================
// PAGINA DE DETALHE  -  GET /:id
// =====================================================================
router.get('/:id', async function (req, res) {
  try {
    var r = await axios.get(API_URL + '/RECURSO/' + req.params.id); // TODO
    res.render('item', { title: req.params.id, item: r.data });
  } catch (err) {
    apiError(res, err);
  }
});

module.exports = router;
