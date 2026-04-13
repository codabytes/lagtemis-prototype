# TEMIS User Guide
## Tertiary Education Management Information System - Lagos State

Welcome to the **Tertiary Education Management Information System (TEMIS)**. This centralized databank is designed for the Lagos State Ministry of Tertiary Education to anchor institutional information, drive policy formulation, and enable evidence-based decision-making.

---

## 1. Getting Started

### 1.1 Authentication
TEMIS uses **Google Sign-In** for secure access.
1. Navigate to the application URL.
2. Click **"Sign in with Google"**.
3. Use your authorized Lagos State government email address.
4. **Note**: If your email is not pre-registered in the system, access will be denied. Contact a SuperUser to add your account.

### 1.2 User Roles & Permissions
The system employs strict Role-Based Access Control (RBAC):

| Role | Portfolio | Key Permissions |
| :--- | :--- | :--- |
| **SuperUser** | Commissioner / Perm. Sec. | Full system access, User Management, Global Purge, Delete records. |
| **Director Admin/HR** | Admin & Human Resources | Manage Academic/Non-Academic Staff, Trainings, Publications. |
| **Director Standards** | Standards & Accreditation | Manage Students, Certificate Verifications, Staff Oversight. |
| **Director Inspection** | Inspection & Monitoring | Manage Institutions, Faculties, Departments. |
| **Director Infrastructure** | Infrastructure & Planning | Manage Facilities, Maintenance Logs. |
| **Director Research** | Research & Data | System-wide oversight, Data Analysis, Reporting. |

---

## 2. Modules & Components

### 2.1 Executive Dashboard
The landing page provides real-time oversight of the tertiary education landscape.
*   **Key Stats**: Total Students, Academic Staff, Facilities, and STEM Ratio.
*   **Trends**: Enrollment vs. Graduation historical charts.
*   **Distribution**: Pie charts showing the split between Public and Private institutions.
*   **Recent Activity**: Quick view of latest facility maintenance and builds.

### 2.2 Institution Management
Manage the structural hierarchy of Lagos State tertiary education.
*   **Institutions**: Add/Edit public and private institutions.
*   **Faculties/Directorates**: Define academic and administrative divisions within an institution.
*   **Departments/Units**: Manage specific departments, including STEM classification for data analysis.

### 2.3 Student Management
Centralized repository for student records across all institutions.
*   **Student Profiles**: LASRRA ID, Matric Number, and enrollment status.
*   **Certificate Verification**: Mark certificates as verified for accreditation purposes.
*   **Filtering**: Search by name, ID, or institution.

### 2.4 Personnel Management
Divided into **Academic** and **Non-Academic** staff.
*   **Staff Profiles**: Comprehensive records including Title, Designation, Grade Level, and Appointment dates.
*   **Detailed Views**: Click on any staff or student record to view their **Full Profile**, including a chronological history of their records.
*   **Employment Status**: Track active staff, those on leave (Sabbatical, Study), or retired personnel.
*   **Specialization**: Map academic expertise across the state.

### 2.5 Facilities & Infrastructure
Track physical assets and their state of repair.
*   **Facility Inventory**: Lecture theaters, libraries, laboratories, and studios.
*   **Maintenance Logs**: Record preventive and corrective maintenance for every asset.
*   **Funding Tracking**: Monitor if facilities are funded by LASG, TETFund, or PPP.

### 2.6 Research & Publications
A databank of academic output from Lagos State institutions.
*   **Publication Records**: Journal articles, books, and technical reports.
*   **Funding Sources**: Track research grants from LASRIC, TETFund, etc.

### 2.7 Training Management
Monitor professional development of staff.
*   **Training Records**: Workshops, seminars, and professional certifications.
*   **International Scope**: Track international vs. local training exposures.

### 2.8 User Management (SuperUser Only)
Securely manage system access.
*   **Add Users**: Invite new personnel by email and assign their specific Director or SuperUser role.
*   **Audit Logs**: View a chronological record of all system changes (Create, Update, Delete) for accountability.

### 2.9 System Settings & Migration (SuperUser Only)
*   **Migration Utility**: Access tools for bulk data operations, system migrations, and configuration updates.
*   **System Status**: Monitor the operational health of the TEMIS platform.

---

## 3. Common Use Cases

### 3.1 Verifying a Student's Status
1. Navigate to **Students**.
2. Use the search bar to enter the **Matric Number** or **LASRRA ID**.
3. View the **Enrollment Status** and **Certificate Verified** badge.

### 3.2 Adding a New Facility Maintenance Record
1. Navigate to **Facilities**.
2. Select the specific facility to view its profile.
3. Click **"Add Maintenance Record"**.
4. Enter the maintenance type (Preventive/Corrective) and work performed.

### 3.3 Generating a Personnel Report
1. Navigate to **Academic Staff** or **Non-Academic Staff**.
2. Use the filters to narrow down by **Institution** or **Designation**.
3. Use the **Download** icon to export the current view (if available).

---

## 4. System Security & Maintenance

*   **Global Purge**: On initial deployment, SuperUsers can trigger a "Global Purge" to clear sample/seed data and start with a clean databank.
*   **Audit Trail**: Every administrative action is logged with the user's email and timestamp.
*   **Data Validation**: Forms include strict validation for LASRRA IDs, email formats, and required fields to ensure data integrity.

---
*For technical support or access requests, please contact the Ministry of Tertiary Education ICT Unit.*
