# ReliefOps — Smart Resource Allocation Platform

> **Data-driven volunteer coordination for social impact.**  
> A full-stack web application that collects, prioritizes, and manages community needs — then intelligently matches them to available volunteers using a multi-factor scoring algorithm.

---

## 🏗️ Folder Structure

```
smart-resource-allocation/
├── client/          # React 18 + Vite frontend (TypeScript)
│   ├── src/
│   │   ├── api/         # Centralized API layer (fetch wrappers)
│   │   ├── components/  # Shared UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility helpers
│   │   └── pages/       # Route-level page components
│   ├── public/          # Static assets
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/          # Node.js + Express REST API
│   ├── src/
│   │   ├── config/      # Database connection
│   │   ├── controllers/ # Route handler logic
│   │   ├── jobs/        # Scheduled cron tasks
│   │   ├── middleware/  # Auth, error handling
│   │   ├── models/      # Mongoose ODM schemas
│   │   ├── routes/      # Express route definitions
│   │   ├── services/    # Business logic (matching engine)
│   │   └── utils/       # Shared helpers
│   ├── seeder.js        # Database seed script
│   └── package.json
│
├── .gitignore       # Root-level (covers entire monorepo)
└── README.md
```

---

## 🚀 Tech Stack

### Frontend (`/client`)
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework & build tool |
| TypeScript | Static typing |
| TanStack Query | Server state management & caching |
| React Router v6 | Client-side routing |
| Tailwind CSS + Shadcn UI | Styling & accessible components |
| React Leaflet | Interactive map views |
| Recharts | Data visualization / KPI charts |
| Sonner | Toast notifications |

### Backend (`/server`)
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | HTTP server & REST API |
| MongoDB Atlas + Mongoose | Database & ODM |
| JWT (jsonwebtoken) | Stateless authentication |
| bcryptjs | Password hashing |
| node-cron | Scheduled urgency updates |
| express-rate-limit | API abuse protection |

---

## 💻 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB Atlas** account (or local MongoDB instance)

---

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside `server/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret
CLIENT_URL=http://localhost:8080
```

Seed the database with sample data (optional):

```bash
node src/seeder.js
```

Start the development server:

```bash
npm run dev
```

The API will be running at `http://localhost:5000`.

---

### 2. Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file inside `client/`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## 🔐 Default Admin Credentials

| Field | Value |
|---|---|
| Email | `admin@aidops.org` |
| Password | `123456` |

> ⚠️ **Change these credentials before deploying to production.**

---

## 🧠 Matching Algorithm

The volunteer matching engine scores candidates on three weighted factors:

| Factor | Weight | Logic |
|---|---|---|
| **Skill match** | 50% | Volunteer has the skill matching the need's category |
| **Proximity** | 30% | Haversine distance — full points if within 2 km |
| **Availability** | 20% | Volunteer is currently marked as available |

Top 5 matches are returned, sorted by score then distance.

---

## 📡 API Endpoints

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login & receive JWT | Public |
| GET | `/api/auth/me` | Get current user | Private |
| GET | `/api/needs` | List all needs | Private |
| POST | `/api/needs` | Create a need | Admin |
| GET | `/api/needs/:id` | Get single need | Private |
| GET | `/api/volunteers` | List volunteers | Private |
| POST | `/api/match/:needId` | Get volunteer matches | Admin |
| GET | `/api/assignments` | List assignments | Private |
| POST | `/api/assignments/assign` | Create assignment | Admin |
| PATCH | `/api/assignments/assign/:id/complete` | Mark complete | Admin/Volunteer |
| GET | `/api/users` | List all users | Admin |

---

## 🌱 Contributing

This project was built as a hackathon prototype. PRs and issues are welcome.

---

*Built with ❤️ to support humanitarian coordination.*
