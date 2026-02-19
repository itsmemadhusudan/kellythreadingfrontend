const express = require('express');
const Service = require('../models/Service');
const { protect, authorize } = require('../middleware/auth');
const { getBranchId } = require('../middleware/branchFilter');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { branchId, all } = req.query;
    const bid = getBranchId(req.user);
    const filter = req.user.role === 'admin' && all === 'true' ? {} : { isActive: true };
    if (req.user.role !== 'admin' || all !== 'true') {
      if (bid) filter.$or = [{ branchId: bid }, { branchId: null }];
      else if (branchId) filter.$or = [{ branchId: branchId }, { branchId: null }];
    }

    const services = await Service.find(filter).populate('branchId', 'name').sort({ name: 1 }).lean();
    res.json({
      success: true,
      services: services.map((s) => ({
        id: s._id,
        name: s.name,
        category: s.category,
        branch: s.branchId?.name,
        branchId: s.branchId ? String(s.branchId._id || s.branchId) : null,
        durationMinutes: s.durationMinutes,
        price: s.price,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch services.' });
  }
});

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, category, branchId, durationMinutes, price } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Service name is required.' });
    const service = await Service.create({
      name,
      category: category || undefined,
      branchId: branchId || undefined,
      durationMinutes: durationMinutes != null ? Number(durationMinutes) : undefined,
      price: price != null ? Number(price) : 0,
    });
    res.status(201).json({
      success: true,
      service: {
        id: service._id,
        name: service.name,
        category: service.category,
        branchId: service.branchId,
        durationMinutes: service.durationMinutes,
        price: service.price,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create service.' });
  }
});

router.patch('/:id', authorize('admin'), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
    const { name, category, branchId, durationMinutes, price } = req.body;
    if (name !== undefined) service.name = String(name).trim();
    if (category !== undefined) service.category = category ? String(category).trim() : undefined;
    if (branchId !== undefined) service.branchId = branchId || null;
    if (durationMinutes !== undefined) service.durationMinutes = durationMinutes != null ? Number(durationMinutes) : undefined;
    if (price !== undefined) service.price = price != null ? Number(price) : 0;
    await service.save();
    res.json({
      success: true,
      service: {
        id: service._id,
        name: service.name,
        category: service.category,
        branchId: service.branchId,
        durationMinutes: service.durationMinutes,
        price: service.price,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update service.' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
    res.json({ success: true, message: 'Service removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete service.' });
  }
});

module.exports = router;
