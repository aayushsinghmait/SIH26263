import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

/**
 * Parse an uploaded Excel or CSV file into JSON array
 * @param {File} file 
 * @returns {Promise<Array>}
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export data array to an Excel (.xlsx) file
 * @param {Array} data 
 * @param {string} fileName 
 * @param {string} sheetName 
 */
export function exportToExcel(data, fileName = 'Export.xlsx', sheetName = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Download sample template for Student Enrollment Batch Submissions
 */
export function downloadApplicationTemplate() {
  const sampleData = [
    {
      Student_ID: 'STU-2026-905',
      Student_Name: 'Suresh Patel',
      APAAR_ID: '9876-5432-1098',
      Enrollment_No: '2026/CS/084',
      Course: 'B.Tech Computer Science and Engineering',
      Branch: 'Computer Science',
      Approved_Intake: 120,
      Actual_Enrolment: 118,
      Supernumerary_Seats: 'NO',
      NRI_Category: 'NO',
      OCI_Status: 'NO',
      Foreign_National: 'NO',
      Date_of_Birth: '2004-07-25',
      Gender: 'Male',
      Father_Name: 'Ramesh Patel',
      Institution_Code: 'IITD',
      State: 'Delhi',
      Pin_Code: '110016'
    },
    {
      Student_ID: 'STU-2026-906',
      Student_Name: 'Neha Verma',
      APAAR_ID: '2345-6789-0123',
      Enrollment_No: '2026/EE/102',
      Course: 'B.Tech Electrical Engineering',
      Branch: 'Electrical Engineering',
      Approved_Intake: 180,
      Actual_Enrolment: 175,
      Supernumerary_Seats: 'YES',
      NRI_Category: 'YES',
      OCI_Status: 'NO',
      Foreign_National: 'NO',
      Date_of_Birth: '2003-03-18',
      Gender: 'Female',
      Father_Name: 'Ashok Verma',
      Institution_Code: 'BITS',
      State: 'Rajasthan',
      Pin_Code: '333031'
    }
  ];
  exportToExcel(sampleData, 'AICTE_Student_Enrollment_Batch_Template.xlsx', 'StudentEnrollment');
}

/**
 * Download sample template for Institution Student Registry Upload
 */
export function downloadMinistryDatasetTemplate(institutionCode = 'IITD') {
  const sampleData = [
    {
      apaar_id: '9012-3456-7890',
      student_name: 'Ananya Sharma',
      enrollment_no: '2026/CS/084',
      course: 'B.Tech Computer Science and Engineering',
      branch: 'Computer Science',
      approved_intake: 120,
      actual_enrolment: 118,
      supernumerary_seats: 'NO',
      nri_category: 'NO',
      oci_status: 'NO',
      foreign_national: 'NO',
      admission_year: 2026,
      dob: '2004-05-14',
      gender: 'Female',
      state: 'Delhi',
      pin_code: '110016',
      status: 'ENROLLED'
    },
    {
      apaar_id: '4567-8901-2345',
      student_name: 'Aarav Patel',
      enrollment_no: '2026/EE/102',
      course: 'B.Tech Electrical Engineering',
      branch: 'Electrical Engineering',
      approved_intake: 180,
      actual_enrolment: 175,
      supernumerary_seats: 'YES',
      nri_category: 'YES',
      oci_status: 'NO',
      foreign_national: 'NO',
      admission_year: 2026,
      dob: '2003-11-20',
      gender: 'Male',
      state: 'Rajasthan',
      pin_code: '333031',
      status: 'ENROLLED'
    }
  ];
  exportToExcel(sampleData, `${institutionCode}_Student_Registry_Template.xlsx`, 'StudentRegistry');
}

/**
 * Download blank Excel template with custom user-defined columns
 * @param {Array<string>} columns 
 * @param {string} datasetName 
 */
export function downloadCustomDatasetTemplate(columns = ['Student_Name', 'APAAR_ID', 'Enrollment_No', 'Course'], datasetName = 'CustomRegistry') {
  const sampleRow = {};
  columns.forEach(col => {
    sampleRow[col] = '';
  });
  const cleanName = datasetName.replace(/[^a-zA-Z0-9_-]/g, '_');
  exportToExcel([sampleRow], `${cleanName}_Template.xlsx`, 'RegistryTemplate');
}

/**
 * Generate official AICTE Verifiable Student Academic Identity Certificate (PDF)
 * Displays APAAR ID along with Student ID for degree-awarding bodies (Requirement 10)
 */
export function generateVerificationPDF(report, application) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(11, 37, 69); // AICTE Navy Blue
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ALL INDIA COUNCIL FOR TECHNICAL EDUCATION (AICTE)', 15, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('APAAR ID-Based Student Data Management & Verification Platform (SIH26261)', 15, 24);
  doc.text('National Academic Identity & Verifiable Degree Certificate Ledger', 15, 31);
  doc.text(`Generated At: ${new Date().toLocaleString()}`, 15, 38);

  // Status Badge
  doc.setTextColor(11, 37, 69);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`VERIFIABLE ACADEMIC RECORD: #${report.applicationId}`, 15, 52);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Student Name: ${report.applicantName}`, 15, 62);
  doc.text(`APAAR ID: ${application?.apaar_id || application?.aadhaar_no || 'N/A'}`, 15, 69);
  doc.text(`Institutional Enrollment No: ${application?.enrollment_no || application?.pan_no || 'N/A'}`, 15, 76);
  doc.text(`Academic Program: ${application?.course || application?.scheme_name || 'B.Tech Program'}`, 15, 83);
  doc.text(`Institution: ${application?.institution_code || application?.state || 'AICTE Institution'}`, 15, 90);
  
  // Score Box
  doc.setFillColor(241, 245, 249);
  doc.rect(135, 47, 60, 42, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('APAAR STATUS', 140, 56);

  if (report.overallVerdict === 'PASS') {
    doc.setTextColor(16, 185, 129); // Green
    doc.setFontSize(16);
    doc.text('VERIFIED AUTHENTIC', 140, 68);
  } else if (report.overallVerdict === 'FAIL') {
    doc.setTextColor(239, 68, 68); // Red
    doc.setFontSize(16);
    doc.text('FLAGGED / DUPLICATE', 140, 68);
  } else {
    doc.setTextColor(245, 158, 11); // Amber
    doc.setFontSize(16);
    doc.text('UNDER REVIEW', 140, 68);
  }

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Confidence Score: ${report.confidenceScore}%`, 140, 80);

  // Field Reconciliations
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Cross-Ministry Data Reconciliation', 15, 96);

  let y = 106;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Field', 15, y);
  doc.text('Source', 55, y);
  doc.text('Submitted Value', 80, y);
  doc.text('Verified Registry Value', 125, y);
  doc.text('Status', 175, y);
  y += 3;
  doc.line(15, y, 195, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  (report.fieldComparisons || []).forEach(f => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.text(f.field.slice(0, 20), 15, y);
    doc.text(f.sourceMinistry || 'Registry', 55, y);
    doc.text(String(f.submittedValue || '').slice(0, 20), 80, y);
    doc.text(String(f.verifiedValue || '').slice(0, 24), 125, y);
    doc.text(f.matchStatus, 175, y);
    y += 7;
  });

  // Compliance Rules
  y += 5;
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Configured Regulatory Compliance Rules', 15, y);
  y += 8;

  (report.complianceRules || []).forEach(r => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`[${r.status}] ${r.name}`, 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Evidence: ${r.evidence}`, 20, y);
    doc.setTextColor(15, 23, 42);
    y += 7;
  });

  // Reviewer Recommendation
  y += 5;
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Authorized Reviewer Recommendation:', 15, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Recommended Action: ${report.reviewerRecommendation?.action || 'PENDING'}`, 15, y);
  y += 5;
  doc.text(`Justification: ${report.reviewerRecommendation?.justification || 'N/A'}`, 15, y);

  // Digital Sign line
  y += 18;
  if (y > 270) { doc.addPage(); y = 30; }
  doc.setLineDash([2, 2], 0);
  doc.line(130, y, 195, y);
  doc.setLineDash([], 0);
  doc.setFontSize(8);
  doc.text('Authorized Government Reviewer Signature', 130, y + 5);

  doc.save(`Verification_Report_${report.applicationId}.pdf`);
}
