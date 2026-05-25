var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var swaggerUi = require('swagger-ui-express');

var swaggerSpec = yaml.load(
  fs.readFileSync(path.join(__dirname, 'swagger.yml'), 'utf8')
);

module.exports = { swaggerUi: swaggerUi, swaggerSpec: swaggerSpec };
