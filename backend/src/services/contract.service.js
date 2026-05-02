import mongoose from 'mongoose';
import Contract from '../models/contract.model.js';
import Booking from '../models/booking.model.js';
import AppError from '../utils/app-error.js';
import { generateAndUploadContractPdf } from '../utils/pdf-generator.js';
import { assertContractAllowed } from './subscription.service.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildPagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const populateContract = (query) =>
  query
    .populate('booking', 'startDate endDate duration totalPrice status note')
    .populate('tenant', 'name email phone address avatar')
    .populate('landlord', 'name email phone address avatar')
    .populate('property', 'title type address area bedrooms bathrooms price images');

// ─── Generate Contract ───────────────────────────────────────────────────────

const generateContract = async (bookingId, landlordId, terms) => {
  const booking = await Booking.findById(bookingId)
    .populate('tenant', 'name email phone address')
    .populate('landlord', 'name email phone address')
    .populate('property', 'title type address area bedrooms bathrooms price');

  if (!booking) throw new AppError('Booking not found', 404);

  if (booking.landlord._id.toString() !== landlordId) {
    throw new AppError('Access denied', 403);
  }

  await assertContractAllowed(landlordId);

  if (!['confirmed', 'active'].includes(booking.status)) {
    throw new AppError(
      `Hợp đồng chỉ có thể tạo cho booking đã xác nhận hoặc đang thuê. Trạng thái hiện tại: "${booking.status}"`,
      400
    );
  }

  // Use insertOne inside a try/catch — the unique index on `booking` makes
  // concurrent duplicate calls fail with E11000 rather than creating two contracts.
  let contract;
  try {
    [contract] = await Contract.create(
      [{
        booking: booking._id,
        tenant: booking.tenant._id,
        landlord: booking.landlord._id,
        property: booking.property._id,
        terms: terms || null,
        status: 'awaiting_signatures',
        signedByTenant: { signed: false, signedAt: null },
        signedByLandlord: { signed: false, signedAt: null },
      }],
    );
  } catch (err) {
    if (err.code === 11000) throw new AppError('Contract already exists for this booking', 409);
    throw err;
  }

  // Generate and upload initial PDF
  const pdfUrl = await generateAndUploadContractPdf({
    contractId: contract._id.toString(),
    booking,
    tenant: booking.tenant,
    landlord: booking.landlord,
    property: booking.property,
    terms: terms || null,
    signedByTenant: contract.signedByTenant,
    signedByLandlord: contract.signedByLandlord,
  });

  contract.pdfUrl = pdfUrl;
  await contract.save();

  return populateContract(Contract.findById(contract._id)).lean({ virtuals: false }).then((c) => c);
};

// ─── Sign Contract ───────────────────────────────────────────────────────────

const signContract = async (contractId, userId) => {
  // Resolve which party this user is before any write
  const existing = await Contract.findById(contractId).lean();
  if (!existing) throw new AppError('Contract not found', 404);
  if (existing.status === 'cancelled') throw new AppError('Cannot sign a cancelled contract', 400);
  if (existing.status === 'signed') throw new AppError('Contract is already fully signed', 400);

  const isTenant = existing.tenant.toString() === userId;
  const isLandlord = existing.landlord.toString() === userId;
  if (!isTenant && !isLandlord) throw new AppError('Access denied', 403);

  const now = new Date();
  const signField = isTenant ? 'signedByTenant' : 'signedByLandlord';
  const alreadySignedFilter = { [`${signField}.signed`]: false };

  // Atomic update — filter ensures idempotency (won't match if already signed)
  const contract = await Contract.findOneAndUpdate(
    { _id: contractId, status: { $in: ['awaiting_signatures'] }, ...alreadySignedFilter },
    { $set: { [`${signField}.signed`]: true, [`${signField}.signedAt`]: now } },
    { new: true },
  )
    .populate('tenant', 'name email phone address')
    .populate('landlord', 'name email phone address')
    .populate('property', 'title type address area bedrooms bathrooms price')
    .populate('booking', 'startDate endDate duration totalPrice status');

  if (!contract) throw new AppError('You have already signed this contract', 400);

  // Atomically mark as signed if both parties have now signed
  const bothSigned = contract.signedByTenant.signed && contract.signedByLandlord.signed;
  if (bothSigned) {
    await Contract.updateOne(
      { _id: contractId, 'signedByTenant.signed': true, 'signedByLandlord.signed': true },
      { $set: { status: 'signed' } },
    );
    contract.status = 'signed';
  }

  // Regenerate PDF with updated signature info
  const pdfUrl = await generateAndUploadContractPdf({
    contractId: contract._id.toString(),
    booking: contract.booking,
    tenant: contract.tenant,
    landlord: contract.landlord,
    property: contract.property,
    terms: contract.terms,
    signedByTenant: contract.signedByTenant,
    signedByLandlord: contract.signedByLandlord,
  });

  await Contract.updateOne({ _id: contractId }, { $set: { pdfUrl } });
  contract.pdfUrl = pdfUrl;

  return contract;
};

// ─── Get Contract By ID ──────────────────────────────────────────────────────

const getContractById = async (contractId, userId, userRole) => {
  const contract = await populateContract(Contract.findById(contractId));
  if (!contract) throw new AppError('Contract not found', 404);

  if (userRole !== 'admin') {
    const isTenant = contract.tenant._id.toString() === userId;
    const isLandlord = contract.landlord._id.toString() === userId;
    if (!isTenant && !isLandlord) throw new AppError('Access denied', 403);
  }

  return contract;
};

// ─── Get Contracts By Booking ─────────────────────────────────────────────────

const getContractByBooking = async (bookingId, userId, userRole) => {
  const contract = await populateContract(Contract.findOne({ booking: bookingId }));
  if (!contract) throw new AppError('Contract not found for this booking', 404);

  if (userRole !== 'admin') {
    const isTenant = contract.tenant._id.toString() === userId;
    const isLandlord = contract.landlord._id.toString() === userId;
    if (!isTenant && !isLandlord) throw new AppError('Access denied', 403);
  }

  return contract;
};

// ─── Get My Contracts ────────────────────────────────────────────────────────

const getMyContracts = async (userId, userRole, { status, page = 1, limit = 10 }) => {
  const filter = {};
  if (status) filter.status = status;

  if (userRole === 'tenant') filter.tenant = userId;
  else if (userRole === 'landlord') filter.landlord = userId;

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const [contracts, total] = await Promise.all([
    populateContract(Contract.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Contract.countDocuments(filter),
  ]);

  return {
    contracts,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get All Contracts (admin) ────────────────────────────────────────────────

const getAllContracts = async ({ status, page = 1, limit = 10 }) => {
  const filter = {};
  if (status) filter.status = status;

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const [contracts, total] = await Promise.all([
    populateContract(Contract.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Contract.countDocuments(filter),
  ]);

  return {
    contracts,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Cancel Contract (admin only) ────────────────────────────────────────────

const cancelContract = async (contractId) => {
  const contract = await Contract.findById(contractId);
  if (!contract) throw new AppError('Contract not found', 404);

  if (contract.status === 'cancelled') throw new AppError('Contract is already cancelled', 400);

  contract.status = 'cancelled';
  await contract.save();

  return contract;
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
