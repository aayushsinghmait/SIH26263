# APAAR ID-Based Student Data Management & Verification Platform
### Designed for AICTE-Approved Institutions & National Academic Governance

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![AICTE](https://img.shields.io/badge/AICTE-Integrated-blue.svg)]()
[![APAAR](https://img.shields.io/badge/APAAR-National%20Academic%20ID-orange.svg)]()
[![Compliance](https://img.shields.io/badge/DPDP%20Act%202023-Compliant-success.svg)]()

---

## 📌 Executive Summary & Problem Context
AICTE receives student-related information from approved technical institutions across India. While PGDM institutions submit detailed annual student information, other AICTE-approved institutions have traditionally submitted aggregate statistics (such as total enrolment during annual approval extension). This creates challenges in:
- Maintaining complete, authentic, and verifiable individual student records.
- Detecting seat over-allocation and duplicate admissions across institutions.
- Verifying academic identity for employers, institutions, and regulatory councils.

With the **Automated Permanent Academic Account Registry (APAAR ID)** serving as the unified **"One Nation, One Student ID"**, this platform establishes an integrated digital solution utilizing **APAAR ID** as the primary academic identifier for students enrolled in all AICTE-approved institutions (Colleges, Universities, and Schools).

---

## 🌟 Key Architecture & Capabilities

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             SECURE ACCESS GATEWAY                                │
├──────────────────────────────────┬───────────────────────────────────────────────┤
│    🏛️ APAAR TEAM CENTRAL PORTAL   │         🏫 INSTITUTION PORTAL                 │
│  (AICTE Central Repository &     │   (Colleges, Universities & Schools)          │
│   National Duplicate Oversight)  │   (IIT Delhi, BITS Pilani, VIT, NIT, etc.)    │
└────────────────┬─────────────────┴───────────────────────┬───────────────────────┘
                 │                                         │
                 ▼                                         ▼
   ┌──────────────────────────┐             ┌─────────────────────────────┐
   │ AICTE Central Oversight  │             │ Student Data Upload Engine  │
   │  - Cross-Inst Duplicates │             │  - Approved Intake vs Actual│
   │  - Supernumerary Audits  │             │  - NRI / OCI / FN Quotas    │
   │  - Rule Studio Engine    │             │  - APAAR Format Seed Engine │
   └─────────────┬────────────┘             └──────────────┬──────────────┘
                 │                                         │
                 └───────────────────┬─────────────────────┘
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │         AICTE CRYPTOGRAPHIC VERIFICATION CORE               │
      │  - Deterministic Semantic Matching                          │
      │  - Cross-Institutional Collision Detector                   │
      │  - Verifiable Academic Identity Generation                  │
      │  - Page 16 Reviewer Dossier & Audit Ledger                  │
      └──────────────────────────────┬──────────────────────────────┘
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │          PUBLIC STUDENT & EMPLOYER VERIFICATION             │
      │  - QR-Verifiable Academic Record Generation                 │
      │  - Instant Tamper-Evident Status Checking                   │
      │  - AICTE Verifiable Certificate PDF Export                  │
      └─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Functional Modules

### 1. APAAR Team Central Portal (AICTE Oversight)
- **Central Repository Monitoring:** Real-time analytics tracking total approved intake vs. actual enrolled students across all approved institutions.
- **Intelligent Anomaly & Duplicate Detection:**
  - Automated flag when an APAAR ID is claimed across multiple institutions simultaneously.
  - Automatic alerts when admissions exceed the sanctioned intake capacity.
  - Quota verification for **Supernumerary Seats**, **NRI Category**, **OCI Status**, and **Foreign National (FN) Status**.
- **Rule Studio Sandbox:** Dynamic configuration and simulation of AICTE compliance policies without code redeployments.

### 2. Institution Portal (Colleges, Universities & Schools)
- **Role-Based Access Control:** Separate roles for **Institution Admin** (enrollment batch submissions & registry management) and **Institution Staff** (review & single entry uploads).
- **Post-Admission Batch Ingestion:** High-speed Excel (.xlsx/.csv) batch upload parser supporting automated column normalization and APAAR validation.
- **Institutional Intake Tracker:** Instant real-time progress bars showing occupied vs. remaining seats for each branch and supernumerary category.

### 3. Public Student & Employer Verification Gateway
- Self-service verification portal for students, background verification agencies, employers, and regulatory bodies.
- Instant lookup using 12-digit **APAAR ID** and **Institutional Enrollment Number**.
- **Downloadable AICTE Verifiable Student Academic Identity Certificate** with tamper-proof cryptographic metadata, institutional coordinates, and verified quotas.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, Vanilla CSS Design System, Lucide Icons
- **Backend:** Node.js, Express, Socket.IO (Real-time telemetry and cross-node alerts)
- **Data & Excel Processing:** SheetJS (`xlsx`), Dynamic Semantic Schema Resolver
- **PDF Generation:** jsPDF (Automated AICTE Verifiable Certificate generator)
- **Security & Privacy:** DPDP Act 2023 Masking Standards, Role-Based Access Control (RBAC), Immutable Cryptographic Audit Ledger

---

## 💻 Local Setup & Execution

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/aayushsinghmait/SIH26263.git
cd SIH26263

# Install dependencies for client
npm install

# Install dependencies for backend server
cd server
npm install
cd ..
```

### Running Locally
```bash
# Run both Backend API and Vite Frontend concurrently
npm run dev
```

- **Frontend Web UI:** `http://localhost:5173/`
- **Backend REST API:** `http://localhost:5000/api`
- **Socket.IO Telemetry:** `ws://localhost:5000`

---

## 👥 Demo Quick Login Credentials

| Role | Portal | Institution / Affiliation | Pre-filled Credentials |
| :--- | :--- | :--- | :--- |
| **Central Admin** | APAAR Team Portal | AICTE Central Headquarters | `apaar.admin@aicte-india.org` |
| **Institute Admin** | Institution Portal | IIT Delhi (`IITD`) | `admin@iitd.ac.in` |
| **Institute Staff** | Institution Portal | BITS Pilani (`BITS`) | `staff@pilani.bits-pilani.ac.in` |
| **Institute Admin** | Institution Portal | VIT Vellore (`VIT`) | `admin@vit.ac.in` |

---

## 📜 License & Compliance
This software is developed for the **Smart India Hackathon** under AICTE guidelines and conforms to **DPDP Act 2023** principles regarding student data privacy, PII masking, and consent architecture.