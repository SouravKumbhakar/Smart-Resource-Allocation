# Smart Resource Allocation – ReliefOps Platform 🛡️

**Connecting Communities with Relief Through Technology**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://smart-resource-allocation-theta.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🚨 The Problem: Crisis Coordination Gap

In the wake of humanitarian crises or ongoing community challenges, organizations often struggle with:
* **Fragmented Data**: Community needs are scattered across different channels, making it hard to prioritize.
* **Invisible Urgency**: High-priority problems are often buried under less critical requests.
* **Inefficient Matching**: Manually connecting volunteers to tasks based on skills and location is slow and error-prone.

## 💡 The Solution: ReliefOps

ReliefOps is a comprehensive resource intelligence platform designed to streamline humanitarian efforts. It provides a centralized command center where NGOs can report needs, and an intelligent engine matches those needs with the right volunteers based on **proximity, skills, and availability**.

---

## 🚀 Key Features

### 🔐 Multi-Role RBAC System
* **Super Admin**: Platform-wide governance, user role management, and audit monitoring.
* **NGO Admin**: Post community needs, manage organization profiles, and oversee local operations.
* **Coordinator**: Match volunteers to urgent needs and verify task completion.
* **Volunteer**: Build skill profiles, discover local opportunities, and submit proof of impact.

### 🧠 Smart & Automated Intelligence
* **Matching Engine**: Proprietary algorithm that scores volunteers based on skill relevance, distance (Haversine formula), and current workload.
* **Location-based Discovery**: Real-time discovery of nearby volunteers for hyper-local response.
* **Skill Profiling**: Dynamic profiling system allowing volunteers to showcase specific expertise (Medical, Logistics, Food, etc.).

### 📈 Operational Excellence
* **Verification Workflow**: Volunteers submit proof-of-work (images + text), which admins review before marking tasks as completed.
* **Real-Time Notifications**: Integrated system to keep all stakeholders informed of assignments and approvals.
* **Audit Logging**: Comprehensive tracking of all critical system actions for transparency and accountability.
* **Automated Cleanup**: Intelligence system that auto-hides completed tasks after 48 hours to keep the dashboard focused.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React 18, TypeScript
* **State Management**: TanStack Query (React Query)
* **Routing**: React Router DOM
* **Styling**: Tailwind CSS, Shadcn/UI
* **Animations**: Framer Motion

### Backend
* **Runtime**: Node.js, Express
* **Database**: MongoDB (Mongoose ODM)
* **Authentication**: JWT (JSON Web Tokens)
* **File Handling**: Cloudinary SDK

---

## 🌐 Live Demo & Credentials

**Frontend**: [https://smart-resource-allocation-theta.vercel.app/](https://smart-resource-allocation-theta.vercel.app/)

### 🔑 Demo Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@aidops.org` | `123456` |
| **NGO Admin** | `admin@aidops.org` | `123456` |
| **Volunteer** | `john@mail.com` | `123456` |

---

## 📸 Screenshots




<div align="center">
  <img width="400"  alt="Landing page" src="https://github.com/user-attachments/assets/2cff7cbf-790b-4146-88c1-2cc61b2161ca" />
  <img width="400" alt="Admin pannel" src="https://github.com/user-attachments/assets/4ca3afc1-183c-47fc-8592-526ac59ccc37" />
  <img width="400"  alt="NGO dashboard" src="https://github.com/user-attachments/assets/b65e67e8-c93b-44aa-b06f-693779eb2546" />
  <img width="400"  alt="Needs page" src="https://github.com/user-attachments/assets/980cba40-b818-421e-a519-e4c9d5b137b9" />
  <img  width="400"  alt="Volunteers" src="https://github.com/user-attachments/assets/f3f032e2-7261-47f3-8800-93941f721eb7" />
  <img width="400" alt="assignments page"" src="https://github.com/user-attachments/assets/ad9a8c2e-0ad8-4092-840d-4ec8f0809b85" />
  <img width="400" alt="volunteer profile" src="https://github.com/user-attachments/assets/82679c45-0011-4c20-bad2-1517363169c6" />
</div>

---

## 🏗️ System Architecture

1. **Client Layer**: A responsive React SPA that interacts with the RESTful API.
2. **Security Layer**: JWT-based middleware ensuring Role-Based Access Control (RBAC) across all endpoints.
3. **Logic Layer**: Node.js services handling geo-spatial calculations, matching algorithms, and state transitions.
4. **Data Layer**: MongoDB storing persistent documents for Users, Needs, Assignments, and Audit Logs.
5. **Storage Layer**: Cloudinary managing image uploads for task verification.

---

## 🔭 Future Scope

* **AI Chatbot**: Instant assistance for volunteers to find tasks.
* **Mobile App**: Native iOS/Android apps with push notifications and GPS tracking.
* **Offline Mode**: Local caching of data for use in areas with poor connectivity.
* **Blockchain Integration**: Immutable proof of impact for donor transparency.

---

## 👥 Contributors

* **Sourav Kumbhakar** 

---
