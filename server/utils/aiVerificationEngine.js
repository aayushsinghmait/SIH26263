// Autonomous Regulatory Compliance and Cross-Ministry Verification Engine (Node.js)

export function calculateSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const str1 = String(s1).trim().toLowerCase();
  const str2 = String(s2).trim().toLowerCase();

  if (str1 === str2) return 100;

  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = track[str2.length][str1.length];
  const maxLen = Math.max(str1.length, str2.length);
  const similarity = Math.round(((maxLen - distance) / maxLen) * 100);
  return Math.max(0, similarity);
}

export function maskAadhaar(aadhaar) {
  if (!aadhaar) return 'N/A';
  const clean = String(aadhaar).replace(/[^0-9]/g, '');
  if (clean.length >= 12) {
    return `XXXX-XXXX-${clean.slice(-4)}`;
  }
  return String(aadhaar);
}

export function maskPAN(pan) {
  if (!pan) return 'N/A';
  const str = String(pan).trim();
  if (str.length === 10) {
    return `${str.slice(0, 5)}****${str.slice(-1)}`;
  }
  return str;
}

export function generateVerificationPlan(app, datasetRegistry = [], complianceRules = []) {
  const fieldsToValidate = [];
  const selectedDatasets = [];
  const legalBasis = [];

  const addField = (field, priority, statute) => {
    fieldsToValidate.push({ field, priority, statute });
  };

  const cleanApp = {};
  for (const [k, v] of Object.entries(app)) {
    if (v !== undefined && v !== null && String(v).trim().length > 0) {
      cleanApp[k.toLowerCase().replace(/[^a-z0-9]/g, '_')] = String(v).trim();
    }
  }

  // Identity: Aadhaar
  if (cleanApp.aadhaar_no || cleanApp.aadhaar || cleanApp.uid) {
    addField('Aadhaar Demographics & Biometrics', 'CRITICAL', 'Aadhaar Act 2016 §7');
    const uidaiDS = datasetRegistry.find(d => d.ministryCode === 'UIDAI' || d.category === 'IDENTITY');
    if (uidaiDS) {
      selectedDatasets.push({
        datasetId: uidaiDS.datasetId,
        name: uidaiDS.name,
        ministry: uidaiDS.owningMinistry,
        searchKey: 'aadhaar_no',
        sharingActive: uidaiDS.sharingAgreementActive,
        rationale: 'Primary statutory citizen identity verification.'
      });
    }
  }

  // Tax & Financial: PAN
  if (cleanApp.pan_no || cleanApp.pan || cleanApp.claimed_income) {
    addField('PAN Legitimacy & Income Ceiling', 'CRITICAL', 'Income Tax Act 1961 §139AA');
    const cbdtDS = datasetRegistry.find(d => d.ministryCode === 'CBDT' || d.category === 'TAXATION');
    if (cbdtDS) {
      selectedDatasets.push({
        datasetId: cbdtDS.datasetId,
        name: cbdtDS.name,
        ministry: cbdtDS.owningMinistry,
        searchKey: 'pan_no',
        sharingActive: cbdtDS.sharingAgreementActive,
        rationale: 'Validation of PAN-Aadhaar linkage & income return compliance.'
      });
    }
  }

  // Education: Roll No
  if (cleanApp.education_roll || cleanApp.roll_no || cleanApp.degree) {
    addField('Academic Credential Authenticity', 'HIGH', 'NAD DigiLocker Regulatory Mandate 2020');
    const moeDS = datasetRegistry.find(d => d.ministryCode === 'MoE' || d.category === 'EDUCATION');
    if (moeDS) {
      selectedDatasets.push({
        datasetId: moeDS.datasetId,
        name: moeDS.name,
        ministry: moeDS.owningMinistry,
        searchKey: 'roll_no',
        sharingActive: moeDS.sharingAgreementActive,
        rationale: 'Verifies degree authenticity and student name match in National Academic Depository.'
      });
    }
  }

  // Automatic Expansion Check: Check for high income (> 10L) -> MCA directorship scan
  const incomeStr = cleanApp.claimed_income || '0';
  const parsedIncome = parseInt(incomeStr.replace(/[^0-9]/g, ''), 10) || 0;
  if (parsedIncome >= 1000000) {
    addField('Corporate Directorship Conflict Scan', 'MEDIUM', 'Companies Act 2013 §164 & §166');
    const mcaDS = datasetRegistry.find(d => d.ministryCode === 'MCA' || d.category === 'CORPORATE');
    if (mcaDS) {
      selectedDatasets.push({
        datasetId: mcaDS.datasetId,
        name: mcaDS.name,
        ministry: mcaDS.owningMinistry,
        searchKey: 'director_name',
        sharingActive: mcaDS.sharingAgreementActive,
        rationale: 'Declared income >= ₹10L automatically triggers corporate directorship conflict analysis.'
      });
    }
  }

  return {
    applicationId: app.id,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    fieldsToValidate,
    selectedDatasets,
    applicableRules: complianceRules.filter(r => r.active),
    planStatus: selectedDatasets.every(d => d.sharingActive) ? 'APPROVED_FOR_EXECUTION' : 'PERMISSIONS_REQUIRED'
  };
}

export function executeDynamicVerification(app, plan, datasets = []) {
  const evidenceLogs = [];
  let totalScore = 0;
  let checksCount = 0;
  let hasCriticalMismatch = false;

  // Flatten datasets records map by ministryCode
  const dbMap = {};
  for (const ds of datasets) {
    dbMap[ds.ministryCode] = ds.records || [];
  }

  const appName = app.applicant_name || app.Applicant_Name || app.name || '';
  const appAadhaar = String(app.aadhaar_no || app.Aadhaar_No || '').replace(/[^0-9]/g, '');
  const appPAN = String(app.pan_no || app.PAN_No || '').trim().toUpperCase();
  const appRoll = String(app.education_roll || app.Roll_No || '').trim();

  // 1. UIDAI Cross-check
  if (appAadhaar) {
    checksCount++;
    const uidaiRecords = dbMap['UIDAI'] || [];
    const matchedRecord = uidaiRecords.find(r => 
      String(r.aadhaar_no || '').replace(/[^0-9]/g, '') === appAadhaar
    );

    if (!matchedRecord) {
      hasCriticalMismatch = true;
      evidenceLogs.push({
        field: 'Aadhaar Demographic Token',
        verificationType: 'STATUTORY_IDENTITY',
        sourceDatasetId: 'DS-UIDAI-AADHAAR',
        owningMinistry: 'UIDAI (MeitY)',
        submittedValue: maskAadhaar(appAadhaar),
        referenceValue: 'NO_MATCHING_RECORD',
        matchConfidence: 0,
        status: 'MISMATCH_DETECTED',
        sourceFreshness: '2026-10-23 18:30:00',
        adapterType: 'GOV_SECURE_API_ADAPTER',
        requiredReviewerAction: 'Issue Statutory Identity Notice to applicant; freeze processing.'
      });
    } else {
      const nameSim = calculateSimilarity(appName, matchedRecord.full_name);
      const dobMatch = !app.dob || !matchedRecord.dob || app.dob === matchedRecord.dob;
      const confidence = dobMatch ? nameSim : Math.max(30, nameSim - 30);
      totalScore += confidence;

      const isMismatch = confidence < 75;
      if (isMismatch) hasCriticalMismatch = true;

      evidenceLogs.push({
        field: 'Aadhaar Full Name & DOB',
        verificationType: 'STATUTORY_IDENTITY',
        sourceDatasetId: 'DS-UIDAI-AADHAAR',
        owningMinistry: 'UIDAI (MeitY)',
        submittedValue: `${appName} (${app.dob || 'N/A'})`,
        referenceValue: `${matchedRecord.full_name} (${matchedRecord.dob || 'N/A'})`,
        matchConfidence: confidence,
        status: confidence >= 90 ? 'PASSED' : confidence >= 75 ? 'MANUAL_REVIEW_REQUIRED' : 'MISMATCH_DETECTED',
        sourceFreshness: '2026-10-23 18:30:00',
        adapterType: 'GOV_SECURE_API_ADAPTER',
        requiredReviewerAction: confidence >= 90 ? 'No action needed.' : 'Phonetic name variance detected. Verify gazette notification.'
      });
    }
  } else if (appName && appName !== 'Applicant') {
    checksCount++;
    const uidaiRecords = dbMap['UIDAI'] || [];
    let nameMatch = null;
    let highestSim = 0;

    for (const rec of uidaiRecords) {
      const recName = rec.full_name || rec.name;
      if (recName) {
        const sim = calculateSimilarity(appName, recName);
        if (sim > highestSim) {
          highestSim = sim;
          if (sim >= 75) nameMatch = rec;
        }
      }
    }

    if (nameMatch) {
      totalScore += highestSim;
      evidenceLogs.push({
        field: 'Applicant Legal Name (UIDAI Registry)',
        verificationType: 'STATUTORY_IDENTITY',
        sourceDatasetId: 'DS-UIDAI-AADHAAR',
        owningMinistry: 'UIDAI (MeitY)',
        submittedValue: appName,
        referenceValue: `${nameMatch.full_name} [Aadhaar: ${maskAadhaar(nameMatch.aadhaar_no)}]`,
        matchConfidence: highestSim,
        status: highestSim >= 85 ? 'PASSED' : 'MANUAL_REVIEW_REQUIRED',
        sourceFreshness: '2026-10-23 18:30:00',
        adapterType: 'GOV_SECURE_API_ADAPTER',
        requiredReviewerAction: 'Identity confirmed against central citizen registry.'
      });
    } else {
      hasCriticalMismatch = true;
      evidenceLogs.push({
        field: 'Applicant Legal Name (UIDAI Registry)',
        verificationType: 'STATUTORY_IDENTITY',
        sourceDatasetId: 'DS-UIDAI-AADHAAR',
        owningMinistry: 'UIDAI (MeitY)',
        submittedValue: appName,
        referenceValue: 'NO_RECORD_FOUND',
        matchConfidence: 0,
        status: 'NO_MATCHING_RECORD',
        sourceFreshness: '2026-10-23 18:30:00',
        adapterType: 'GOV_SECURE_API_ADAPTER',
        requiredReviewerAction: `Citizen "${appName}" was not located in UIDAI National Demographic Registry. Official identity document required.`
      });
    }
  }

  // 2. CBDT PAN Cross-check
  if (appPAN) {
    checksCount++;
    const cbdtRecords = dbMap['CBDT'] || [];
    const matchedRecord = cbdtRecords.find(r => 
      String(r.pan_no || '').trim().toUpperCase() === appPAN
    );

    if (!matchedRecord) {
      hasCriticalMismatch = true;
      evidenceLogs.push({
        field: 'CBDT Permanent Account Number (PAN)',
        verificationType: 'STATUTORY_TAXATION',
        sourceDatasetId: 'DS-CBDT-PAN',
        owningMinistry: 'Central Board of Direct Taxes',
        submittedValue: maskPAN(appPAN),
        referenceValue: 'NO_MATCHING_RECORD',
        matchConfidence: 0,
        status: 'NO_MATCHING_RECORD',
        sourceFreshness: '2026-10-23 17:15:00',
        adapterType: 'GOV_SECURE_API_ADAPTER',
        requiredReviewerAction: 'Verify physical PAN card upload in applicant file.'
      });
      // Unrecorded PAN in database receives 0 points
    } else {
      const nameSim = calculateSimilarity(appName, matchedRecord.full_name);
      totalScore += nameSim;

      evidenceLogs.push({
        field: 'PAN Demographic & Linkage',
        verificationType: 'STATUTORY_TAXATION',
        sourceDatasetId: 'DS-CBDT-PAN',
        owningMinistry: 'Central Board of Direct Taxes',
        submittedValue: `${maskPAN(appPAN)} - ${appName}`,
        referenceValue: `${matchedRecord.pan_no} - ${matchedRecord.full_name} (ITR: ${matchedRecord.itr_status || 'FILED'})`,
        matchConfidence: nameSim,
        status: nameSim >= 85 ? 'PASSED' : 'MANUAL_REVIEW_REQUIRED',
        sourceFreshness: '2026-10-23 17:15:00',
        adapterType: 'GOV_SECURE_API_ADAPTER',
        requiredReviewerAction: nameSim >= 85 ? 'No action needed.' : 'Review discrepancy with IT department records.'
      });
    }
  } else if (appName && appName !== 'Applicant') {
    checksCount++;
    const cbdtRecords = dbMap['CBDT'] || [];
    let panMatch = null;
    let highestSim = 0;

    for (const rec of cbdtRecords) {
      const recName = rec.full_name || rec.name;
      if (recName) {
        const sim = calculateSimilarity(appName, recName);
        if (sim > highestSim) {
          highestSim = sim;
          if (sim >= 75) panMatch = rec;
        }
      }
    }

    if (panMatch) {
      totalScore += highestSim;
      evidenceLogs.push({
        field: 'Taxpayer Name (CBDT Registry)',
        verificationType: 'STATUTORY_TAXATION',
        sourceDatasetId: 'DS-CBDT-PAN',
        owningMinistry: 'Central Board of Direct Taxes',
        submittedValue: appName,
        referenceValue: `${panMatch.full_name} [PAN: ${maskPAN(panMatch.pan_no)}]`,
        matchConfidence: highestSim,
        status: highestSim >= 80 ? 'PASSED' : 'MANUAL_REVIEW_REQUIRED',
        sourceFreshness: '2026-10-23 17:15:00',
        adapterType: 'GOV_SECURE_API_ADAPTER',
        requiredReviewerAction: 'Direct tax profile located in CBDT registry.'
      });
    } else {
      evidenceLogs.push({
        field: 'Taxpayer Name (CBDT Registry)',
        verificationType: 'STATUTORY_TAXATION',
        sourceDatasetId: 'DS-CBDT-PAN',
        owningMinistry: 'Central Board of Direct Taxes',
        submittedValue: appName,
        referenceValue: 'NO_TAX_RECORD',
        matchConfidence: 0,
        status: 'NO_MATCHING_RECORD',
        sourceFreshness: '2026-10-23 17:15:00',
        adapterType: 'GOV_SECURE_API_ADAPTER',
        requiredReviewerAction: `No direct tax profile found for "${appName}" in CBDT registry.`
      });
    }
  }

  // 3. House / Residence Domicile Check (if present in application)
  const appHouse = String(app['House No'] || app.house_no || app.House_No || app.Counthouse || app.counthouse || '').trim();
  if (appHouse) {
    checksCount++;
    let foundHouseRecord = null;
    let houseMinistry = 'Municipal Authority';

    for (const ds of datasets) {
      const records = ds.records || [];
      for (const r of records) {
        const rHouse = r.house_no || r.house || r['House No'] || r.counthouse;
        const rName = r.full_name || r.name;
        if (rHouse && (String(rHouse).trim().toLowerCase() === appHouse.toLowerCase() || (rName && calculateSimilarity(rName, appName) >= 80))) {
          foundHouseRecord = r;
          houseMinistry = ds.owningMinistry || ds.name;
          break;
        }
      }
      if (foundHouseRecord) break;
    }

    if (foundHouseRecord) {
      totalScore += 100;
      evidenceLogs.push({
        field: 'Residence / House Code (Municipal Registry)',
        verificationType: 'RESIDENCE_AUTHENTICATION',
        sourceDatasetId: 'DS-HOUSING-LEDGER',
        owningMinistry: houseMinistry,
        submittedValue: appHouse,
        referenceValue: `${appHouse} (RECORDED_IN_LEDGER)`,
        matchConfidence: 100,
        status: 'PASSED',
        sourceFreshness: '2026-10-24 Real-time',
        adapterType: 'HOUSING_DATASET_ADAPTER',
        requiredReviewerAction: 'Residence code authenticated in municipal ledger.'
      });
    } else {
      evidenceLogs.push({
        field: 'Residence / House Code (Municipal Registry)',
        verificationType: 'RESIDENCE_AUTHENTICATION',
        sourceDatasetId: 'DS-HOUSING-LEDGER',
        owningMinistry: 'Municipal & Domicile Authority',
        submittedValue: appHouse,
        referenceValue: 'NO_RESIDENCE_RECORD_FOUND',
        matchConfidence: 0,
        status: 'NO_MATCHING_RECORD',
        sourceFreshness: '2026-10-24 Real-time',
        adapterType: 'HOUSING_DATASET_ADAPTER',
        requiredReviewerAction: `Residence code "${appHouse}" was not found in any municipal or domicile database.`
      });
    }
  }

  // 4. MoE NAD Academic Credential Check
  if (appRoll) {
    checksCount++;
    const moeRecords = dbMap['MoE'] || [];
    const matched = moeRecords.find(r => 
      String(r.roll_no || '').trim().toUpperCase() === appRoll.toUpperCase()
    );

    if (matched) {
      const nameSim = calculateSimilarity(appName, matched.student_name);
      totalScore += nameSim;
      evidenceLogs.push({
        field: 'National Academic Depository (NAD)',
        verificationType: 'CREDENTIAL_AUTHENTICITY',
        sourceDatasetId: 'DS-MOE-NAD',
        owningMinistry: 'Ministry of Education (NAD)',
        submittedValue: `Roll: ${appRoll}`,
        referenceValue: `${matched.degree} - ${matched.university} (${matched.passing_year})`,
        matchConfidence: nameSim,
        status: nameSim >= 80 ? 'PASSED' : 'MANUAL_REVIEW_REQUIRED',
        sourceFreshness: '2026-10-23 16:45:00',
        adapterType: 'DIGILOCKER_NAD_ADAPTER',
        requiredReviewerAction: nameSim >= 80 ? 'No action required.' : 'Verify university name variation.'
      });
    } else {
      hasCriticalMismatch = true;
      evidenceLogs.push({
        field: 'National Academic Depository (NAD)',
        verificationType: 'CREDENTIAL_AUTHENTICITY',
        sourceDatasetId: 'DS-MOE-NAD',
        owningMinistry: 'Ministry of Education (NAD)',
        submittedValue: `Roll: ${appRoll}`,
        referenceValue: 'NO_RECORD_FOUND',
        matchConfidence: 0,
        status: 'NO_MATCHING_RECORD',
        sourceFreshness: '2026-10-23 16:45:00',
        adapterType: 'DIGILOCKER_NAD_ADAPTER',
        requiredReviewerAction: 'Roll number not found in academic depository.'
      });
    }
  }

  const confidenceScore = checksCount > 0 ? Math.round(totalScore / checksCount) : 0;

  let overallVerdict = 'PASSED';
  if (hasCriticalMismatch || confidenceScore < 50) {
    overallVerdict = 'MISMATCH_DETECTED';
  } else if (confidenceScore < 85) {
    overallVerdict = 'MANUAL_REVIEW_REQUIRED';
  }

  return {
    applicationId: app.id,
    overallVerdict,
    confidenceScore,
    evidenceLogs,
    verifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
}
