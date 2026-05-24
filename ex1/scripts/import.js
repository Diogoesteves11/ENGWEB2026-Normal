// Script de import do dataset para MongoDB.
//
// Uso (a partir de /ex1):
//   node scripts/import.js dataset/<ficheiro>.json
//
// Lida com duas formas comuns do dataset:
//  1) Objeto { "ed1956": {...}, "ed1957": {...} }   -> usa os valores como docs
//  2) Array  [ {...}, {...} ]                       -> usa diretamente
//
// Se cada documento tiver um campo "id" usa-o como _id para idempotencia
// (re-importar nao gera duplicados).

var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');

// TODO amanha: ajustar DB_NAME e COLLECTION conforme o enunciado.
var DB_NAME = process.env.DB_NAME || 'engweb';
var MONGO_URL = process.env.MONGO_URL || ('mongodb://127.0.0.1:27017/' + DB_NAME);
var COLLECTION = process.env.COLLECTION || 'COLECCAO';

var file = process.argv[2];
if (!file) {
  console.error('Falta o caminho do JSON. Ex: node scripts/import.js dataset/eurovisao.json');
  process.exit(1);
}

var abs = path.resolve(file);
var raw = fs.readFileSync(abs, 'utf8');
var parsed = JSON.parse(raw);

var docs;
if (Array.isArray(parsed)) {
  docs = parsed;
} else if (typeof parsed === 'object' && parsed !== null) {
  docs = Object.values(parsed);
} else {
  console.error('Formato JSON nao reconhecido (esperado objeto ou array).');
  process.exit(1);
}

// Usa o campo "id" como _id quando disponivel
docs = docs.map(function (d) {
  if (d && d.id && !d._id) {
    return Object.assign({ _id: d.id }, d);
  }
  return d;
});

mongoose.connect(MONGO_URL).then(async function () {
  console.log('Ligado a ' + MONGO_URL);
  var col = mongoose.connection.collection(COLLECTION);
  await col.deleteMany({});
  var result = await col.insertMany(docs);
  console.log('Inseridos ' + result.insertedCount + ' documentos em "' + COLLECTION + '"');
  await mongoose.disconnect();
}).catch(function (err) {
  console.error('Erro:', err);
  process.exit(1);
});
