import { validationResult } from 'express-validator';
import { badRequest } from '../utils/response.js';

const validate = (schemas) => [
  ...schemas,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Validation failed', errors.array().map((e) => e.msg));
    }
    next();
  },
];

export default validate;
