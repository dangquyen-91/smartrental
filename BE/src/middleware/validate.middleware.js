const { validationResult } = require('express-validator');
const { badRequest } = require('../utils/response');

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

module.exports = validate;
