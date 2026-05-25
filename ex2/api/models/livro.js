var mongoose = require('mongoose');

var livroSchema = new mongoose.Schema({
  titulo:  { type: String,  required: true, trim: true },
  autor:   { type: String,  required: true, trim: true },
  paginas: { type: Number,  required: true, min: 1 },
  genero:  { type: String,  required: true, trim: true },
  lido:    { type: Boolean, default: false },
}, { collection: 'livros' });

module.exports = mongoose.model('Livro', livroSchema);
