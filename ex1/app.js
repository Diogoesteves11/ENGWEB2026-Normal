var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var cors = require('cors');


var DB_NAME = process.env.DB_NAME || 'jogostabuleiro';
var MONGO_URL = process.env.MONGO_URL || ('mongodb://127.0.0.1:27017/' + DB_NAME);

mongoose.connect(MONGO_URL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro de conexao ao MongoDB...'));
db.once('open', () => {
  console.log('Conexao ao MongoDB realizada com sucesso: ' + MONGO_URL);
});

var indexRouter = require('./routes/index');
var swagger = require('./swagger');

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api-docs', swagger.swaggerUi.serve, swagger.swaggerUi.setup(swagger.swaggerSpec));

app.use('/', indexRouter);

app.use(function (req, res, next) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
