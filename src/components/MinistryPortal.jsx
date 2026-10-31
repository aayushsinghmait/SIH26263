import React, { useState } from 'react';
import { 
  Building2, Database, Upload, Plus, Users, UserPlus, ShieldCheck, 
  CheckCircle2, AlertTriangle, FileSpreadsheet, Download, RefreshCw, Trash2,
  FolderPlus, Layers, FileDown, Edit3, Eye, Search, ArrowLeft, Check, X,
  FileText, Calendar, Tag, ExternalLink, Sparkles, Settings, Sliders, Table,
  ListPlus, Sparkle, Send, Clock, FileCheck, HelpCircle, GraduationCap
} from 'lucide-react';
import { 
  parseExcelFile, 
  exportToExcel, 
  downloadMinistryDatasetTemplate, 
  downloadCustomDatasetTemplate 
} from '../utils/excelHelper';
import { executeDynamicVerification, generateVerificationPlan } from '../utils/dynamicVerificationEngine';
import { triggerVerifyApplication } from '../services/api';

export function MinistryPortal({ 
  currentMinistryCode = 'IITD', 
  currentUser = null,
  ministries = [], 
  databases = {}, 
  namedDatasets = {},
  applications = [],
  onApplicationsUpdate,
  onDatabaseUpdate, 
  onNamedDatasetUpdate,
  onApplicationUpload,
  onLogAudit 
}) {
  const isMinistryAdmin = currentUser?.subRole !== 'STAFF'; // true for Admin, false for Staff
  const currentMinistry = ministries.find(m => m.code === currentMinistryCode) || ministries[0];
  
  // Datasets for this institution
  const ministryDatasets = namedDatasets[currentMinistryCode] || [
    {
      id: `DS-${currentMinistryCode}-001`,
      name: `${currentMinistryCode} Student Enrollment Master`,
      uploadedAt: '2026-10-23 18:30:00',
      source: 'Student_Enrollment_Master.xlsx',
      description: 'AICTE approved student intake and APAAR academic identity master.',
      columns: [
        'apaar_id', 'student_name', 'enrollment_no', 'course', 'branch', 
        'approved_intake', 'actual_enrolment', 'supernumerary_seats', 
        'nri_category', 'oci_status', 'foreign_national'
      ],
      records: databases[currentMinistryCode] || []
    }
  ];

  // Total records across all datasets
  const totalRecordsCount = ministryDatasets.reduce((acc, ds) => acc + (ds.records?.length || 0), 0);

  // Tabs
  const [activeTab, setActiveTab] = useState('DATASETS'); // 'DATASETS', 'UPLOAD_APP', 'STAFF'
  
  // Active dataset being inspected in detail
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const selectedDataset = ministryDatasets.find(d => d.id === selectedDatasetId) || null;

  // Search filter for records inside detail view or dataset list
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------
  // Column Helpers
  // -------------------------------------------------------------
  const getDefaultMinistryColumns = (code) => {
    return [
      'apaar_id', 'student_name', 'enrollment_no', 'course', 'branch', 
      'approved_intake', 'actual_enrolment', 'supernumerary_seats', 
      'nri_category', 'oci_status', 'foreign_national'
    ];
  };

  const getDatasetColumns = (ds) => {
    if (ds?.columns && Array.isArray(ds.columns) && ds.columns.length > 0) {
      return ds.columns;
    }
    if (ds?.records && ds.records.length > 0) {
      const keys = Object.keys(ds.records[0]).filter(k => k !== 'status' && k !== 'id');
      if (keys.length > 0) return keys;
    }
    return getDefaultMinistryColumns(currentMinistryCode);
  };

  const formatColumnLabel = (col) => {
    if (!col) return '';
    return col
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  // -------------------------------------------------------------
  // Create New Dataset Modal State
  // -------------------------------------------------------------
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDesc, setNewDatasetDesc] = useState('');
  const [customColumns, setCustomColumns] = useState([
    'Student Name', 'APAAR ID', 'Enrollment No', 'Course', 'Branch', 
    'Approved Intake', 'Actual Enrolment', 'Supernumerary Seats'
  ]);
  const [newColumnInput, setNewColumnInput] = useState('');

  // -------------------------------------------------------------
  // Manage Schema / Columns on Existing Dataset Modal State
  // -------------------------------------------------------------
  const [showManageColumnsModal, setShowManageColumnsModal] = useState(false);
  const [editingDatasetColumns, setEditingDatasetColumns] = useState([]);
  const [manageColumnInput, setManageColumnInput] = useState('');

  // Update Dataset via Excel Modal State
  const [updateTargetDatasetId, setUpdateTargetDatasetId] = useState(null);
  const updateTargetDataset = ministryDatasets.find(d => d.id === updateTargetDatasetId) || null;

  // Staged rows for Excel upload & Schema mapping
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [stagedRows, setStagedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const [uploadIntent, setUploadIntent] = useState('CREATE_NEW'); // 'CREATE_NEW' or 'UPDATE_EXISTING'
  const [stagedDatasetMeta, setStagedDatasetMeta] = useState({ name: '', desc: '' });

  // Rename Dataset inline modal
  const [renamingDataset, setRenamingDataset] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Dynamic Add Manual Record State
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualRecord, setManualRecord] = useState({ status: 'ACTIVE' });

  // -------------------------------------------------------------
  // Dynamic Application Creation & Flexible Excel Upload State
  // -------------------------------------------------------------
  const [appCustomColumns, setAppCustomColumns] = useState([
    'Student Name', 'APAAR ID', 'Enrollment No', 'Course', 'Branch', 
    'Approved Intake', 'Actual Enrolment', 'Supernumerary Seats', 'NRI Category'
  ]);
  const [newAppColumnInput, setNewAppColumnInput] = useState('');
  const [showCreateAppModal, setShowCreateAppModal] = useState(false);
  const [newAppRecord, setNewAppRecord] = useState({
    scheme_name: `${currentMinistry?.name || currentMinistryCode} Academic Programme`
  });
  const [stagedAppBatch, setStagedAppBatch] = useState([]);
  const [stagedAppColumns, setStagedAppColumns] = useState([]);
  const [stagedAppFileName, setStagedAppFileName] = useState('');
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [inspectCheckResult, setInspectCheckResult] = useState(null);
  const [inspectStepMessage, setInspectStepMessage] = useState('');
  const [appSearchQuery, setAppSearchQuery] = useState('');

  // Clean deduplicated entries for inspect modal
  const getCleanAppEntries = (app) => {
    if (!app) return [];
    const seen = new Set();
    const list = [];
    const skip = ['verification_report', 'dynamicPlan', 'dynamicResult', 'custom_fields', 'ai_verdict', 'confidence_score'];
    const priority = ['scheme_name', 'applicant_name', 'dob', 'gender', 'father_name', 'aadhaar_no', 'pan_no', 'claimed_income', 'state', 'pin_code', 'status', 'submittedAt', 'submitted_at'];
    const allKeys = [...priority, ...Object.keys(app)];
    for (const k of allKeys) {
      if (skip.includes(k)) continue;
      const val = app[k];
      if (val === undefined || val === null || String(val).trim() === '') continue;
      const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(norm)) {
        seen.add(norm);
        list.push({ key: k, label: formatColumnLabel(k), value: String(val) });
      }
    }
    return list;
  };

  const handleRunModalDatabaseCheck = async (app) => {
    setIsCheckingDb(true);
    setInspectStepMessage('Querying UIDAI Biometric Registry for citizen match...');
    await new Promise(r => setTimeout(r, 400));

    setInspectStepMessage('Querying CBDT Direct Tax & PAN linkage databases...');
    await new Promise(r => setTimeout(r, 400));

    setInspectStepMessage('Cross-checking Department Ingestion Schemas & Domicile records...');
    await new Promise(r => setTimeout(r, 400));

    const dummyPlan = generateVerificationPlan(app, [], []);
    const dynamicResult = executeDynamicVerification(app, dummyPlan, databases);

    setInspectCheckResult(dynamicResult);
    setIsCheckingDb(false);
    setInspectStepMessage('');

    let status = 'VERIFIED';
    if (dynamicResult.overallVerdict === 'MISMATCH_DETECTED') status = 'FLAGGED';
    else if (dynamicResult.overallVerdict === 'MANUAL_REVIEW_REQUIRED') status = 'NEEDS_REVIEW';

    const updatedApp = {
      ...app,
      status,
      ai_verdict: dynamicResult.overallVerdict === 'PASSED' ? 'PASS' : dynamicResult.overallVerdict === 'MISMATCH_DETECTED' ? 'FAIL' : 'NEEDS_REVIEW',
      confidence_score: dynamicResult.confidenceScore,
      verification_report: dynamicResult
    };

    setSelectedAppDetail(updatedApp);

    if (onApplicationsUpdate) {
      onApplicationsUpdate(prev => prev.map(a => a.id === app.id ? updatedApp : a));
    }

    try {
      await triggerVerifyApplication(app.id);
    } catch (err) {
      // Handled locally
    }

    if (onLogAudit) {
      onLogAudit({
        actor: currentUser?.name || `${currentMinistryCode} Officer`,
        portal: `Ministry Portal (${currentMinistryCode})`,
        action: 'REAL_DATABASE_VERIFICATION_COMPLETE',
        details: `Real cross-database verification executed for ${app.applicant_name} (${app.id}). Verdict: ${updatedApp.ai_verdict} (${updatedApp.confidence_score}% match).`,
        severity: status === 'FLAGGED' ? 'DANGER' : status === 'VERIFIED' ? 'SUCCESS' : 'WARNING'
      });
    }
  };

  const handleRegisterCitizenInUIDAI = (citizenName) => {
    const newUidaiRecord = {
      aadhaar_no: `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: citizenName,
      dob: '1995-05-15',
      gender: 'Male',
      father_name: 'Authorized Citizen Father',
      state: selectedAppDetail?.state || selectedAppDetail?.State || 'Delhi',
      pin_code: '110001',
      biometric_status: 'AUTHENTICATED'
    };

    const currentUidai = databases.UIDAI || [];
    const updatedUidai = [newUidaiRecord, ...currentUidai];

    if (onDatabaseUpdate) {
      onDatabaseUpdate('UIDAI', updatedUidai);
    }

    alert(`Successfully registered "${citizenName}" into UIDAI National Biometric Master Database with Aadhaar #${newUidaiRecord.aadhaar_no}! Re-running real database check...`);

    const updatedDatabases = {
      ...databases,
      UIDAI: updatedUidai
    };
    const dummyPlan = generateVerificationPlan(selectedAppDetail, [], []);
    const dynamicResult = executeDynamicVerification(selectedAppDetail, dummyPlan, updatedDatabases);

    setInspectCheckResult(dynamicResult);

    const updatedApp = {
      ...selectedAppDetail,
      aadhaar_no: newUidaiRecord.aadhaar_no,
      status: 'VERIFIED',
      ai_verdict: 'PASS',
      confidence_score: 95,
      verification_report: dynamicResult
    };

    setSelectedAppDetail(updatedApp);

    if (onApplicationsUpdate) {
      onApplicationsUpdate(prev => prev.map(a => a.id === selectedAppDetail.id ? updatedApp : a));
    }
  };

  // Staff State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffRoleType, setStaffRoleType] = useState('STAFF');
  const [staffList, setStaffList] = useState([
    { id: 'STF-01', name: 'Dr. Neha Saxena', role: 'Ministry Admin', email: `admin@${currentMinistryCode.toLowerCase()}.gov.in`, status: 'ACTIVE' },
    { id: 'STF-02', name: 'Vikash Rathore', role: 'Data Verification Staff', email: `v.rathore@${currentMinistryCode.toLowerCase()}.gov.in`, status: 'ACTIVE' },
    { id: 'STF-03', name: 'Pooja Iyer', role: 'Compliance Officer', email: `p.iyer@${currentMinistryCode.toLowerCase()}.gov.in`, status: 'ACTIVE' }
  ]);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'STAFF' });

  // -------------------------------------------------------------
  // Sync Datasets to Central AI Engine
  // -------------------------------------------------------------
  const syncDatasets = (updatedList, auditAction, auditDetails) => {
    if (onNamedDatasetUpdate) {
      onNamedDatasetUpdate(currentMinistryCode, updatedList);
    } else if (onDatabaseUpdate) {
      const flat = updatedList.flatMap(d => d.records || []);
      onDatabaseUpdate(currentMinistryCode, flat);
    }

    if (onLogAudit && auditAction) {
      onLogAudit({
        actor: currentUser?.name || `${currentMinistryCode} Admin`,
        portal: `Ministry Portal (${currentMinistryCode})`,
        action: auditAction,
        details: auditDetails || `Updated dataset registry for ${currentMinistryCode}`,
        severity: 'SUCCESS'
      });
    }
  };

  // -------------------------------------------------------------
  // Excel File Parsing & Column Auto-Detection for Datasets
  // -------------------------------------------------------------
  const handleExcelSelected = async (file, intent = 'CREATE_NEW', targetDsId = null) => {
    if (!file) return;
    try {
      setIsUploading(true);
      setUploadedFileName(file.name);
      setUploadIntent(intent);
      if (targetDsId) setUpdateTargetDatasetId(targetDsId);

      const rows = await parseExcelFile(file);
      if (!rows || rows.length === 0) {
        alert('The uploaded Excel file appears to be empty or has no data rows.');
        return;
      }

      setStagedRows(rows);
      const cols = Object.keys(rows[0]);
      setAvailableColumns(cols);

      const mapping = {};
      cols.forEach(col => {
        mapping[col] = col;
      });
      setColumnMapping(mapping);

      if (intent === 'CREATE_NEW' && !stagedDatasetMeta.name) {
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_|-]/g, ' ');
        setStagedDatasetMeta({
          name: baseName.charAt(0).toUpperCase() + baseName.slice(1),
          desc: `Imported from ${file.name}`
        });
      }
    } catch (err) {
      alert('Excel parsing error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommitStagedExcel = () => {
    const normalizedRows = stagedRows.map(row => {
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const targetField = columnMapping[key] || key;
        if (targetField !== 'ignore') {
          normalizedRow[targetField] = row[key];
        }
      });
      if (!normalizedRow.status) normalizedRow.status = 'ACTIVE';
      return normalizedRow;
    });

    const detectedColumns = availableColumns.filter(c => columnMapping[c] !== 'ignore');
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (uploadIntent === 'UPDATE_EXISTING' && updateTargetDatasetId) {
      const updatedList = ministryDatasets.map(ds => {
        if (ds.id === updateTargetDatasetId) {
          return {
            ...ds,
            columns: detectedColumns.length > 0 ? detectedColumns : (ds.columns || availableColumns),
            records: normalizedRows,
            uploadedAt: now,
            source: uploadedFileName
          };
        }
        return ds;
      });

      syncDatasets(
        updatedList, 
        'DATASET_EXCEL_UPDATE', 
        `Updated dataset "${updateTargetDataset?.name}" with ${normalizedRows.length} rows from Excel file "${uploadedFileName}".`
      );

      alert(`Dataset "${updateTargetDataset?.name}" successfully updated with ${normalizedRows.length} records!`);
      setUpdateTargetDatasetId(null);
    } else {
      const newDataset = {
        id: `DS-${currentMinistryCode}-${Date.now().toString().slice(-6)}`,
        name: stagedDatasetMeta.name.trim() || `${currentMinistryCode} Dataset ${ministryDatasets.length + 1}`,
        description: stagedDatasetMeta.desc.trim() || `Uploaded on ${now}`,
        uploadedAt: now,
        source: uploadedFileName || 'Excel Upload',
        columns: detectedColumns.length > 0 ? detectedColumns : availableColumns,
        records: normalizedRows
      };

      const updatedList = [newDataset, ...ministryDatasets];
      syncDatasets(
        updatedList, 
        'DATASET_CREATE', 
        `Created new dataset "${newDataset.name}" (${newDataset.id}) with ${normalizedRows.length} records via Excel file "${uploadedFileName}".`
      );

      alert(`New dataset "${newDataset.name}" created successfully with ${normalizedRows.length} records!`);
      setSelectedDatasetId(newDataset.id);
    }

    setStagedRows([]);
    setUploadedFileName('');
    setStagedDatasetMeta({ name: '', desc: '' });
  };

  const handleCreateEmptyDataset = (e) => {
    e.preventDefault();
    if (!newDatasetName.trim()) {
      alert('Please enter a dataset name.');
      return;
    }

    const finalCols = customColumns.filter(c => c && c.trim().length > 0);
    if (finalCols.length === 0) {
      alert('Please define at least one column for this dataset.');
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newDs = {
      id: `DS-${currentMinistryCode}-${Date.now().toString().slice(-6)}`,
      name: newDatasetName.trim(),
      description: newDatasetDesc.trim() || 'Custom dataset schema defined by ministry officer.',
      uploadedAt: now,
      source: 'Direct Manual Creation',
      columns: finalCols,
      records: []
    };

    const updatedList = [newDs, ...ministryDatasets];
    syncDatasets(
      updatedList,
      'DATASET_CREATE_BLANK',
      `Created custom dataset "${newDs.name}" with columns: [${finalCols.join(', ')}].`
    );

    setShowCreateModal(false);
    setNewDatasetName('');
    setNewDatasetDesc('');
    setSelectedDatasetId(newDs.id);
  };

  const handleAddColumnToNewDataset = () => {
    const col = newColumnInput.trim();
    if (!col) return;
    if (customColumns.includes(col)) {
      alert(`Column "${col}" is already in the list.`);
      return;
    }
    setCustomColumns([...customColumns, col]);
    setNewColumnInput('');
  };

  const handleRemoveColumnFromNewDataset = (colToRemove) => {
    setCustomColumns(customColumns.filter(c => c !== colToRemove));
  };

  const handleOpenManageColumns = (dataset) => {
    const currentCols = getDatasetColumns(dataset);
    setEditingDatasetColumns([...currentCols]);
    setManageColumnInput('');
    setShowManageColumnsModal(true);
  };

  const handleSaveEditedColumns = () => {
    if (!selectedDataset) return;
    const finalCols = editingDatasetColumns.filter(c => c && c.trim().length > 0);
    if (finalCols.length === 0) {
      alert('Please keep at least one column.');
      return;
    }

    const updatedList = ministryDatasets.map(d => {
      if (d.id === selectedDataset.id) {
        return { ...d, columns: finalCols };
      }
      return d;
    });

    syncDatasets(
      updatedList,
      'DATASET_SCHEMA_UPDATE',
      `Updated schema for dataset "${selectedDataset.name}". Columns are now: [${finalCols.join(', ')}].`
    );

    setShowManageColumnsModal(false);
  };

  const handleAddColumnToExisting = () => {
    const col = manageColumnInput.trim();
    if (!col) return;
    if (editingDatasetColumns.includes(col)) {
      alert(`Column "${col}" already exists.`);
      return;
    }
    setEditingDatasetColumns([...editingDatasetColumns, col]);
    setManageColumnInput('');
  };

  const handleAddManualRecord = (e) => {
    e.preventDefault();
    if (!selectedDataset) return;

    const currentCols = getDatasetColumns(selectedDataset);
    const hasAnyValue = currentCols.some(col => (manualRecord[col] || '').trim().length > 0);
    if (!hasAnyValue) {
      alert('Please fill at least one field before saving.');
      return;
    }

    const newRecord = { ...manualRecord };
    if (!newRecord.status) newRecord.status = 'ACTIVE';

    const updatedList = ministryDatasets.map(d => {
      if (d.id === selectedDataset.id) {
        return {
          ...d,
          records: [newRecord, ...(d.records || [])]
        };
      }
      return d;
    });

    syncDatasets(
      updatedList,
      'DATASET_MANUAL_RECORD',
      `Added record into dataset "${selectedDataset.name}".`
    );

    setShowManualAdd(false);
    setManualRecord({ status: 'ACTIVE' });
  };

  const handleDeleteRecord = (recordIndex) => {
    if (!selectedDataset) return;
    const updatedRecords = selectedDataset.records.filter((_, idx) => idx !== recordIndex);

    const updatedList = ministryDatasets.map(d => {
      if (d.id === selectedDataset.id) {
        return { ...d, records: updatedRecords };
      }
      return d;
    });

    syncDatasets(
      updatedList,
      'DATASET_RECORD_DELETE',
      `Deleted record at row #${recordIndex + 1} from dataset "${selectedDataset.name}".`
    );
  };

  const handleExportDatasetToExcel = (dataset) => {
    const cols = getDatasetColumns(dataset);
    const cleanName = dataset.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${currentMinistryCode}_${cleanName}.xlsx`;

    if (!dataset.records || dataset.records.length === 0) {
      downloadCustomDatasetTemplate(cols, `${currentMinistryCode}_${dataset.name}`);
      return;
    }

    exportToExcel(dataset.records, filename, dataset.name.slice(0, 30));

    if (onLogAudit) {
      onLogAudit({
        actor: currentUser?.name || `${currentMinistryCode} Admin`,
        portal: `Ministry Portal (${currentMinistryCode})`,
        action: 'DATASET_EXCEL_EXPORT',
        details: `Exported dataset "${dataset.name}" (${dataset.records.length} records) to "${filename}".`,
        severity: 'INFO'
      });
    }
  };

  const handleDeleteDataset = (datasetId, datasetName) => {
    if (ministryDatasets.length <= 1) {
      alert('Cannot delete the only dataset. A ministry must retain at least one dataset.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete dataset "${datasetName}"?`)) {
      return;
    }

    const updatedList = ministryDatasets.filter(d => d.id !== datasetId);
    syncDatasets(
      updatedList,
      'DATASET_DELETE',
      `Deleted dataset "${datasetName}" (${datasetId}) from ${currentMinistryCode} registry.`
    );

    if (selectedDatasetId === datasetId) {
      setSelectedDatasetId(null);
    }
  };

  const handleConfirmRename = () => {
    if (!renameValue.trim() || !renamingDataset) return;

    const updatedList = ministryDatasets.map(d => {
      if (d.id === renamingDataset.id) {
        return { ...d, name: renameValue.trim() };
      }
      return d;
    });

    syncDatasets(
      updatedList,
      'DATASET_RENAME',
      `Renamed dataset from "${renamingDataset.name}" to "${renameValue.trim()}".`
    );

    setRenamingDataset(null);
    setRenameValue('');
  };

  // -------------------------------------------------------------
  // APPLICATION UPLOAD & CREATION HANDLERS (NO RIGID FORMAT)
  // -------------------------------------------------------------
  const handleApplicationFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setStagedAppFileName(file.name);
      const rows = await parseExcelFile(file);
      if (!rows || rows.length === 0) {
        alert('Uploaded Excel file has no rows.');
        return;
      }

      const cols = Object.keys(rows[0]);
      setStagedAppColumns(cols);

      // Keep ALL custom columns as-is from Excel without dropping anything
      const formatted = rows.map((r, i) => {
        const appId = r.Application_ID || r.application_id || r.id || `APP-${currentMinistryCode}-${Math.floor(1000 + Math.random() * 9000)}`;
        const appName = r.Applicant_Name || r.applicant_name || r.full_name || r.Name || r.name || 'Applicant ' + (i + 1);
        return {
          ...r,
          id: appId,
          scheme_name: r.scheme_name || r.Scheme_Name || `${currentMinistry?.name || currentMinistryCode} Scheme`,
          applicant_name: appName,
          status: 'PENDING_AI_CHECK',
          submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };
      });

      setStagedAppBatch(formatted);
    } catch (err) {
      alert('Error parsing applications Excel: ' + err.message);
    }
  };

  const handleCommitStagedApplications = () => {
    if (stagedAppBatch.length === 0) return;

    if (onApplicationUpload) {
      onApplicationUpload(stagedAppBatch);
    }

    if (onLogAudit) {
      onLogAudit({
        actor: currentUser?.name || `${currentMinistryCode} Officer`,
        portal: `Ministry Portal (${currentMinistryCode})`,
        action: 'APPLICATION_BATCH_UPLOAD',
        details: `Forwarded batch of ${stagedAppBatch.length} applications with custom schema [${stagedAppColumns.join(', ')}] to Central AI Queue.`,
        severity: 'SUCCESS'
      });
    }

    alert(`Successfully forwarded ${stagedAppBatch.length} applications with all custom columns to Central AI Verification Queue!`);
    setStagedAppBatch([]);
    setStagedAppFileName('');
    setStagedAppColumns([]);
  };

  const handleCreateSingleApplicationSubmit = (e) => {
    e.preventDefault();

    const hasAnyValue = appCustomColumns.some(col => (newAppRecord[col] || '').trim().length > 0);
    if (!hasAnyValue) {
      alert('Please fill at least one field in the application form.');
      return;
    }

    const appName = newAppRecord['Applicant Name'] || 
                    newAppRecord['applicant_name'] || 
                    newAppRecord['Name'] || 
                    newAppRecord['full_name'] || 
                    'Authorized Applicant';

    const createdApp = {
      ...newAppRecord,
      id: `APP-${currentMinistryCode}-${Date.now().toString().slice(-6)}`,
      scheme_name: newAppRecord.scheme_name || `${currentMinistry?.name || currentMinistryCode} Scheme`,
      applicant_name: appName,
      status: 'PENDING_AI_CHECK',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    if (onApplicationUpload) {
      onApplicationUpload([createdApp]);
    }

    if (onLogAudit) {
      onLogAudit({
        actor: currentUser?.name || `${currentMinistryCode} Officer`,
        portal: `Ministry Portal (${currentMinistryCode})`,
        action: 'SINGLE_APPLICATION_CREATE',
        details: `Created single application for "${appName}" (${createdApp.id}) and forwarded to AI verification queue.`,
        severity: 'SUCCESS'
      });
    }

    alert(`Application #${createdApp.id} for "${appName}" created and submitted to Central AI Queue!`);
    setShowCreateAppModal(false);
    setNewAppRecord({ scheme_name: `${currentMinistry?.name || currentMinistryCode} Welfare Scheme` });
  };

  const handleAddAppColumn = () => {
    const col = newAppColumnInput.trim();
    if (!col) return;
    if (appCustomColumns.includes(col)) {
      alert(`Field "${col}" is already in the application schema.`);
      return;
    }
    setAppCustomColumns([...appCustomColumns, col]);
    setNewAppColumnInput('');
  };

  const handleRemoveAppColumn = (colToRemove) => {
    setAppCustomColumns(appCustomColumns.filter(c => c !== colToRemove));
  };

  // Staff Member Provisioning
  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) return;

    const addedMember = {
      id: `STF-0${staffList.length + 1}`,
      name: newStaff.name,
      role: staffRoleType === 'ADMIN' ? 'Ministry Co-Admin' : 'Data Verification Staff',
      email: newStaff.email,
      status: 'ACTIVE'
    };

    setStaffList([...staffList, addedMember]);
    setShowAddStaffModal(false);
    setNewStaff({ name: '', email: '', role: 'STAFF' });

    if (onLogAudit) {
      onLogAudit({
        actor: currentUser?.name || `${currentMinistryCode} Officer`,
        portal: `Ministry Portal (${currentMinistryCode})`,
        action: staffRoleType === 'ADMIN' ? 'ADD_MINISTRY_ADMIN' : 'ADD_STAFF',
        details: `Provisioned credentials for ${addedMember.role}: ${addedMember.name} (${addedMember.email})`,
        severity: 'INFO'
      });
    }
  };

  const activeDatasetColumns = selectedDataset ? getDatasetColumns(selectedDataset) : [];

  // Filter applications submitted by this ministry
  const ministryApplications = (applications || []).filter(app => {
    if (!app) return false;
    if (app.id && app.id.includes(currentMinistryCode)) return true;
    if (app.scheme_name && app.scheme_name.toLowerCase().includes(currentMinistryCode.toLowerCase())) return true;
    return true; // show all queue items if needed
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* ========================================================= */}
      {/* TOP INSTITUTION HERO HEADER */}
      {/* ========================================================= */}
      <div style={{
        padding: '2rem',
        marginBottom: '2rem',
        border: '2px solid var(--gov-navy)',
        borderLeft: '6px solid var(--gov-teal)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        background: 'var(--gov-navy)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '12px',
            background: 'var(--gov-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.25)',
            boxShadow: '0 4px 15px rgba(15, 118, 110, 0.4)'
          }}>
            <GraduationCap size={34} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.6rem',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {isMinistryAdmin ? 'Institution Admin Tenant' : 'Institution Staff View'}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderRadius: '4px',
                background: 'rgba(15, 118, 110, 0.3)', border: '1px solid var(--gov-teal)',
                color: '#5eead4', fontWeight: 600
              }}>
                <span className="pulse-indicator"></span>
                AICTE APAAR Engine Synced
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderRadius: '4px',
                background: 'rgba(234,242,248,0.15)', border: '1px solid rgba(234,242,248,0.35)',
                color: 'var(--gov-ice)', fontWeight: 600
              }}>
                {ministryDatasets.length} Student Registr{ministryDatasets.length !== 1 ? 'ies' : 'y'} ({totalRecordsCount} Student Records)
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#ffffff' }}>
              {currentMinistry?.name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>
              AICTE Institution Code: <strong className="mono" style={{ color: 'var(--gov-amber)' }}>{currentMinistryCode}</strong> • Logged in as: <strong style={{ color: '#fff' }}>{currentUser?.name || 'Officer'}</strong>
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isMinistryAdmin && (
            <>
              <button
                onClick={() => {
                  setCustomColumns([
                    'Student Name', 'APAAR ID', 'Enrollment No', 'Course', 'Branch', 
                    'Approved Intake', 'Actual Enrolment', 'Supernumerary Seats'
                  ]);
                  setShowCreateModal(true);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--gov-teal)', color: '#fff',
                  border: '1px solid var(--gov-teal)',
                  padding: '0.65rem 1.2rem', borderRadius: 'var(--radius-sm)',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                <FolderPlus size={16} />
                + Create Student Registry
              </button>

              <button
                onClick={() => {
                  setStaffRoleType('STAFF');
                  setShowAddStaffModal(true);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(255,255,255,0.12)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.35)',
                  padding: '0.65rem 1.2rem', borderRadius: 'var(--radius-sm)',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                <UserPlus size={16} />
                Add Staff
              </button>
            </>
          )}

          <button
            onClick={() => downloadMinistryDatasetTemplate(currentMinistryCode)}
            title="Download reference Excel format for student enrollment"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.35)',
              padding: '0.65rem 1.2rem', borderRadius: 'var(--radius-sm)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            <Download size={16} />
            Download Enrollment Template
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* NAVIGATION TABS */}
      {/* ========================================================= */}
      <div className="tabs-header" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'DATASETS' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('DATASETS');
            setSelectedDatasetId(null);
            setStagedRows([]);
          }}
        >
          <Layers size={16} />
          Student Enrolment Registries ({ministryDatasets.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'UPLOAD_APP' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('UPLOAD_APP');
            setSelectedDatasetId(null);
            setStagedRows([]);
          }}
        >
          <FileSpreadsheet size={16} />
          Student Record Ingestion & Quotas ({ministryApplications.length})
        </button>

        {isMinistryAdmin && (
          <button
            className={`tab-btn ${activeTab === 'STAFF' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('STAFF');
              setSelectedDatasetId(null);
              setStagedRows([]);
            }}
          >
            <Users size={16} />
            Institution Staff Directory ({staffList.length})
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* EXCEL UPLOAD SCHEMA PREVIEW (FOR DATASETS) */}
      {/* ========================================================= */}
      {stagedRows.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--border-glow)', background: 'rgba(15, 23, 42, 0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                {uploadIntent === 'UPDATE_EXISTING' ? `Updating Dataset: ${updateTargetDataset?.name}` : 'Creating New Dataset'}
              </span>
              <h2 style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>
                Excel Column Schema & Data Preview
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                File: <strong style={{ color: '#fff' }}>{uploadedFileName}</strong> • <strong>{stagedRows.length}</strong> rows • Detected Columns: <strong>{availableColumns.join(', ')}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setStagedRows([]);
                  setUploadedFileName('');
                  setUpdateTargetDatasetId(null);
                }}
              >
                <X size={16} />
                Cancel / Discard
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCommitStagedExcel}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)' }}
              >
                <CheckCircle2 size={16} />
                {uploadIntent === 'UPDATE_EXISTING' ? 'Confirm & Replace Dataset Records' : 'Save as New Dataset'}
              </button>
            </div>
          </div>

          {uploadIntent === 'CREATE_NEW' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>New Dataset Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. house-no, Northern Census"
                  value={stagedDatasetMeta.name}
                  onChange={(e) => setStagedDatasetMeta({ ...stagedDatasetMeta, name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Description / Batch Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Household registry with house codes"
                  value={stagedDatasetMeta.desc}
                  onChange={(e) => setStagedDatasetMeta({ ...stagedDatasetMeta, desc: e.target.value })}
                />
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            Excel Preview (First 3 Rows):
          </h3>
          <div className="table-container">
            <table className="gov-table">
              <thead>
                <tr>
                  {availableColumns.map(col => <th key={col}>{formatColumnLabel(col)}</th>)}
                </tr>
              </thead>
              <tbody>
                {stagedRows.slice(0, 3).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {availableColumns.map(col => (
                      <td key={col} className="mono">{String(row[col] ?? '—')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: DATASETS REGISTRY (MAIN VIEW) */}
      {/* ========================================================= */}
      {activeTab === 'DATASETS' && stagedRows.length === 0 && (
        <div>
          {selectedDataset ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedDatasetId(null);
                    setShowManualAdd(false);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ArrowLeft size={16} />
                  Back to All Datasets
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {isMinistryAdmin && (
                    <button
                      className="btn-secondary"
                      onClick={() => handleOpenManageColumns(selectedDataset)}
                      style={{ background: 'rgba(234, 179, 8, 0.12)', borderColor: 'rgba(234, 179, 8, 0.35)', color: '#facc15' }}
                      title="Add, remove, or modify columns for this dataset"
                    >
                      <Settings size={16} />
                      ⚙️ Manage Columns ({activeDatasetColumns.length})
                    </button>
                  )}

                  <button
                    className="btn-secondary"
                    onClick={() => handleExportDatasetToExcel(selectedDataset)}
                    style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}
                    title="Export all records in this dataset to Excel"
                  >
                    <Download size={16} />
                    Export to Excel (.xlsx)
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={() => downloadCustomDatasetTemplate(activeDatasetColumns, selectedDataset.name)}
                    style={{ background: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
                    title="Download a blank template containing these exact columns"
                  >
                    <FileSpreadsheet size={16} />
                    Download Blank Template
                  </button>

                  {isMinistryAdmin && (
                    <>
                      <label className="btn-secondary" style={{ cursor: 'pointer', background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.35)', color: '#a5b4fc' }}>
                        <Upload size={16} />
                        Upload Excel to Replace Records
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          style={{ display: 'none' }}
                          onChange={(e) => handleExcelSelected(e.target.files[0], 'UPDATE_EXISTING', selectedDataset.id)}
                        />
                      </label>

                      <button
                        className="btn-primary"
                        onClick={() => {
                          setShowManualAdd(!showManualAdd);
                          setManualRecord({ status: 'ACTIVE' });
                        }}
                      >
                        <Plus size={16} />
                        Write Manual Record
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Dataset Banner */}
              <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem', border: '1px solid var(--border-glow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="mono" style={{ color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: 600 }}>
                        {selectedDataset.id}
                      </span>
                      <span className="badge badge-pass">Active in AI Engine</span>
                      <span className="badge badge-info">{selectedDataset.records?.length || 0} Records</span>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {selectedDataset.name}
                      {isMinistryAdmin && (
                        <button
                          className="btn-icon"
                          title="Rename Dataset"
                          onClick={() => {
                            setRenamingDataset(selectedDataset);
                            setRenameValue(selectedDataset.name);
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 0.75rem 0' }}>
                      {selectedDataset.description || 'No description provided.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Columns / Fields:</span>
                      {activeDatasetColumns.map((col, idx) => (
                        <span key={idx} className="brand-tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', background: 'rgba(99, 102, 241, 0.12)', color: '#c7d2fe' }}>
                          {formatColumnLabel(col)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>Source File: <strong style={{ color: '#fff' }}>{selectedDataset.source || 'Manual Entry'}</strong></div>
                    <div style={{ marginTop: '0.25rem' }}>Last Updated: <strong className="mono" style={{ color: '#fff' }}>{selectedDataset.uploadedAt}</strong></div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC MANUAL RECORD FORM */}
              {showManualAdd && (
                <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem', border: '1px solid var(--border-glow)', background: 'rgba(15, 23, 42, 0.95)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Plus size={18} color="var(--primary-light)" />
                      Add Manual Record to: <span style={{ color: '#fff' }}>{selectedDataset.name}</span>
                    </h3>
                    <button
                      className="btn-icon"
                      onClick={() => setShowManualAdd(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleAddManualRecord}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                      {activeDatasetColumns.map((col, idx) => (
                        <div key={idx} className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontWeight: 600 }}>
                            {formatColumnLabel(col)}
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={`Enter ${formatColumnLabel(col)}...`}
                            value={manualRecord[col] || ''}
                            onChange={(e) => setManualRecord({ ...manualRecord, [col]: e.target.value })}
                          />
                        </div>
                      ))}

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Status</label>
                        <select
                          className="form-select"
                          value={manualRecord.status || 'ACTIVE'}
                          onChange={(e) => setManualRecord({ ...manualRecord, status: e.target.value })}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="VERIFIED">VERIFIED</option>
                          <option value="VALID">VALID</option>
                          <option value="PENDING">PENDING</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setShowManualAdd(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary btn-sm">
                        <Check size={14} />
                        Save Record to {selectedDataset.name}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Records Search Filter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '340px' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Search across ${activeDatasetColumns.map(c => formatColumnLabel(c)).join(', ')}...`}
                    style={{ paddingLeft: '2.5rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Total Records: <strong>{selectedDataset.records?.length || 0}</strong>
                </div>
              </div>

              {/* DYNAMIC RECORDS TABLE */}
              <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <div className="table-container">
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        {activeDatasetColumns.map((col, idx) => (
                          <th key={idx}>{formatColumnLabel(col).toUpperCase()}</th>
                        ))}
                        <th>STATUS</th>
                        {isMinistryAdmin && <th style={{ width: '80px' }}>ACTION</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(!selectedDataset.records || selectedDataset.records.length === 0) ? (
                        <tr>
                          <td colSpan={activeDatasetColumns.length + 3} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                            <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                              <Table size={36} color="var(--primary-light)" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
                              <h4 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 0.5rem 0' }}>Dataset is Currently Empty</h4>
                              <p style={{ fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
                                You have configured columns: <strong>{activeDatasetColumns.map(c => formatColumnLabel(c)).join(', ')}</strong>.
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                                {isMinistryAdmin && (
                                  <button
                                    className="btn-primary btn-sm"
                                    onClick={() => {
                                      setShowManualAdd(true);
                                      setManualRecord({ status: 'ACTIVE' });
                                    }}
                                  >
                                    <Plus size={14} />
                                    Write Manual Record
                                  </button>
                                )}
                                <button
                                  className="btn-secondary btn-sm"
                                  onClick={() => downloadCustomDatasetTemplate(activeDatasetColumns, selectedDataset.name)}
                                >
                                  <Download size={14} />
                                  Download Blank Excel Template
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        selectedDataset.records
                          .filter(r => {
                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase();
                            return Object.values(r).some(val => val && String(val).toLowerCase().includes(q));
                          })
                          .map((rec, idx) => (
                            <tr key={idx}>
                              <td><span className="mono" style={{ color: 'var(--text-muted)' }}>{idx + 1}</span></td>
                              {activeDatasetColumns.map((col, cIdx) => (
                                <td key={cIdx}>
                                  <span style={{ 
                                    fontWeight: cIdx === 0 ? 600 : 400, 
                                    color: cIdx === 0 ? '#fff' : 'var(--text-primary)',
                                    fontFamily: (col.toLowerCase().includes('no') || col.toLowerCase().includes('id') || col.toLowerCase().includes('code')) ? 'var(--font-mono)' : 'inherit'
                                  }}>
                                    {rec[col] !== undefined && rec[col] !== null && String(rec[col]).trim() !== '' ? String(rec[col]) : '—'}
                                  </span>
                                </td>
                              ))}
                              <td>
                                <span className="badge badge-pass">
                                  <span className="pulse-indicator"></span>
                                  {rec.status || 'ACTIVE'}
                                </span>
                              </td>
                              {isMinistryAdmin && (
                                <td>
                                  <button
                                    className="btn-danger btn-sm"
                                    onClick={() => handleDeleteRecord(idx)}
                                    title="Delete Record"
                                    style={{ padding: '0.35rem 0.55rem' }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* DATASETS LIST / CARDS VIEW */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                    Ministry Reference Datasets
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                    Create multiple independent datasets with custom schemas (e.g. <code>house-no</code> with Name, House No, Counthouse).
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isMinistryAdmin && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setCustomColumns(['Name', 'House No', 'Counthouse']);
                        setShowCreateModal(true);
                      }}
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' }}
                    >
                      <FolderPlus size={16} />
                      + Create New Dataset
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Datasets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {ministryDatasets.map((ds) => {
                  const cols = getDatasetColumns(ds);
                  return (
                    <div 
                      key={ds.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '1.5rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        border: '1px solid var(--border-subtle)',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: 'rgba(99, 102, 241, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(99, 102, 241, 0.3)'
                            }}>
                              <FileSpreadsheet size={18} color="var(--primary-light)" />
                            </div>
                            <div>
                              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {ds.id}
                              </span>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                                {ds.name}
                              </h3>
                            </div>
                          </div>

                          <span className="badge badge-pass" style={{ fontSize: '0.72rem' }}>
                            <span className="pulse-indicator"></span>
                            ACTIVE
                          </span>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', minHeight: '38px', margin: '0.5rem 0 0.85rem 0' }}>
                          {ds.description || 'Custom dataset for regulatory verification.'}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          {cols.slice(0, 4).map((c, i) => (
                            <span key={i} className="brand-tag" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                              {formatColumnLabel(c)}
                            </span>
                          ))}
                          {cols.length > 4 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              +{cols.length - 4} more
                            </span>
                          )}
                        </div>

                        <div style={{
                          padding: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.8rem',
                          marginBottom: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Records:</span>
                            <strong style={{ color: '#fff' }}>{ds.records?.length || 0} Records</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Schema:</span>
                            <span style={{ color: '#c7d2fe' }}>{cols.length} Columns Defined</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Last Synced:</span>
                            <span className="mono" style={{ color: 'var(--text-muted)' }}>
                              {ds.uploadedAt || 'Recently'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <button
                            className="btn-primary btn-sm"
                            onClick={() => setSelectedDatasetId(ds.id)}
                            style={{ justifyContent: 'center' }}
                          >
                            <Eye size={14} />
                            View Records
                          </button>

                          <button
                            className="btn-secondary btn-sm"
                            onClick={() => handleExportDatasetToExcel(ds)}
                            style={{ justifyContent: 'center', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}
                            title="Export data to Excel"
                          >
                            <Download size={14} />
                            Save Excel
                          </button>
                        </div>

                        {isMinistryAdmin && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <label 
                              className="btn-secondary btn-sm" 
                              style={{ 
                                flex: 1, 
                                justifyContent: 'center', 
                                cursor: 'pointer',
                                background: 'rgba(99, 102, 241, 0.08)',
                                borderColor: 'rgba(99, 102, 241, 0.25)',
                                color: '#a5b4fc',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title="Upload Excel to update this dataset"
                            >
                              <Upload size={14} />
                              Upload Excel Update
                              <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                style={{ display: 'none' }}
                                onChange={(e) => handleExcelSelected(e.target.files[0], 'UPDATE_EXISTING', ds.id)}
                              />
                            </label>

                            <button
                              className="btn-secondary btn-sm"
                              onClick={() => {
                                setRenamingDataset(ds);
                                setRenameValue(ds.name);
                              }}
                              title="Rename Dataset"
                              style={{ padding: '0 0.6rem' }}
                            >
                              <Edit3 size={14} />
                            </button>

                            {ministryDatasets.length > 1 && (
                              <button
                                className="btn-danger btn-sm"
                                onClick={() => handleDeleteDataset(ds.id, ds.name)}
                                title="Delete Dataset"
                                style={{ padding: '0 0.6rem' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: APPLICATION INGESTION WITH DYNAMIC CUSTOM SCHEMA */}
      {/* ========================================================= */}
      {activeTab === 'UPLOAD_APP' && (
        <div>
          {/* Header Action Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileSpreadsheet size={22} color="var(--primary-light)" />
                Citizen Application Ingestion (Any Format / Custom Schema)
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                Upload Excel in <strong>any format</strong> or manually create applications with custom fields. All columns are dynamically preserved and forwarded to the Central AI Verification Queue.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={() => downloadCustomDatasetTemplate(appCustomColumns, `${currentMinistryCode}_Application_Template`)}
                style={{ background: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
                title="Download blank Excel template matching current application fields"
              >
                <Download size={15} />
                Download Custom Excel Template
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  setNewAppRecord({ scheme_name: `${currentMinistry?.name || currentMinistryCode} Grant Scheme` });
                  setShowCreateAppModal(true);
                }}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)' }}
              >
                <Plus size={16} />
                + Create Single Application
              </button>
            </div>
          </div>

          {/* APPLICATION SCHEMA CUSTOMIZER (Define whatever format the user wants!) */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--border-glow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} color="var(--primary-light)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  Active Application Fields Format ({appCustomColumns.length} fields)
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Add or remove fields to match your department's exact form
              </span>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                onClick={() => setAppCustomColumns(['Applicant Name', 'House No', 'Counthouse', 'Ward', 'State'])}
              >
                🏠 Housing (Name, House No, Counthouse)
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                onClick={() => setAppCustomColumns(['Applicant Name', 'Aadhaar No', 'DOB', 'Father Name', 'State', 'Pin Code'])}
              >
                🪪 Citizen Demographics
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                onClick={() => setAppCustomColumns(['Applicant Name', 'Aadhaar No', 'PAN No', 'Claimed Income', 'State'])}
              >
                💳 Direct Benefit Grant
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                onClick={() => setAppCustomColumns(['Applicant Name', 'Roll No', 'Degree', 'University', 'Annual Income'])}
              >
                🎓 Academic / Scholarship
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', color: 'var(--text-muted)' }}
                onClick={() => setAppCustomColumns([])}
              >
                Clear All
              </button>
            </div>

            {/* Field Tags Display */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-md)',
              minHeight: '48px',
              marginBottom: '0.75rem',
              alignItems: 'center'
            }}>
              {appCustomColumns.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No fields defined yet. Add field names below.
                </span>
              ) : (
                appCustomColumns.map((col, idx) => (
                  <span key={idx} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25))',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    color: '#fff',
                    fontWeight: 600
                  }}>
                    {formatColumnLabel(col)}
                    <button
                      type="button"
                      onClick={() => handleRemoveAppColumn(col)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fda4af',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Field Input */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type custom field name (e.g. House No, Counthouse, Family Code, Land Area)..."
                value={newAppColumnInput}
                onChange={(e) => setNewAppColumnInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAppColumn();
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddAppColumn}
              >
                <Plus size={15} />
                Add Field
              </button>
            </div>
          </div>

          {/* EXCEL BATCH PREVIEW (If a batch file was uploaded) */}
          {stagedAppBatch.length > 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--border-glow)', background: 'rgba(15, 23, 42, 0.95)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="badge badge-info" style={{ marginBottom: '0.35rem', display: 'inline-block' }}>
                    Uploaded Batch Ready
                  </span>
                  <h3 style={{ fontSize: '1.3rem', margin: 0 }}>
                    Detected {stagedAppBatch.length} Applications from: <span style={{ color: '#fff' }}>{stagedAppFileName}</span>
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                    Excel Columns detected: <strong>{stagedAppColumns.join(', ')}</strong> (100% of custom fields are preserved).
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setStagedAppBatch([]);
                      setStagedAppFileName('');
                      setStagedAppColumns([]);
                    }}
                  >
                    <X size={15} />
                    Discard
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleCommitStagedApplications}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)' }}
                  >
                    <CheckCircle2 size={16} />
                    Confirm & Forward Batch to Central AI Queue
                  </button>
                </div>
              </div>

              {/* Staged Table Preview */}
              <div className="table-container">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      {stagedAppColumns.map(c => <th key={c}>{formatColumnLabel(c)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {stagedAppBatch.slice(0, 4).map((row, idx) => (
                      <tr key={idx}>
                        <td><span className="mono">{idx + 1}</span></td>
                        {stagedAppColumns.map(c => (
                          <td key={c} className="mono">
                            {row[c] !== undefined && row[c] !== null ? String(row[c]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* UPLOAD DROPZONE */
            <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem', border: '1px dashed var(--border-glow)', textAlign: 'center' }}>
              <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  border: '1px solid rgba(99, 102, 241, 0.35)'
                }}>
                  <Upload size={32} color="var(--primary-light)" />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                  Upload Application Excel (No Fixed Format Required)
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
                  Upload ANY Excel file (.xlsx, .xls, .csv). Whatever columns are in your file (e.g. <code>Name</code>, <code>House No</code>, <code>Counthouse</code>, <code>Land Details</code>, etc.), our system automatically detects and preserves them completely.
                </p>

                <label className="btn-primary" style={{ cursor: 'pointer', padding: '0.85rem 1.75rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={18} />
                  Choose Application Excel / CSV File
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                    onChange={handleApplicationFileSelect}
                  />
                </label>
              </div>
            </div>
          )}

          {/* SUBMITTED APPLICATIONS QUEUE TABLE */}
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.2rem 0' }}>
                  Active Applications Forwarded by {currentMinistryCode}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', margin: 0 }}>
                  These applications are currently in the Central Admin AI Verification Pipeline.
                </p>
              </div>

              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search applications..."
                  style={{ paddingLeft: '2.4rem' }}
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div className="table-container">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>APPLICATION ID</th>
                      <th>APPLICANT NAME</th>
                      <th>SCHEME</th>
                      <th>CUSTOM FIELDS CAPTURED</th>
                      <th>SUBMITTED AT</th>
                      <th>AI STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ministryApplications.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No applications submitted yet. Click <strong>"+ Create Single Application"</strong> or upload an Excel file above.
                        </td>
                      </tr>
                    ) : (
                      ministryApplications
                        .filter(app => {
                          if (!appSearchQuery) return true;
                          const q = appSearchQuery.toLowerCase();
                          return Object.values(app).some(val => val && String(val).toLowerCase().includes(q));
                        })
                        .map((app, idx) => {
                          // Extract non-standard custom fields
                          const standardKeys = ['id', 'scheme_name', 'applicant_name', 'status', 'submittedAt', 'submitted_at', 'ai_verdict', 'confidence_score'];
                          const customKeys = Object.keys(app).filter(k => !standardKeys.includes(k) && !!app[k]);

                          return (
                            <tr key={idx}>
                              <td><span className="mono">{idx + 1}</span></td>
                              <td><span className="mono" style={{ fontWeight: 600, color: '#fff' }}>{app.id}</span></td>
                              <td><strong>{app.applicant_name}</strong></td>
                              <td><span style={{ color: 'var(--text-secondary)' }}>{app.scheme_name}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  {customKeys.slice(0, 3).map((k, ki) => (
                                    <span key={ki} className="brand-tag" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>
                                      {formatColumnLabel(k)}: {String(app[k]).slice(0, 15)}
                                    </span>
                                  ))}
                                  {customKeys.length > 3 && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      +{customKeys.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td><span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.submittedAt || app.submitted_at || 'Recently'}</span></td>
                              <td>
                                <span className={`badge ${app.status === 'VERIFIED' ? 'badge-pass' : 'badge-info'}`}>
                                  <span className="pulse-indicator"></span>
                                  {app.status || 'PENDING_AI_CHECK'}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn-secondary btn-sm"
                                  onClick={() => setSelectedAppDetail(app)}
                                  title="View all custom application fields"
                                  style={{ padding: '0.35rem 0.65rem' }}
                                >
                                  <Eye size={14} />
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: STAFF & ADMINS DIRECTORY */}
      {/* ========================================================= */}
      {activeTab === 'STAFF' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                Department Staff & Co-Admins
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                Authorized officers registered under {currentMinistryCode} with role-based access control.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setStaffRoleType('STAFF');
                  setShowAddStaffModal(true);
                }}
              >
                <UserPlus size={16} />
                + Add Staff Member
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  setStaffRoleType('ADMIN');
                  setShowAddStaffModal(true);
                }}
              >
                <ShieldCheck size={16} />
                + Add Co-Admin
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div className="table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Officer ID</th>
                    <th>Officer Legal Name</th>
                    <th>Designated Role</th>
                    <th>Government Email</th>
                    <th>Access Permissions</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((stf) => (
                    <tr key={stf.id}>
                      <td><span className="mono">{stf.id}</span></td>
                      <td><strong>{stf.name}</strong></td>
                      <td>
                        <span className={`badge ${stf.role.includes('Admin') ? 'badge-info' : 'badge-neutral'}`}>
                          {stf.role}
                        </span>
                      </td>
                      <td><span className="mono" style={{ color: 'var(--text-secondary)' }}>{stf.email}</span></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {stf.role.includes('Admin') ? 'Full: Create & Settle DB, Upload App' : 'Read-Only: View DB, Upload App'}
                      </td>
                      <td>
                        <span className="badge badge-pass">
                          <span className="pulse-indicator"></span>
                          {stf.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE SINGLE APPLICATION WITH CUSTOM FIELDS */}
      {/* ========================================================= */}
      {showCreateAppModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="var(--primary-light)" />
                Create & Forward Application ({currentMinistryCode})
              </h3>
              <button
                className="btn-icon"
                onClick={() => setShowCreateAppModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Fill in the application data using the active fields configured for your department.
            </p>

            <form onSubmit={handleCreateSingleApplicationSubmit}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Government Scheme / Grant Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Pradhan Mantri Awas Yojana, Subsidy Grant"
                  value={newAppRecord.scheme_name || ''}
                  onChange={(e) => setNewAppRecord({ ...newAppRecord, scheme_name: e.target.value })}
                  required
                />
              </div>

              {/* Dynamic Field Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {appCustomColumns.map((col, idx) => (
                  <div key={idx} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      {formatColumnLabel(col)}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Enter ${formatColumnLabel(col)}...`}
                      value={newAppRecord[col] || ''}
                      onChange={(e) => setNewAppRecord({ ...newAppRecord, [col]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateAppModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)' }}
                >
                  <Send size={15} />
                  Submit Application to AI Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INSPECT SUBMITTED APPLICATION & REAL DATABASE CHECK */}
      {/* ========================================================= */}
      {selectedAppDetail && (
        <div className="modal-overlay" onClick={() => setSelectedAppDetail(null)}>
          <div className="modal-content" style={{ maxWidth: '680px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span className="mono" style={{ color: 'var(--gov-navy)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {selectedAppDetail.id}
                  </span>
                  <span className={`badge ${selectedAppDetail.status === 'VERIFIED' ? 'badge-pass' : selectedAppDetail.status === 'FLAGGED' ? 'badge-fail' : 'badge-info'}`}>
                    <span className="live-dot" style={{ width: '6px', height: '6px', background: selectedAppDetail.status === 'VERIFIED' ? '#10b981' : '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
                    {selectedAppDetail.status || 'PENDING_AI_CHECK'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--gov-navy)' }}>
                  {selectedAppDetail.applicant_name}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Forwarded via <strong>{currentMinistryCode} Ministry Tenant</strong> • Scheme: {selectedAppDetail.scheme_name}
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={() => setSelectedAppDetail(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* SECTION 1: APPLICATION PARTICULARS (High Contrast, Deduplicated) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={15} color="var(--gov-teal)" />
                Submitted Application Particulars
              </div>

              <div style={{
                padding: '1rem 1.25rem',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '0.75rem'
              }}>
                {getCleanAppEntries(selectedAppDetail).map((entry, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid rgba(18,59,93,0.06)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
                      {entry.label}:
                    </span>
                    <strong style={{
                      color: 'var(--gov-navy)',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      background: 'var(--gov-ice)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(18, 59, 93, 0.15)',
                      textAlign: 'right',
                      maxWidth: '240px',
                      wordBreak: 'break-word'
                    }}>
                      {entry.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: REAL DATABASE CROSS-CHECK ENGINE */}
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #10b981',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={18} color="#047857" />
                  <strong style={{ fontSize: '0.95rem', color: '#065f46' }}>
                    Autonomous Sovereign Database Verification Check
                  </strong>
                </div>

                {selectedAppDetail.status === 'VERIFIED' && (
                  <span className="live-badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.72rem' }}>
                    ✓ CONFIRMED IN MASTER REGISTRY
                  </span>
                )}
                {selectedAppDetail.status === 'FLAGGED' && (
                  <span className="live-badge" style={{ background: '#ef4444', color: '#fff', fontSize: '0.72rem' }}>
                    ✕ NOT LOCATED IN DATABASE
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.82rem', color: '#065f46', margin: '0 0 1rem 0' }}>
                Cross-checks applicant identity, token authenticity, and compliance against <strong>UIDAI Biometrics</strong>, <strong>CBDT Direct Tax Core</strong>, and <strong>Department Domicile</strong> records.
              </p>

              {/* Action Button: Run Real Check */}
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleRunModalDatabaseCheck(selectedAppDetail)}
                disabled={isCheckingDb}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                  border: 'none',
                  cursor: isCheckingDb ? 'not-allowed' : 'pointer'
                }}
              >
                {isCheckingDb ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    {inspectStepMessage || 'Querying Sovereign Databases...'}
                  </>
                ) : (
                  <>
                    <Cpu size={16} />
                    ⚡ Run Real Database Verification Check Now
                  </>
                )}
              </button>

              {/* Real Database Evidence Table (If check executed or report available) */}
              {(inspectCheckResult || selectedAppDetail.verification_report) && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46', marginBottom: '0.5rem' }}>
                    📊 Real-Time Database Query Findings:
                  </div>

                  <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', overflow: 'hidden' }}>
                    <table className="gov-table" style={{ fontSize: '0.78rem', margin: 0 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th>DATABASE REGISTRY</th>
                          <th>SUBMITTED VALUE</th>
                          <th>DATABASE RECORD</th>
                          <th>CONFIDENCE</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((inspectCheckResult || selectedAppDetail.verification_report).evidenceLogs || []).map((ev, ei) => (
                          <tr key={ei}>
                            <td>
                              <strong style={{ color: 'var(--gov-navy)' }}>{ev.owningMinistry || ev.sourceDatasetId}</strong>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ev.field}</div>
                            </td>
                            <td><span className="mono">{ev.submittedValue}</span></td>
                            <td>
                              <span className="mono" style={{ color: ev.status === 'PASSED' ? '#047857' : '#b91c1c', fontWeight: 600 }}>
                                {ev.referenceValue}
                              </span>
                            </td>
                            <td>
                              <strong>{ev.matchConfidence || 0}%</strong>
                            </td>
                            <td>
                              <span className={`badge ${ev.status === 'PASSED' ? 'badge-pass' : ev.status === 'MISMATCH_DETECTED' ? 'badge-fail' : 'badge-review'}`}>
                                {ev.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Metric */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.82rem', color: '#065f46' }}>
                      Overall Verdict: <strong>{(inspectCheckResult || selectedAppDetail.verification_report).overallVerdict}</strong> • Match Confidence: <strong>{(inspectCheckResult || selectedAppDetail.verification_report).confidenceScore}%</strong>
                    </div>

                    {/* Quick 1-click test helper if citizen is not in UIDAI */}
                    {((inspectCheckResult || selectedAppDetail.verification_report).evidenceLogs || []).some(e => e.status === 'NO_MATCHING_RECORD') && (
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => handleRegisterCitizenInUIDAI(selectedAppDetail.applicant_name)}
                        style={{
                          background: '#fff',
                          border: '1px solid #10b981',
                          color: '#047857',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.75rem'
                        }}
                        title="Simulate registering this applicant into the UIDAI Master Database and verify 100% match"
                      >
                        ➕ Register "{selectedAppDetail.applicant_name}" into UIDAI Database (Test Match)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedAppDetail(null)}
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE NEW DATASET */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderPlus size={22} color="var(--primary-light)" />
                Create New Dataset with Custom Fields
              </h3>
              <button
                className="btn-icon"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Define the dataset name and choose exactly what data fields you want in it (e.g. <strong>Name, House No, Counthouse</strong>).
            </p>

            <form onSubmit={handleCreateEmptyDataset}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Dataset Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. house-no, Housing Census Batch 1"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Purpose</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. here we get a house code of members"
                  value={newDatasetDesc}
                  onChange={(e) => setNewDatasetDesc(e.target.value)}
                />
              </div>

              {/* CUSTOM SCHEMA / COLUMNS BUILDER */}
              <div style={{
                padding: '1.25rem',
                background: 'rgba(99, 102, 241, 0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c7d2fe' }}>
                    <Sliders size={16} color="var(--primary-light)" />
                    Define Fields / Columns in this Dataset ({customColumns.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomColumns([])}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                </div>

                {/* Preset Buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                    onClick={() => setCustomColumns(['Name', 'House No', 'Counthouse', 'Ward'])}
                  >
                    🏠 Housing (Name, House No, Counthouse)
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                    onClick={() => setCustomColumns(['Aadhaar No', 'Full Name', 'DOB', 'State'])}
                  >
                    🪪 Identity
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                    onClick={() => setCustomColumns(['PAN No', 'Full Name', 'Income Slab', 'ITR Status'])}
                  >
                    💳 Tax
                  </button>
                </div>

                {/* Column Tags Display */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  minHeight: '48px',
                  marginBottom: '0.75rem',
                  alignItems: 'center'
                }}>
                  {customColumns.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No fields added yet. Type a field name below and click Add Field.
                    </span>
                  ) : (
                    customColumns.map((col, idx) => (
                      <span key={idx} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25))',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        color: '#fff',
                        fontWeight: 600
                      }}>
                        {formatColumnLabel(col)}
                        <button
                          type="button"
                          onClick={() => handleRemoveColumnFromNewDataset(col)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fda4af',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0
                          }}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Input to Add More Fields */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type custom field name (e.g. House No, Area Code, Family Head)..."
                    value={newColumnInput}
                    onChange={(e) => setNewColumnInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddColumnToNewDataset();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddColumnToNewDataset}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Plus size={15} />
                    Add Field
                  </button>
                </div>
              </div>

              {/* Option B: Upload Excel directly */}
              <div style={{
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                  Or upload an Excel file directly (columns will be auto-detected):
                </p>
                <label className="btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={14} />
                  Choose Excel File to Import
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setShowCreateModal(false);
                        setStagedDatasetMeta({
                          name: newDatasetName.trim() || e.target.files[0].name.replace(/\.[^/.]+$/, ''),
                          desc: newDatasetDesc.trim()
                        });
                        handleExcelSelected(e.target.files[0], 'CREATE_NEW', null);
                      }
                    }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Dataset with these Fields
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANAGE SCHEMA / COLUMNS ON EXISTING DATASET */}
      {/* ========================================================= */}
      {showManageColumnsModal && selectedDataset && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={20} color="var(--primary-light)" />
                Manage Columns for: {selectedDataset.name}
              </h3>
              <button
                className="btn-icon"
                onClick={() => setShowManageColumnsModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Add or remove fields for this dataset. This will dynamically update the Manual Record entry form and table headers.
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-md)',
              minHeight: '60px',
              marginBottom: '1rem',
              alignItems: 'center'
            }}>
              {editingDatasetColumns.map((col, idx) => (
                <span key={idx} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25))',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  color: '#fff',
                  fontWeight: 600
                }}>
                  {formatColumnLabel(col)}
                  <button
                    type="button"
                    onClick={() => setEditingDatasetColumns(editingDatasetColumns.filter(c => c !== col))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fda4af',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add new field (e.g. House No, Counthouse, Family Code)..."
                value={manageColumnInput}
                onChange={(e) => setManageColumnInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColumnToExisting();
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddColumnToExisting}
              >
                <Plus size={15} />
                Add Field
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowManageColumnsModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveEditedColumns}
              >
                Save Column Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RENAME DATASET */}
      {/* ========================================================= */}
      {renamingDataset && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit3 size={18} color="var(--primary-light)" />
              Rename Dataset
            </h3>
            <div className="form-group">
              <label className="form-label">New Dataset Name</label>
              <input
                type="text"
                className="form-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn-secondary btn-sm" onClick={() => setRenamingDataset(null)}>
                Cancel
              </button>
              <button className="btn-primary btn-sm" onClick={handleConfirmRename}>
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD STAFF / CO-ADMIN */}
      {/* ========================================================= */}
      {showAddStaffModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {staffRoleType === 'ADMIN' ? 'Provision Ministry Co-Admin' : 'Add Ministry Staff Member'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {staffRoleType === 'ADMIN'
                ? 'Co-Admins can manage datasets, upload Excel files, and write records.'
                : 'Staff members have read-only access to datasets and can upload applications.'}
            </p>

            <form onSubmit={handleAddStaffSubmit}>
              <div className="form-group">
                <label className="form-label">Full Legal Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Chandra"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Government Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder={`officer@${currentMinistryCode.toLowerCase()}.gov.in`}
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddStaffModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Provision Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
