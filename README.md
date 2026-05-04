# 🚀 TaskFlow — Team Task Manager

A full-stack web application for managing teams, projects, and tasks with role-based access control.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 🔐 **JWT Authentication** — Signup/Login with secure token-based sessions
- 👥 **Role-Based Access Control** — Admin & Member roles with enforced permissions
- 📁 **Project Management** — Create projects, add/remove team members
- ✅ **Task Management** — Create, assign, update, and delete tasks
- 📊 **Dashboard** — Real-time stats: total, in-progress, done, overdue tasks
- 🎯 **Kanban Board** — Visual task tracking across To Do / In Progress / Done columns
- 🔍 **Filtering** — Filter tasks by project, priority, and status

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Custom CSS (dark theme design system) |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |
| Deployment | Railway (backend) + Vercel (frontend) |

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
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # AuthContext
│   │   └── pages/        # Dashboard, Projects, Tasks, Auth
│   └── package.json
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

## ☁️ Deployment

### Backend → Railway
1. Push code to GitHub
2. Create new Railway project → Deploy from GitHub
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL`
4. Railway auto-detects Node.js and runs `npm start`

### Frontend → Vercel
1. Import GitHub repo in Vercel
2. Set root directory to `client`
3. Set env: `VITE_API_URL=https://your-railway-app.railway.app/api`
4. Deploy

## 🔒 Environment Variables

### Server (`server/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
NODE_ENV=production
CLIENT_URL=https://your-vercel-app.vercel.app
```

### Client (`client/.env`)
```
VITE_API_URL=https://your-railway-app.railway.app/api
```

## 📄 License

MIT © 2026
