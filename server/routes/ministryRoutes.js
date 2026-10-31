import express from 'express';
import { getMinistries, createMinistry } from '../controllers/ministryController.js';

const router = express.Router();

router.get('/', getMinistries);
router.post('/', createMinistry);

export default router;
