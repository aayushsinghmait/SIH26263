import express from 'express';
import { getDatasets, createOrUpdateDataset } from '../controllers/datasetController.js';

const router = express.Router();

router.get('/', getDatasets);
router.post('/', createOrUpdateDataset);

export default router;
