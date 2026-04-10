const { param } = require('express-validator');

const mongoId = (field) =>
  param(field).isMongoId().withMessage(`${field} must be a valid ID`);

module.exports = { mongoId };
