# 🚀 TaskFlow — Team Task Manager

A full-stack web application for managing teams, projects, and tasks with role-based access control.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue) ![License](https://img.shields.io/badge/License-MIT-green)

**Live Demo:** [https://diligent-blessing-production-0bd6.up.railway.app/](https://diligent-blessing-production-0bd6.up.railway.app/)

## ✨ Features

- 🔐 **JWT Authentication** — Signup/Login with secure token-based sessions
- 👥 **Role-Based Access Control** — Admin & Member roles with enforced permissions
- 📁 **Project Management** — Create projects, add/remove team members
- ✅ **Task Management** — Create, assign, update, and delete tasks
- 📊 **Dashboard** — Real-time stats: total, in-progress, done, overdue tasks
- 🎯 **Kanban Board** — Visual task tracking with custom scrollable columns
- 📱 **Dynamic Grid View** — Auto-switches to space-optimized CSS Grid when filtering tasks
- 🎨 **Modern UI/UX** — Custom animated tooltips, dark mode, and dynamic glassmorphism
- 🔍 **Filtering** — Filter tasks by project, priority, and status

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Custom CSS (Modern Design System, CSS Grid/Flexbox) |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |
| Deployment | Railway (Full Stack Multi-Service) |

## 👥 Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ❌ |
| Add/Remove members | ✅ | ❌ |
| Create task | ✅ | ❌ |
| Assign task | ✅ | ❌ |
| Update task (all fields) | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks only) |
| View all project tasks | ✅ | ❌ |
| View assigned tasks | ✅ | ✅ |

## 📁 Project Structure

```
Team Task Manager/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── api/          # Axios API client
│   │   ├── components/   # Reusable UI components (TaskCard, Tooltips)
│   │   ├── context/      # AuthContext
│   │   └── pages/        # Dashboard, Projects, Tasks, Auth
│   └── vite.config.js
│
└── server/               # Express backend
    ├── config/           # MongoDB connection
    ├── controllers/      # Business logic
    ├── middleware/        # JWT auth, role check
    ├── models/           # Mongoose schemas
    ├── routes/           # API routes
    └── server.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier)

### 1. Clone the repo
```bash
git clone https://github.com/abhishek-si-ngh/Team_Task_Manager.git
cd Team_Task_Manager
```

### 2. Setup Backend
```bash
cd server
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env
npm install
npm run dev
```

### 3. Setup Frontend
```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

App runs at: `http://localhost:3000`

## 🌐 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |
| GET | `/api/auth/users` | Private | List all users |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Private | Get user's projects |
| POST | `/api/projects` | Admin | Create project |
| PUT | `/api/projects/:id` | Project Admin | Update project |
| DELETE | `/api/projects/:id` | Project Admin | Delete project + tasks |
| POST | `/api/projects/:id/members` | Project Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Project Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Private | Get tasks (filtered) |
| GET | `/api/tasks/dashboard` | Private | Dashboard stats |
| POST | `/api/tasks` | Project Admin | Create task |
| PUT | `/api/tasks/:id` | Admin / Member | Update task |
| DELETE | `/api/tasks/:id` | Project Admin | Delete task |

## ☁️ Deployment (Railway)

This application is configured for a multi-service monorepo deployment on **Railway**.

### 1. Backend Service
1. Create new service from GitHub repo.
2. Set Root Directory: `/server`
3. Variables needed: `MONGO_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL` (Frontend Domain).
4. Auto-detects Node.js and uses `npm start`.

### 2. Frontend Service
1. Create second service from the **same** GitHub repo.
2. Set Root Directory: `/client`
3. Set Build Command: `npm run build`
4. Set Start Command: `npm start`
5. Variables needed: `VITE_API_URL` (Backend Domain + `/api`).
6. *Note: Ensure `vite.config.js` has `allowedHosts: true` for the preview server.*

## 🔒 Environment Variables

### Server (`server/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
NODE_ENV=production
CLIENT_URL=https://your-frontend-app.up.railway.app
```

### Client (`client/.env`)
```
VITE_API_URL=https://your-backend-app.up.railway.app/api
```

## 📄 License

MIT © 2026
