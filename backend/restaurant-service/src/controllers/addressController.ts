import { Request, Response } from 'express';
import Address from '../models/Address';

// GET /api/addresses
export const getAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const addresses = await Address.find({ customerId: req.user!.id }).sort({ isDefault: -1 });
    res.status(200).json({ success: true, addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// POST /api/addresses
export const addAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { label, street, city, state, pincode, lat, lng, isDefault } = req.body;

    // If this is set as default, unset all others first
    if (isDefault) {
      await Address.updateMany({ customerId: req.user!.id }, { isDefault: false });
    }

    // If this is the user's first address, auto-set as default
    const count = await Address.countDocuments({ customerId: req.user!.id });
    const address = await Address.create({
      customerId: req.user!.id,
      label, street, city, state, pincode, lat, lng,
      isDefault: isDefault || count === 0,
    });

    res.status(201).json({ success: true, message: 'Address saved', address });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isDefault, ...rest } = req.body;

    if (isDefault) {
      await Address.updateMany({ customerId: req.user!.id }, { isDefault: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, customerId: req.user!.id },
      { ...rest, isDefault: isDefault ?? false },
      { new: true, runValidators: true }
    );
    if (!address) { res.status(404).json({ success: false, message: 'Address not found' }); return; }
    res.status(200).json({ success: true, message: 'Address updated', address });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Address.findOneAndDelete({
      _id: req.params.id, customerId: req.user!.id,
    });
    if (!deleted) { res.status(404).json({ success: false, message: 'Address not found' }); return; }

    // If the deleted address was default, promote the most recent one
    if (deleted.isDefault) {
      await Address.findOneAndUpdate(
        { customerId: req.user!.id },
        { isDefault: true },
        { sort: { createdAt: -1 } }
      );
    }

    res.status(200).json({ success: true, message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// PATCH /api/addresses/:id/default
export const setDefaultAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    await Address.updateMany({ customerId: req.user!.id }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, customerId: req.user!.id },
      { isDefault: true },
      { new: true }
    );
    if (!address) { res.status(404).json({ success: false, message: 'Address not found' }); return; }
    res.status(200).json({ success: true, message: 'Default address updated', address });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
