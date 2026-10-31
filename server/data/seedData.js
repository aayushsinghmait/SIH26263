// Seed data for GovVerify AI MERN Stack Backend

export const SEED_MINISTRIES = [
  {
    id: 'min-uidai',
    code: 'UIDAI',
    name: 'Unique Identification Authority of India (MeitY)',
    category: 'Identity & Biometrics',
    icon: 'ShieldCheck',
    adminEmail: 'admin@uidai.gov.in',
    status: 'ACTIVE',
    recordsCount: 4,
    lastSync: '2026-10-23 18:30:00'
  },
  {
    id: 'min-cbdt',
    code: 'CBDT',
    name: 'Central Board of Direct Taxes (Ministry of Finance)',
    category: 'Taxation & Financial Integrity',
    icon: 'CreditCard',
    adminEmail: 'compliance@incometax.gov.in',
    status: 'ACTIVE',
    recordsCount: 4,
    lastSync: '2026-10-23 17:15:00'
  },
  {
    id: 'min-moe',
    code: 'MoE',
    name: 'Ministry of Education (NAD / DigiLocker Registry)',
    category: 'Educational Credentials',
    icon: 'GraduationCap',
    adminEmail: 'verify@nad.gov.in',
    status: 'ACTIVE',
    recordsCount: 3,
    lastSync: '2026-10-23 16:45:00'
  },
  {
    id: 'min-mca',
    code: 'MCA',
    name: 'Ministry of Corporate Affairs',
    category: 'Corporate Registry & DIN',
    icon: 'Briefcase',
    adminEmail: 'registrar@mca.gov.in',
    status: 'ACTIVE',
    recordsCount: 2,
    lastSync: '2026-10-23 14:00:00'
  }
];

export const SEED_DATASETS = [
  {
    datasetId: 'DS-UIDAI-AADHAAR',
    name: 'National Aadhaar Demographic & Biometric Registry',
    owningMinistry: 'Unique Identification Authority of India (MeitY)',
    ministryCode: 'UIDAI',
    category: 'IDENTITY',
    sensitivity: 'RESTRICTED',
    purpose: 'Statutory citizen identity and demographic verification under Aadhaar Act 2016.',
    supportedSearchKeys: ['aadhaar_no'],
    sharingAgreementActive: true,
    permittedUseCases: ['IDENTITY_VERIFICATION', 'CITIZEN_GRANT_VALIDATION', 'BENEFICIARY_AUTHENTICATION'],
    availableFields: [
      { field: 'aadhaar_no', type: 'STRING', description: '12-digit UID token' },
      { field: 'full_name', type: 'STRING', description: 'Legal name in official records' },
      { field: 'dob', type: 'DATE', description: 'Date of birth (YYYY-MM-DD)' },
      { field: 'gender', type: 'STRING', description: 'Gender identity' },
      { field: 'father_name', type: 'STRING', description: 'Father / Guardian legal name' },
      { field: 'state', type: 'STRING', description: 'Registered domicile state' },
      { field: 'pin_code', type: 'STRING', description: 'Postal area PIN code' },
      { field: 'biometric_status', type: 'ENUM', description: 'Biometric capture verification status' }
    ],
    records: [
      {
        aadhaar_no: '9876-5432-1098',
        full_name: 'Rajesh Kumar Sharma',
        dob: '1995-04-12',
        gender: 'Male',
        father_name: 'Harish Chandra Sharma',
        state: 'Uttar Pradesh',
        pin_code: '201301',
        biometric_status: 'AUTHENTICATED'
      },
      {
        aadhaar_no: '2345-6789-0123',
        full_name: 'Ananya Roy',
        dob: '1998-11-20',
        gender: 'Female',
        father_name: 'Subhash Roy',
        state: 'West Bengal',
        pin_code: '700019',
        biometric_status: 'AUTHENTICATED'
      },
      {
        aadhaar_no: '4455-6677-8899',
        full_name: 'Vikram Singh',
        dob: '1993-06-10',
        gender: 'Male',
        father_name: 'Baldev Singh',
        state: 'Rajasthan',
        pin_code: '302001',
        biometric_status: 'AUTHENTICATED'
      },
      {
        aadhaar_no: '5544-3322-1100',
        full_name: 'Priya Sharma',
        dob: '1996-02-14',
        gender: 'Female',
        father_name: 'Mahesh Sharma',
        state: 'Delhi',
        pin_code: '110001',
        biometric_status: 'AUTHENTICATED'
      }
    ]
  },
  {
    datasetId: 'DS-CBDT-PAN',
    name: 'CBDT PAN & Income Tax Returns Registry',
    owningMinistry: 'Central Board of Direct Taxes (Ministry of Finance)',
    ministryCode: 'CBDT',
    category: 'TAXATION',
    sensitivity: 'CONFIDENTIAL',
    purpose: 'Income validation, tax compliance, and financial integrity auditing.',
    supportedSearchKeys: ['pan_no', 'aadhaar_linked'],
    sharingAgreementActive: true,
    permittedUseCases: ['INCOME_VERIFICATION', 'DIRECTOR_SCRUTINY', 'TAX_CLEARANCE'],
    availableFields: [
      { field: 'pan_no', type: 'STRING', description: '10-character Permanent Account Number' },
      { field: 'full_name', type: 'STRING', description: 'Taxpayer legal name' },
      { field: 'dob', type: 'DATE', description: 'Date of birth' },
      { field: 'aadhaar_linked', type: 'STRING', description: 'Aadhaar linkage verification' },
      { field: 'income_slab', type: 'STRING', description: 'Declared annual income bracket' },
      { field: 'itr_status', type: 'ENUM', description: 'Income Tax Return filing status' }
    ],
    records: [
      {
        pan_no: 'ABCDE1234F',
        full_name: 'Rajesh Kumar Sharma',
        dob: '1995-04-12',
        aadhaar_linked: '9876-5432-1098',
        income_slab: '10L - 15L',
        itr_status: 'FILED_FY25',
        status: 'VALID'
      },
      {
        pan_no: 'BKAPR4321Q',
        full_name: 'Ananya Roy',
        dob: '1998-11-20',
        aadhaar_linked: '2345-6789-0123',
        income_slab: '5L - 7L',
        itr_status: 'FILED_FY25',
        status: 'VALID'
      },
      {
        pan_no: 'XYZPS9876K',
        full_name: 'Vikram Singh',
        dob: '1993-06-10',
        aadhaar_linked: '4455-6677-8899',
        income_slab: '3L - 5L',
        itr_status: 'PENDING',
        status: 'VALID'
      },
      {
        pan_no: 'PQRSS6543M',
        full_name: 'Priya Sharma',
        dob: '1996-02-14',
        aadhaar_linked: '5544-3322-1100',
        income_slab: '25L - 50L',
        itr_status: 'AUDIT_FLAGGED',
        status: 'UNDER_INVESTIGATION'
      }
    ]
  },
  {
    datasetId: 'DS-MOE-NAD',
    name: 'National Academic Depository (NAD / DigiLocker)',
    owningMinistry: 'Ministry of Education (NAD / DigiLocker Registry)',
    ministryCode: 'MoE',
    category: 'EDUCATION',
    sensitivity: 'RESTRICTED',
    purpose: 'Degree authenticity, roll number verification, and academic integrity.',
    supportedSearchKeys: ['roll_no', 'student_name'],
    sharingAgreementActive: true,
    permittedUseCases: ['CREDENTIAL_VERIFICATION', 'SCHOLARSHIP_VALIDATION', 'ELIGIBILITY_CHECK'],
    availableFields: [
      { field: 'roll_no', type: 'STRING', description: 'Academic Roll Number' },
      { field: 'student_name', type: 'STRING', description: 'Candidate name on degree' },
      { field: 'degree', type: 'STRING', description: 'Conferred academic qualification' },
      { field: 'university', type: 'STRING', description: 'Conferring Institution / Board' },
      { field: 'passing_year', type: 'NUMBER', description: 'Year of passing' },
      { field: 'cgpa', type: 'STRING', description: 'Cumulative Grade Point Average' }
    ],
    records: [
      {
        roll_no: '2016-BTECH-098',
        degree: 'B.Tech Computer Science',
        university: 'Delhi Technological University',
        student_name: 'Rajesh Kumar Sharma',
        passing_year: '2020',
        cgpa: '8.8',
        status: 'AUTHENTIC'
      },
      {
        roll_no: '2019-BCOM-441',
        degree: 'B.Com Honours',
        university: 'Calcutta University',
        student_name: 'Ananya Roy',
        passing_year: '2022',
        cgpa: '7.9',
        status: 'AUTHENTIC'
      },
      {
        roll_no: '2015-BSC-112',
        degree: 'B.Sc Physics',
        university: 'Rajasthan University',
        student_name: 'Vikram Singh',
        passing_year: '2018',
        cgpa: '6.4',
        status: 'AUTHENTIC'
      }
    ]
  },
  {
    datasetId: 'DS-MCA21-DIN',
    name: 'MCA21 Active Director & Corporate Entity Registry',
    owningMinistry: 'Ministry of Corporate Affairs',
    ministryCode: 'MCA',
    category: 'CORPORATE',
    sensitivity: 'PUBLIC',
    purpose: 'Directorship disclosure, corporate ownership, and conflict of interest detection.',
    supportedSearchKeys: ['din_no', 'director_name'],
    sharingAgreementActive: true,
    permittedUseCases: ['CONFLICT_OF_INTEREST_SCAN', 'EXPANSION_CHECK', 'BENEFICIARY_SCRUTINY'],
    availableFields: [
      { field: 'din_no', type: 'STRING', description: 'Director Identification Number' },
      { field: 'director_name', type: 'STRING', description: 'Director registered name' },
      { field: 'company_name', type: 'STRING', description: 'Incorporated Entity Name' },
      { field: 'status', type: 'STRING', description: 'Directorship active status' }
    ],
    records: [
      {
        din_no: 'DIN09876543',
        director_name: 'Rajesh Kumar Sharma',
        company_name: 'Sharma Tech Innovations Pvt Ltd',
        status: 'ACTIVE_DIRECTOR'
      },
      {
        din_no: 'DIN01234567',
        director_name: 'Priya Sharma',
        company_name: 'Apex Horizon Capital LLP',
        status: 'ACTIVE_DIRECTOR'
      }
    ]
  }
];

export const SEED_RULES = [
  {
    id: 'RULE-01',
    code: 'SEC_AADHAAR_MATCH',
    name: 'Aadhaar Identity & Biometric Integrity',
    statute: 'Aadhaar (Targeted Delivery of Financial Subsidies) Act, 2016 §7',
    description: 'Submitted Aadhaar number must exist in UIDAI registry with matching demographic particulars (Phonetic Name match >= 85%, DOB exact).',
    category: 'IDENTITY',
    strictness: 'MANDATORY_CRITICAL',
    formula: 'UIDAI.exists(aadhaar_no) AND phonetic_similarity(app.name, UIDAI.name) >= 85',
    active: true
  },
  {
    id: 'RULE-02',
    code: 'SEC_PAN_AADHAAR_LINK',
    name: 'Statutory PAN-Aadhaar Mandatory Linkage',
    statute: 'Income Tax Act, 1961 §139AA read with Rule 114AAA',
    description: 'PAN must be validly linked with the registered Aadhaar number in CBDT central database. Unlinked PANs fail statutory compliance.',
    category: 'FINANCIAL',
    strictness: 'MANDATORY_CRITICAL',
    formula: 'CBDT.pan_status == "VALID" AND CBDT.aadhaar_linked == app.aadhaar_no',
    active: true
  },
  {
    id: 'RULE-03',
    code: 'SEC_INCOME_CEILING_GRANT',
    name: 'Public Benefit Scheme Income Ceiling Validation',
    statute: 'Fiscal Responsibility & Public Grant Distribution Rules, 2024 Rule 12',
    description: 'Declared income in application must be consistent with CBDT filed return tax bracket with no exceeding discrepancies.',
    category: 'FINANCIAL',
    strictness: 'HIGH_PRIORITY',
    formula: 'app.claimed_income <= parse_bracket(CBDT.income_slab).max * 1.15',
    active: true
  },
  {
    id: 'RULE-04',
    code: 'SEC_EDU_CREDENTIAL_AUTHENTICITY',
    name: 'Academic Credential & Roll No Authenticity',
    statute: 'National Academic Depository (NAD) Regulatory Mandate, 2020',
    description: 'Degree roll number must be verifiably authenticated via DigiLocker / NAD repository matching candidate student name.',
    category: 'CREDENTIAL',
    strictness: 'MANDATORY_CRITICAL',
    formula: 'MoE_NAD.exists(app.education_roll) AND phonetic_similarity(app.name, MoE_NAD.student_name) >= 80',
    active: true
  },
  {
    id: 'RULE-05',
    code: 'SEC_MCA_DIRECTOR_EXPANSION',
    name: 'Directorship Disclosure & Conflict of Interest Scan',
    statute: 'Companies Act, 2013 §164 & §166 (Automatic Trigger for Income > 10L)',
    description: 'Commercial subsidy recipients declaring >= ₹10 Lakhs must undergo automated scan for undisclosed commercial directorships.',
    category: 'EXPANSION',
    strictness: 'ADVISORY_MONITORING',
    formula: 'IF app.claimed_income >= 1000000 THEN SCAN MCA.directors(app.name)',
    active: true
  }
];

export const SEED_APPLICATIONS = [
  {
    id: 'APP-2026-901',
    scheme_name: 'National Innovation Startup Subsidy Grant',
    applicant_name: 'Rajesh Kumar Sharma',
    dob: '1995-04-12',
    gender: 'Male',
    father_name: 'Harish Chandra Sharma',
    aadhaar_no: '9876-5432-1098',
    pan_no: 'ABCDE1234F',
    education_roll: '2016-BTECH-098',
    claimed_income: '12,50,000',
    state: 'Uttar Pradesh',
    pin_code: '201301',
    status: 'VERIFIED',
    ai_verdict: 'PASS',
    confidence_score: 98,
    submitted_at: '2026-10-23 10:14:00'
  },
  {
    id: 'APP-2026-902',
    scheme_name: 'Women Tech Entrepreneur Fellowship',
    applicant_name: 'Ananya Ray',
    dob: '1998-11-20',
    gender: 'Female',
    father_name: 'Subhash Roy',
    aadhaar_no: '2345-6789-0123',
    pan_no: 'BKAPR4321Q',
    education_roll: '2019-BCOM-441',
    claimed_income: '6,20,000',
    state: 'West Bengal',
    pin_code: '700019',
    status: 'NEEDS_REVIEW',
    ai_verdict: 'NEEDS_REVIEW',
    confidence_score: 87,
    submitted_at: '2026-10-23 11:32:00'
  },
  {
    id: 'APP-2026-903',
    scheme_name: 'National Solar Equipment Manufacturing Grant',
    applicant_name: 'Vikram Singh',
    dob: '1993-06-10',
    gender: 'Male',
    father_name: 'Baldev Singh',
    aadhaar_no: '9988-7766-5544',
    pan_no: 'XYZPS9876K',
    education_roll: '2015-BSC-112',
    claimed_income: '4,00,000',
    state: 'Rajasthan',
    pin_code: '302001',
    status: 'FLAGGED',
    ai_verdict: 'FAIL',
    confidence_score: 34,
    submitted_at: '2026-10-23 13:45:00'
  },
  {
    id: 'APP-2026-904',
    scheme_name: 'High-Tech Export Credit Incentive',
    applicant_name: 'Priya Sharma',
    dob: '1996-02-14',
    gender: 'Female',
    father_name: 'Mahesh Sharma',
    aadhaar_no: '5544-3322-1100',
    pan_no: 'PQRSS6543M',
    education_roll: '',
    claimed_income: '8,00,000',
    state: 'Delhi',
    pin_code: '110001',
    status: 'NEEDS_REVIEW',
    ai_verdict: 'NEEDS_REVIEW',
    confidence_score: 65,
    submitted_at: '2026-10-23 15:20:00'
  }
];

export const SEED_AUDIT_LOGS = [
  {
    id: 'AUDIT-8091',
    timestamp: '2026-10-23 10:15:32',
    actor: 'GovVerify Central AI Engine',
    portal: 'Automated AI Engine',
    action: 'DYNAMIC_PLAN_EXECUTION_COMPLETE',
    details: 'Completed dynamic verification plan for Application #APP-2026-901 (Rajesh Kumar Sharma). Overall match: 98%.',
    severity: 'SUCCESS'
  },
  {
    id: 'AUDIT-8092',
    timestamp: '2026-10-23 11:34:10',
    actor: 'GovVerify Central AI Engine',
    portal: 'Automated AI Engine',
    action: 'PHONETIC_DISCREPANCY_FLAGGED',
    details: 'Phonetic distance alert on Application #APP-2026-902: Submitted "Ananya Ray" vs UIDAI "Ananya Roy" (Similarity: 88%). Requires manual confirmation.',
    severity: 'WARNING'
  },
  {
    id: 'AUDIT-8093',
    timestamp: '2026-10-23 13:47:05',
    actor: 'GovVerify Central AI Engine',
    portal: 'Automated AI Engine',
    action: 'CRITICAL_IDENTITY_MISMATCH',
    details: 'Application #APP-2026-903: Submitted Aadhaar "9988-7766-5544" does not resolve in UIDAI master registry. Statutory freeze recommended.',
    severity: 'DANGER'
  }
];
