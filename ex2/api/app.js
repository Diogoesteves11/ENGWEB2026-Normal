var express = require('express');
var fs = require('fs');
var path = require('path');
var logger = require('morgan');
var mongoose = require('mongoose');
var cors = require('cors');

var livrosRouter = require('./routes/livros');
var Livro = require('./models/livro');

var DB_NAME = process.env.DB_NAME || 'biblioteca';
var MONGO_URL = process.env.MONGO_URL || ('mongodb://127.0.0.1:27017/' + DB_NAME);

mongoose.connect(MONGO_URL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro de conexao ao MongoDB...'));
db.once('open', async function () {
  console.log('Conexao ao MongoDB realizada com sucesso: ' + MONGO_URL);
  await seedIfEmpty();
});


async function seedIfEmpty() {
  try {
    var count = await Livro.countDocuments();
    if (count > 0) {
      console.log('[seed] Coleccao livros ja tem ' + count + ' registos, skip.');
      return;
    }
    var raw = fs.readFileSync(path.join(__dirname, 'dataset', 'livros.json'), 'utf8');
    var seed = JSON.parse(raw);
    var inserted = await Livro.insertMany(seed);
    console.log('[seed] Inseridos ' + inserted.length + ' livros iniciais.');
  } catch (err) {
    console.error('[seed] Falhou:', err.message);
  }
}

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/livros', livrosRouter);

app.get('/', function (req, res) {
  res.jsonp({ ok: true, msg: 'API biblioteca pronta' });
});

app.use(function (req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
