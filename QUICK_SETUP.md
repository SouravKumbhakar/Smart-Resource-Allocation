# ⚡ Quick Setup Guide

Follow these steps to get the ReliefOps platform running locally on your machine.

## 📋 Prerequisites

Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v16.x or higher)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas instance)
* [Cloudinary](https://cloudinary.com/) Account (for image uploads)

---

## 1️⃣ Clone the Repository

```bash
git clone <your-repo-url>
cd smart-resource-allocation
```

---

## 2️⃣ Backend Configuration (`server`)

### Installation
```bash
cd server
npm install
```

### Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Data Seeding (Optional)
To populate the database with initial demo data:
```bash
npm run seed
```

### Run Server
```bash
npm run dev
```
The backend will start on `http://localhost:5000`.

---

## 3️⃣ Frontend Configuration (`client`)

### Installation
```bash
cd ../client
npm install
```

### Environment Variables
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### Run Client
```bash
npm run dev
```
The frontend will start on `http://localhost:5173`.

---

## 🚢 Deployment Notes

### Backend (Render/Heroku)
* Set all environment variables in the platform dashboard.
* Ensure the `Build Command` is `npm install`.
* Ensure the `Start Command` is `node src/server.js`.

### Frontend (Vercel/Netlify)
* Set `VITE_API_URL` to your production backend URL (e.g., `https://your-backend.onrender.com/api`).
* Configure the build output directory as `dist`.

---

## 🛠️ Troubleshooting

* **CORS Errors**: Ensure your frontend URL is added to the `LOCAL_ORIGINS` or `VERCEL_PATTERN` in `server/src/app.js`.
* **Database Connection**: Verify your MongoDB IP Whitelist if using Atlas.
* **Image Uploads**: Ensure your Cloudinary credentials are correct; otherwise, task submissions with proof will fail.
