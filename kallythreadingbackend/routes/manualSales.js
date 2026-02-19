const express = require('express');
const ManualSale = require('../models/ManualSale');
const { protect, authorize } = require('../middleware/auth');
const { getBranchId } = require('../middleware/branchFilter');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

/** GET /api/manual-sales?from=&to=&branchId= */
router.get('/', async (req, res) => {
  try {
    const { from, to, branchId } = req.query;
    const filter = {};
    if (branchId) filter.branchId = branchId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }
    const sales = await ManualSale.find(filter)
      .populate('branchId', 'name')
      .sort({ date: -1 })
      .lean();
    res.json({
      success: true,
      sales: sales.map((s) => ({
        id: String(s._id),
        branchId: String(s.branchId?._id ?? s.branchId),
        branchName: s.branchId?.name ?? '—',
        date: s.date,
        amount: s.amount,
        hasImage: Boolean(s.imageBase64),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch manual sales.' });
  }
});

/** GET /api/manual-sales/:id - get single entry with image for view/download */
router.get('/:id', async (req, res) => {
  try {
    const sale = await ManualSale.findById(req.params.id)
      .populate('branchId', 'name')
      .lean();
    if (!sale) return res.status(404).json({ success: false, message: 'Manual sale not found.' });
    res.json({
      success: true,
      sale: {
        id: String(sale._id),
        branchId: String(sale.branchId?._id ?? sale.branchId),
        branchName: sale.branchId?.name ?? '—',
        date: sale.date,
        amount: sale.amount,
        imageBase64: sale.imageBase64,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch manual sale.' });
  }
});

/** POST /api/manual-sales - create with optional base64 image */
router.post('/', async (req, res) => {
  try {
    const { branchId, date, amount, imageBase64 } = req.body;
    if (!branchId || !date || amount == null) {
      return res.status(400).json({ success: false, message: 'Branch, date, and amount are required.' });
    }
    const sale = await ManualSale.create({
      branchId,
      date: new Date(date),
      amount: Number(amount),
      imageBase64: imageBase64 || undefined,
    });
    const populated = await ManualSale.findById(sale._id).populate('branchId', 'name').lean();
    res.status(201).json({
      success: true,
      sale: {
        id: String(populated._id),
        branchId: String(populated.branchId?._id ?? populated.branchId),
        branchName: populated.branchId?.name ?? '—',
        date: populated.date,
        amount: populated.amount,
        hasImage: Boolean(populated.imageBase64),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create manual sale.' });
  }
});

/** DELETE /api/manual-sales/:id */
router.delete('/:id', async (req, res) => {
  try {
    const sale = await ManualSale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Manual sale not found.' });
    res.json({ success: true, message: 'Manual sale deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete manual sale.' });
  }
});

module.exports = router;
