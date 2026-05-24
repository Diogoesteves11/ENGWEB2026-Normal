var mongoose = require('mongoose');

// Schema generico para o dataset do exame.
// TODO amanha:
//  - renomear o ficheiro (e a var 'Recurso') para algo do dominio (Edicao,
//    Livro, Filme, ...);
//  - escolher o nome real da collection.
//
// 'strict: false' deixa importar qualquer shape de JSON sem ter de
// declarar todos os campos a frente.
var recursoSchema = new mongoose.Schema({
  _id: String,
  id: String,
}, { strict: false, collection: 'COLECCAO' });

module.exports = mongoose.model('Recurso', recursoSchema);
