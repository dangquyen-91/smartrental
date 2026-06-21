import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

// All routes in this module require admin authentication
router.use(protect, authorizeRoles('admin'));

// ─── Dashboard ────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// ─── Analytics ────────────────────────────────────────────────────────────────
// Query param: ?period=7d|30d|90d|1y (default: 30d)
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/users', adminController.getUserAnalytics);
router.get('/analytics/bookings', adminController.getBookingAnalytics);
router.get('/analytics/services', adminController.getServiceAnalytics);
router.get('/analytics/properties', adminController.getPropertyAnalytics);

// ─── User Management ──────────────────────────────────────────────────────────
// GET    /api/admin/users?page=1&limit=20&role=&search=&isActive=
// PATCH  /api/admin/users/:id/status   body: { isActive: boolean }
// PATCH  /api/admin/users/:id/role     body: { role: 'tenant'|'landlord'|'provider' }
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);

// ─── Property Management ──────────────────────────────────────────────────────
// GET    /api/admin/properties?page=1&limit=20&status=&type=&search=
// PATCH  /api/admin/properties/:id/featured  (toggles isFeatured)
// PATCH  /api/admin/properties/:id/status    body: { status: 'available'|'rented'|'maintenance' }
// DELETE /api/admin/properties/:id           soft-delete (sets isActive: false)
router.get('/properties', adminController.getProperties);
router.patch('/properties/:id/featured', adminController.togglePropertyFeatured);
router.patch('/properties/:id/status', adminController.updatePropertyStatus);
router.delete('/properties/:id', adminController.deleteProperty);

// ─── Pending Actions ──────────────────────────────────────────────────────────
// GET /api/admin/pending/payouts?page=1&limit=20
// GET /api/admin/pending/refunds?page=1&limit=20
router.get('/pending/payouts', adminController.getPendingPayouts);
router.get('/pending/refunds', adminController.getPendingRefunds);

export default router;
