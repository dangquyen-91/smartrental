const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const swaggerSpec = yaml.load(
  fs.readFileSync(path.join(__dirname, '../../swagger.yaml'), 'utf8')
);

console.log('Swagger document loaded successfully');

module.exports = swaggerSpec;
