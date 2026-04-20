import * as contractService from '../services/contract.service.js';
import * as R from '../utils/response.js';

const generateContract = async (req, res, next) => {
  try {
    const contract = await contractService.generateContract(
      req.body.bookingId,
      req.user.id,
      req.body.terms
    );
    return R.created(res, { contract }, 'Contract generated successfully');
  } catch (err) {
    next(err);
  }
};

const signContract = async (req, res, next) => {
  try {
    const contract = await contractService.signContract(req.params.id, req.user.id);
    return R.success(res, { contract }, 'Contract signed successfully');
  } catch (err) {
    next(err);
  }
};

const getContractById = async (req, res, next) => {
  try {
    const contract = await contractService.getContractById(req.params.id, req.user.id, req.user.role);
    return R.success(res, { contract });
  } catch (err) {
    next(err);
  }
};

const getContractByBooking = async (req, res, next) => {
  try {
    const contract = await contractService.getContractByBooking(
      req.params.bookingId,
      req.user.id,
      req.user.role
    );
    return R.success(res, { contract });
  } catch (err) {
    next(err);
  }
};

const getMyContracts = async (req, res, next) => {
  try {
    const { contracts, pagination } = await contractService.getMyContracts(
      req.user.id,
      req.user.role,
      req.query
    );
    return R.paginated(res, contracts, pagination);
  } catch (err) {
    next(err);
  }
};

const getAllContracts = async (req, res, next) => {
  try {
    const { contracts, pagination } = await contractService.getAllContracts(req.query);
    return R.paginated(res, contracts, pagination);
  } catch (err) {
    next(err);
  }
};

const cancelContract = async (req, res, next) => {
  try {
    const contract = await contractService.cancelContract(req.params.id);
    return R.success(res, { contract }, 'Contract cancelled');
  } catch (err) {
    next(err);
  }
};

export {
  generateContract,
  signContract,
  getContractById,
  getContractByBooking,
  getMyContracts,
  getAllContracts,
  cancelContract,
};
