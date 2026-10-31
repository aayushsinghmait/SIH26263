/**
 * Semantic Resolver for GovVerify AI Engine
 * Resolves column/field semantic equivalences (e.g. "Pan card no", "pan no.", "panno" -> 'pan')
 * and restricts AI verification strictly to the columns present in the application.
 */

export const SEMANTIC_DEFINITIONS = {
  name: {
    canonical: 'name',
    label: 'Applicant Legal Name',
    aliases: [
      'name', 'applicant_name', 'applicant name', 'full_name', 'full name', 
      'citizen name', 'candidate name', 'student_name', 'student name', 'director_name', 
      'director name', 'legal name', 'person name', 'beneficiary name', 'applicant'
    ]
  },
  pan: {
    canonical: 'pan',
    label: 'Permanent Account Number (PAN)',
    aliases: [
      'pan', 'pan_no', 'pan no', 'pan no.', 'panno', 'pan card', 'pan card no', 
      'pan card no.', 'pan card number', 'pan_number', 'permanent account number', 
      'pan token', 'tax id', 'pan_code', 'it_pan', 'pan id'
    ]
  },
  aadhaar: {
    canonical: 'aadhaar',
    label: 'Aadhaar UID Number',
    aliases: [
      'aadhaar', 'aadhaar_no', 'aadhaar no', 'aadhaar no.', 'aadhaar number', 
      'aadhar', 'aadhar_no', 'aadhar no', 'aadhar number', 'uid', 'uid_no', 
      'uidai', 'uidai_no', 'uid token', 'biometric id', 'aadhaar token'
    ]
  },
  house_no: {
    canonical: 'house_no',
    label: 'House No / Housecount',
    aliases: [
      'house_no', 'house no', 'house no.', 'houseno', 'housecount', 'house count', 
      'counthouse', 'count house', 'house_code', 'house code', 'housecode', 
      'household_no', 'household no', 'dwelling_no', 'dwelling no', 'house', 
      'household', 'ward_house', 'home_no', 'house id', 'house_id', 'holding_no'
    ]
  },
  dob: {
    canonical: 'dob',
    label: 'Date of Birth (DOB)',
    aliases: [
      'dob', 'date of birth', 'date_of_birth', 'birth date', 'birth_date', 
      'birthdate', 'd.o.b.', 'd.o.b', 'dateofbirth', 'born_on'
    ]
  },
  income: {
    canonical: 'income',
    label: 'Assessed Gross Income',
    aliases: [
      'income', 'claimed_income', 'claimed income', 'annual income', 'annual_income', 
      'income_slab', 'income slab', 'declared income', 'salary', 'income bracket', 
      'gross income', 'family income'
    ]
  },
  roll_no: {
    canonical: 'roll_no',
    label: 'Academic Examination Roll No',
    aliases: [
      'roll_no', 'roll no', 'roll no.', 'roll number', 'education_roll', 
      'education roll', 'registration no', 'reg_no', 'exam roll', 'enrollment_no', 'enrollment no'
    ]
  },
  degree: {
    canonical: 'degree',
    label: 'Educational Qualification / Degree',
    aliases: [
      'degree', 'qualification', 'course', 'program', 'academic degree'
    ]
  },
  din: {
    canonical: 'din',
    label: 'Director Identification Number (DIN)',
    aliases: [
      'din', 'din_no', 'din no', 'din number', 'director id', 'director identification number'
    ]
  },
  father_name: {
    canonical: 'father_name',
    label: "Father / Guardian Name",
    aliases: [
      'father_name', 'father name', 'father', 'guardian name', 'parent name', 'father_guardian'
    ]
  },
  state: {
    canonical: 'state',
    label: 'State / Domicile',
    aliases: [
      'state', 'registered state', 'domicile state', 'domicile', 'province'
    ]
  },
  pin_code: {
    canonical: 'pin_code',
    label: 'Postal Area PIN Code',
    aliases: [
      'pin_code', 'pin code', 'pincode', 'pin', 'postal code', 'postal_code', 'zip'
    ]
  },
  apaar_id: {
    canonical: 'apaar_id',
    label: 'APAAR ID (12-Digit Academic ID)',
    aliases: [
      'apaar_id', 'apaar', 'apaar id', 'apaarid', 'apaar_no', 'apaar no', 'apaar number',
      'one nation one student id', 'abc_id', 'abc id', 'academic id', 'student apaar'
    ]
  },
  institution: {
    canonical: 'institution',
    label: 'AICTE Approved Institution',
    aliases: [
      'institution', 'institution_code', 'institution_name', 'college', 'college_name',
      'school', 'university', 'institute', 'aicte_institution', 'institution code'
    ]
  },
  branch: {
    canonical: 'branch',
    label: 'Branch / Specialization',
    aliases: [
      'branch', 'department', 'discipline', 'specialization', 'stream', 'engineering branch'
    ]
  },
  approved_intake: {
    canonical: 'approved_intake',
    label: 'AICTE Approved Intake Capacity',
    aliases: [
      'approved_intake', 'approved intake', 'sanctioned_intake', 'sanctioned intake', 'intake capacity', 'total intake'
    ]
  },
  actual_enrolment: {
    canonical: 'actual_enrolment',
    label: 'Actual Student Enrolment',
    aliases: [
      'actual_enrolment', 'actual enrolment', 'actual_enrollment', 'actual enrollment', 'enrolled_count'
    ]
  },
  supernumerary: {
    canonical: 'supernumerary',
    label: 'Supernumerary Seats Quota',
    aliases: [
      'supernumerary_seats', 'supernumerary', 'supernumerary quota', 'supernumerary seats', 'supernumerary status'
    ]
  },
  nri_category: {
    canonical: 'nri_category',
    label: 'NRI Category Status',
    aliases: [
      'nri_category', 'nri', 'nri_status', 'nri category', 'nri quota'
    ]
  },
  oci_status: {
    canonical: 'oci_status',
    label: 'Overseas Citizen of India (OCI) Status',
    aliases: [
      'oci_status', 'oci', 'overseas citizen of india', 'oci status'
    ]
  },
  foreign_national: {
    canonical: 'foreign_national',
    label: 'Foreign National (FN) Quota Status',
    aliases: [
      'foreign_national', 'fn', 'foreign national', 'fn_status', 'fn category'
    ]
  }
};

/**
 * Clean string for fuzzy comparison (remove spaces, dots, underscores, dashes, lowercase)
 */
export function cleanKey(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Resolve any raw column header or field name to its canonical semantic key
 * e.g. "Pan card no." -> 'pan', "housecount" -> 'house_no'
 */
export function getSemanticKey(rawKey) {
  if (!rawKey) return '';
  const cleaned = cleanKey(rawKey);

  for (const [key, def] of Object.entries(SEMANTIC_DEFINITIONS)) {
    for (const alias of def.aliases) {
      if (cleanKey(alias) === cleaned) {
        return key;
      }
    }
  }

  // Fallback: return cleaned key
  return cleaned || String(rawKey).toLowerCase().trim().replace(/\s+/g, '_');
}

/**
 * Check if two column names are semantically equivalent
 * e.g. areColumnsEquivalent("pan no.", "Pan card no") === true
 */
export function areColumnsEquivalent(col1, col2) {
  if (!col1 || !col2) return false;
  return getSemanticKey(col1) === getSemanticKey(col2) || cleanKey(col1) === cleanKey(col2);
}

/**
 * Get human-friendly label for a semantic key
 */
export function getSemanticLabel(semanticKey) {
  if (SEMANTIC_DEFINITIONS[semanticKey]) {
    return SEMANTIC_DEFINITIONS[semanticKey].label;
  }
  return semanticKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Extract value from an object using a semantic key
 * Returns { value, originalKey, label } or null
 */
export function extractSemanticValue(record, targetSemanticKey) {
  if (!record || typeof record !== 'object') return null;

  for (const key of Object.keys(record)) {
    if (getSemanticKey(key) === targetSemanticKey || cleanKey(key) === cleanKey(targetSemanticKey)) {
      const val = record[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return {
          value: String(val).trim(),
          originalKey: key,
          label: getSemanticLabel(targetSemanticKey)
        };
      }
    }
  }

  return null;
}

/**
 * Get the list of verification fields present in a specific application.
 * Ignores system metadata fields (id, scheme_name, status, etc.).
 * Guarantees the AI ONLY checks what is in the application!
 */
export function getPresentApplicationFields(application) {
  if (!application) return [];

  const metaKeys = [
    'id', 'scheme_name', 'status', 'submittedat', 'submitted_at', 
    'ai_verdict', 'confidence_score', 'verificationplan', 'evidencelogs',
    'verifiedat', 'verified_at', 'anomalies'
  ];

  const presentFields = [];
  const seenSemanticKeys = new Set();

  for (const key of Object.keys(application)) {
    if (metaKeys.includes(cleanKey(key))) continue;

    const val = application[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      const semanticKey = getSemanticKey(key);
      if (!seenSemanticKeys.has(semanticKey)) {
        seenSemanticKeys.add(semanticKey);
        presentFields.push({
          semanticKey,
          originalKey: key,
          value: String(val).trim(),
          label: getSemanticLabel(semanticKey)
        });
      }
    }
  }

  return presentFields;
}
