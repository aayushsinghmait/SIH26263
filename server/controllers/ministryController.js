import { memoryStore, saveStoreToDisk } from '../config/db.js';
import { broadcastLiveEvent } from './applicationController.js';

export async function getMinistries(req, res) {
  try {
    res.json({ success: true, count: memoryStore.ministries.length, data: memoryStore.ministries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createMinistry(req, res) {
  try {
    const { code, name, category, adminEmail } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'Code and Name are required' });
    }

    const newMinistry = {
      id: `min-${code.toLowerCase().trim()}`,
      code: code.toUpperCase().trim(),
      name,
      category: category || 'Regulatory Authority',
      icon: 'Building2',
      adminEmail: adminEmail || '',
      status: 'ACTIVE',
      recordsCount: 0,
      lastSync: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    memoryStore.ministries.push(newMinistry);
    saveStoreToDisk();

    broadcastLiveEvent(req, 'ministry:new', newMinistry);

    res.status(201).json({ success: true, data: newMinistry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
