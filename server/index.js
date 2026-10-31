import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getMongoStatus, memoryStore, saveStoreToDisk } from './config/db.js';
import { 
  SEED_MINISTRIES, 
  SEED_DATASETS, 
  SEED_RULES, 
  SEED_APPLICATIONS, 
  SEED_AUDIT_LOGS 
} from './data/seedData.js';

import applicationRoutes from './routes/applicationRoutes.js';
import ministryRoutes from './routes/ministryRoutes.js';
import datasetRoutes from './routes/datasetRoutes.js';
import ruleRoutes from './routes/ruleRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Attach io instance to express app so controllers can broadcast
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/applications', applicationRoutes);
app.use('/api/ministries', ministryRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/audit', auditRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const status = getMongoStatus();
  res.json({
    status: 'ONLINE',
    service: 'GovVerify AI Sovereign Regulatory Backend',
    timestamp: new Date().toISOString(),
    ...status
  });
});

// Reseed / Reset endpoint
app.post('/api/reset', (req, res) => {
  memoryStore.applications = [...SEED_APPLICATIONS];
  memoryStore.ministries = [...SEED_MINISTRIES];
  memoryStore.datasets = [...SEED_DATASETS];
  memoryStore.rules = [...SEED_RULES];
  memoryStore.auditLogs = [...SEED_AUDIT_LOGS];
  saveStoreToDisk();

  io.emit('system:reset', { message: 'Platform state reset to official sovereign seeds' });
  io.emit('application:batch_updated', memoryStore.applications);

  res.json({ success: true, message: 'Platform state reset successfully' });
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`⚡ Live Client Connected: ${socket.id}`);

  // Send current connection greeting
  socket.emit('connection:ack', {
    status: 'CONNECTED',
    serverTime: new Date().toISOString(),
    message: 'GovVerify AI Real-Time WebSocket Channel Active'
  });

  // Client can request immediate state sync
  socket.on('sync:request', () => {
    socket.emit('sync:data', {
      applications: memoryStore.applications,
      ministries: memoryStore.ministries,
      datasets: memoryStore.datasets,
      rules: memoryStore.rules,
      auditLogs: memoryStore.auditLogs
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client Disconnected: ${socket.id}`);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Uncaught Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Start Server & Connect Database
async function startServer() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏛️  GovVerify AI MERN Stack Server Online`);
    console.log(`📡  REST API:      http://localhost:${PORT}/api`);
    console.log(`⚡  Socket.IO:     ws://localhost:${PORT}`);
    console.log(`🛡️  Health check:  http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer();
