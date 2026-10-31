import { memoryStore, saveStoreToDisk } from '../config/db.js';
import { broadcastLiveEvent } from './applicationController.js';

export async function getRules(req, res) {
  try {
    res.json({ success: true, count: memoryStore.rules.length, data: memoryStore.rules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createRule(req, res) {
  try {
    const { code, name, statute, description, category, strictness, formula } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'Rule code and name are required' });
    }

    const newRule = {
      id: `RULE-0${memoryStore.rules.length + 1}`,
      code: code.trim().toUpperCase(),
      name,
      statute: statute || 'National Regulatory Framework',
      description: description || '',
      category: category || 'STATUTORY',
      strictness: strictness || 'MANDATORY_CRITICAL',
      formula: formula || '',
      active: true
    };

    memoryStore.rules.push(newRule);
    saveStoreToDisk();

    broadcastLiveEvent(req, 'rule:new', newRule);

    res.status(201).json({ success: true, data: newRule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
