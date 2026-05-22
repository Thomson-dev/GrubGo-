import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

// POST /api/upload
// Body: multipart/form-data  field: "image"
// Query: ?folder=restaurants | menu | avatars
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    const folder = (req.query.folder as string) ?? 'general';

    // Upload from buffer using a writable upload stream
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `food-ordering/${folder}`, resource_type: 'image' },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Upload failed'));
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
          }
        );
        stream.end(req.file!.buffer);
      }
    );

    res.status(200).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: (err as Error).message });
  }
};

// DELETE /api/upload
// Body: { publicId: "food-ordering/menu/abc123" }
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicId } = req.body as { publicId: string };
    if (!publicId) {
      res.status(400).json({ message: 'publicId is required' });
      return;
    }

    await cloudinary.uploader.destroy(publicId);
    res.status(200).json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: (err as Error).message });
  }
};
