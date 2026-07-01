import express from 'express';
import { getMyPreference, upsertPreference, deletePreference } from '../controllers/preference.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('tenant'));

router.get('/', getMyPreference);
router.put('/', upsertPreference);
router.delete('/', deletePreference);

export default router;
