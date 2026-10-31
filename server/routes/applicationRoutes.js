import express from 'express';
import multer from 'multer';
import {
  getApplications,
  getApplicationById,
  createApplication,
  uploadApplicationsExcel,
  verifyApplication,
  verifyAllApplications,
  commitDecision,
  deleteApplication
} from '../controllers/applicationController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getApplications);
router.post('/', createApplication);
router.post('/upload', upload.single('file'), uploadApplicationsExcel);
router.post('/verify-all', verifyAllApplications);

router.get('/:id', getApplicationById);
router.post('/:id/verify', verifyApplication);
router.post('/:id/decision', commitDecision);
router.delete('/:id', deleteApplication);

export default router;
