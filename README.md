# GovConnect - Digital Government Interoperability Platform

> **Core Philosophy:** *One Citizen. One Platform. Connected Government Services.*
> 
> *GovConnect connects fragmented government services through a secure interoperability layer, enabling consent-based data sharing and coordinated service delivery.*

---

## 🏛️ Executive Summary & Problem Context
In traditional e-governance architectures, state and municipal departments operate in isolated silos (e.g., Municipal Water Supply Boards, Revenue & Land Administration, Higher Education, Health, Transport, and Central Portals). 

When a citizen applies for a public service (such as a New Domestic Drinking Water Connection or Scholarship):
1. The citizen must physically obtain land ownership and Patta records from the Revenue Office.
2. The citizen must verify property tax receipts and identity cards with different authorities.
3. The citizen submits physical duplicate copies to the municipal board.
4. If a delay occurs, the citizen must independently follow up across multiple disconnected departments with different reference numbers.

**GovConnect solves this by serving as a non-invasive, consent-driven interoperability layer.** Existing departmental software and legacy databases continue running without replacement, while GovConnect standardizes data exchange into canonical formats.

---

## ⚡ Key Highlights & Architecture

```
                                  +------------------------------------+
                                  |         Citizen / User UI          |
                                  +-----------------+------------------+
                                                    |
                                                    v
+------------------------+        +-----------------+------------------+
| AI Service Assistant   |<------>|     GovConnect API Gateway         |
| (NLP / Service Engine) |        +-----------------+------------------+
+------------------------+                          |
                                  +-----------------+------------------+
                                  |     Authentication & RBAC          |
                                  | (Citizen, Dept Officer, Admin)     |
                                  +-----------------+------------------+
                                                    |
                                  +-----------------+------------------+
                                  |     Consent Management Gate        |
                                  +-----------------+------------------+
                                                    |
                                  +-----------------+------------------+
                                  |       Workflow Orchestrator        |
                                  +-----------------+------------------+
                                                    |
                                  +-----------------+------------------+
                                  |  Data Standardization & Validation |
                                  +-----------------+------------------+
                                                    |
                                  +-----------------+------------------+
                                  |  Interoperability Connector Layer  |
                                  +-----------------+------------------+
                                                    |
       +--------------+--------------+--------------+--------------+--------------+
       |              |              |              |              |              |
       v              v              v              v              v              v
   [Aadhaar]     [DigiLocker]    [Revenue]       [Water]       [18 Platforms] [Payments]
   (UIDAI)      (Verifications) (Land Records) (Municipal)     (Connectors)    (BBPS/UPI)
```

1. **AI Government Service Discovery:** Citizen asks in plain natural language (*"I need a new water connection"*), and deterministic NLP extracts the service, eligibility, required proofs, application steps, and starts the workflow.
2. **Citizen Consent Management:** Explicit, auditable permission gate. Citizens can inspect active data sharing authorizations and revoke them at any time with complete audit trails.
3. **18 Government Platform Connectors:** Modular backend adapters supporting:
   - **Identity & Verification:** Aadhaar (UIDAI), DigiLocker, Single Sign-On (SSO / MeriPehchan)
   - **State & Municipal Portals:** Tamil Nadu e-Sevai, Revenue & Land Records, Water Department
   - **Health & Education:** Ayushman Bharat Digital Mission (ABDM), Education & National Scholarship Portal (NSP)
   - **Worker & Farmer Welfare:** EPFO, PM-KISAN, e-Shram
   - **National Services & Portals:** Voter Services (ECI), MyScheme / MyGov, India.gov.in / UMANG, Parivahan (MoRTH), Income Tax (PAN)
   - **Grievance & Treasury:** CPGRAMS, Government e-Treasury & Payment Gateway (UPI / BBPS)
4. **Canonical Data Standardization:** Backend translation engine that converts proprietary snake_case and regional records into standardized ISO schemas.
5. **Department Isolation:** Water Officers only review Water applications and grievances; Revenue Officers only access land verification requests; Education Officers manage scholarships.
6. **Single Unified Application ID:** `APP-2026-XXXXX` tracking all stages from submission to provisioning.
7. **Reliability Monitoring:** Admin console capable of monitoring connector latencies, executing health checks, and testing platform resilience under degraded or offline states.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript & Vite
- **Styling:** Tailwind CSS with Digital Government Design System
- **State & Routing:** React Router v6, TanStack Query v5, Context API
- **Forms & Validation:** React Hook Form + Zod
- **Visualizations:** Recharts (Department distributions, status breakdown, latency monitoring)
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (v20+) with Express and TypeScript
- **ORM & Database:** Prisma ORM with SQLite / PostgreSQL-ready
- **Security:** Helmet, CORS, Express-Rate-Limit, BCrypt password hashing, JWT token handling
- **Logging & Audit:** Pino structured logging & database audit trails
- **Testing:** Vitest & Supertest automated test suites

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)

### 1. Backend Setup
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:seed
npm run dev
```
Backend will start on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

### 3. Run Automated Test Suite
```bash
cd backend
npm test
```

---

## 📋 Standard Platform User Credentials

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@govconnect.demo` | `Password@123` | Citizen Dashboard, Applications, Consents, AI Assistant |
| **Water Officer** | `water.officer@govconnect.demo` | `Password@123` | Water Department Officer Portal |
| **Revenue Officer** | `revenue.officer@govconnect.demo` | `Password@123` | Revenue & Land Records Verification Portal |
| **Education Officer** | `education.officer@govconnect.demo` | `Password@123` | Higher Education & Scholarship Portal |
| **Central Admin** | `admin@govconnect.demo` | `Password@123` | Admin Governance Console & Connector Reliability |

---

## 🛡️ Security & Privacy Architecture
- **Zero-Trust Consent Enforcement:** Cross-department data access requires an active, unrevoked consent record in the database.
- **Sensitive Data Masking:** Aadhaar numbers and PII are masked (`XXXX-XXXX-4819`) and never logged in plain text.
- **Role-Based Access Control:** Strict middleware guards (`requireRole`, `requireDepartment`) enforce departmental data isolation.
- **Audit Logging:** Every state change, authentication event, consent grant/revocation, and connector call is logged in the `AuditLog` table.

---

## 📄 License
Developed under the GovConnect Open Interoperability Initiative.
