import { param } from 'express-validator';

const mongoId = (field) =>
  param(field).isMongoId().withMessage(`${field} must be a valid ID`);

export { mongoId };
