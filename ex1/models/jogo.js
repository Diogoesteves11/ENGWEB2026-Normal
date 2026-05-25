var mongoose = require('mongoose');

var jogoSchema = new mongoose.Schema({
  _id: String,
  id: String,
  name: String,
  year: Number,
  category: String,
  minPlayers: Number,
  maxPlayers: Number,
  playingTimeMinutes: Number,
  descriptionEN: String,
  autores: Array,
  editoras: Array,
  mecanicas: Array,
  premios: Array,
}, { strict: false, collection: 'jogos' });

module.exports = mongoose.model('Jogo', jogoSchema);
