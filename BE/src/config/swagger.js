import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swaggerSpec = yaml.load(
  readFileSync(join(__dirname, '../../swagger.yaml'), 'utf8')
);

console.log('Swagger document loaded successfully');

export default swaggerSpec;
