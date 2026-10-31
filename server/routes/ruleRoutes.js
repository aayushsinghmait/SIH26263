import express from 'express';
import { getRules, createRule } from '../controllers/ruleController.js';

const router = express.Router();

router.get('/', getRules);
router.post('/', createRule);

export default router;
