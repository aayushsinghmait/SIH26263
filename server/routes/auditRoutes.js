import express from 'express';
import { getAuditLogs, createAuditLog, getTelemetry } from '../controllers/auditController.js';

const router = express.Router();

router.get('/', getAuditLogs);
router.post('/', createAuditLog);
router.get('/telemetry', getTelemetry);

export default router;
