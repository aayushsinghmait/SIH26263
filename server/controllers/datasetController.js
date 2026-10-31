import { memoryStore, saveStoreToDisk } from '../config/db.js';
import { broadcastLiveEvent } from './applicationController.js';

export async function getDatasets(req, res) {
  try {
    const { ministryCode } = req.query;
    let list = [...memoryStore.datasets];
    if (ministryCode) {
      list = list.filter(d => d.ministryCode === ministryCode);
    }
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createOrUpdateDataset(req, res) {
  try {
    const { datasetId, name, ministryCode, owningMinistry, records, columns, purpose, supportedSearchKeys } = req.body;
    
    const existingIndex = memoryStore.datasets.findIndex(d => d.datasetId === datasetId);

    const dsObj = {
      datasetId: datasetId || `DS-${ministryCode}-${Date.now().toString().slice(-4)}`,
      name: name || 'Custom Ministry Dataset',
      owningMinistry: owningMinistry || `${ministryCode} Authority`,
      ministryCode: ministryCode || 'GENERIC',
      category: req.body.category || 'REGISTRY',
      sensitivity: req.body.sensitivity || 'RESTRICTED',
      purpose: purpose || 'Statutory regulatory compliance verification',
      supportedSearchKeys: supportedSearchKeys || (columns ? [columns[0]] : ['id']),
      sharingAgreementActive: req.body.sharingAgreementActive !== undefined ? req.body.sharingAgreementActive : true,
      permittedUseCases: req.body.permittedUseCases || ['IDENTITY_VERIFICATION', 'COMPLIANCE_CHECK'],
      availableFields: columns ? columns.map(c => ({ field: c, type: 'STRING', description: c })) : [],
      records: records || []
    };

    if (existingIndex >= 0) {
      memoryStore.datasets[existingIndex] = dsObj;
    } else {
      memoryStore.datasets.push(dsObj);
    }

    // Update ministry record count
    const min = memoryStore.ministries.find(m => m.code === ministryCode);
    if (min) {
      min.recordsCount = (records || []).length;
      min.lastSync = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }

    saveStoreToDisk();

    broadcastLiveEvent(req, 'dataset:updated', dsObj);

    res.json({ success: true, data: dsObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
