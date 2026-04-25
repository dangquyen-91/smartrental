import express from 'express';
import {
  generateContract,
  signContract,
  getContractById,
  getContractByBooking,
  getMyContracts,
  getAllContracts,
  cancelContract,
} from '../controllers/contract.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { mongoId } from '../validators/common.validator.js';
import { generateContractValidation, getContractsValidation } from '../validators/contract.validator.js';

const router = express.Router();

router.use(protect);

// Landlord: generate a contract from a confirmed booking
router.post('/generate', authorizeRoles('landlord'), generateContractValidation, generateContract);

// Tenant / Landlord: view own contracts
router.get('/my', authorizeRoles('tenant', 'landlord'), getContractsValidation, getMyContracts);

// Admin: view all contracts
router.get('/', authorizeRoles('admin'), getContractsValidation, getAllContracts);

// Any party: get contract by booking ID
router.get('/booking/:bookingId', validate([mongoId('bookingId')]), getContractByBooking);

// Any party: get contract by contract ID
router.get('/:id', validate([mongoId('id')]), getContractById);

// Tenant or Landlord: sign the contract
router.patch('/:id/sign', authorizeRoles('tenant', 'landlord'), validate([mongoId('id')]), signContract);

// Admin: cancel a contract
router.patch('/:id/cancel', authorizeRoles('admin'), validate([mongoId('id')]), cancelContract);

export default router;
