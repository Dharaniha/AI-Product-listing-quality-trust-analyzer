import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, authenticate } from '../middleware/auth.middleware.js';
import * as analysisController from '../controllers/analysis.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.post('/run', upload.array('images', 8), asyncHandler(analysisController.runAnalysis));
router.get('/history', asyncHandler(analysisController.getHistory));
router.delete('/history', asyncHandler(analysisController.clearHistory));
router.delete('/:id', asyncHandler(analysisController.deleteAnalysis));

export default router;