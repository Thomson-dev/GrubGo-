import { Router } from 'express';
import { protect } from '../middleware/auth';
import upload from '../middleware/upload';
import { uploadImage, deleteImage } from '../controllers/uploadController';

const router = Router();

// "upload.single('image')" means: expect one file in the form field named "image"
router.post('/', protect, upload.single('image'), uploadImage);
router.delete('/', protect, deleteImage);

export default router;
