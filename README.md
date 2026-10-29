
# SmartTraffic: Smart Traffic Incident Reporting System

**Student:** [DIVYA]
**Enrollment / Roll No:** [2300715]
**Course / College:** [Bhai Gurdas Institute of Engineering and Technology]

## Live Project

| | URL |
|---|---|
| **Website (open this)** | https://smarttraffic-final.vercel.app |
| Backend API | https://smarttraffic-backend-g6rd.onrender.com |

> **Note:** The backend runs on a free server that sleeps when idle. The first request after a break can take 30 to 50 seconds. Please open the Backend API link once and wait for "SmartTraffic Backend Running" before logging in.

## Demo Login Credentials

| Role | ID / Username | Password |
|---|---|---|
| Admin | `ADMIN001` | `Admin@123` |
| Authority (Officer) | `ST-A001` | `SmartTraffic@123` |
| Citizen | Create a new account using "Create Account" on the login page | |

## About the Project

SmartTraffic lets citizens report traffic incidents (accident, road block, congestion, vehicle breakdown) with location, photo and description. An AI model analyses each report and suggests incident type, severity, risk indicators and a recommended response. Authorities review and update reports, and the admin supervises the whole system.

### Features

- **Citizen:** register and login, report an incident with map location and photo, AI analysis, track My Reports, traffic map, analytics, light and dark theme
- **Authority:** login, view all incidents, update status, assign team, add resolution note
- **Admin:** dashboard statistics, manage authorities (add, enable, disable), view citizens, analytics, incident map
- **Security:** JWT authentication, role-based access (citizen, authority, admin), bcrypt password hashing, login rate limiting

## Tech Stack

| Part | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Leaflet (maps) |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas with Mongoose |
| AI | Groq API (OpenAI-compatible) |
| Auth | JWT, bcryptjs |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

## Project Structure

```
project/
├── backend/              Express server
│   ├── models/           Mongoose models (Citizen, Incident, Authority, Admin)
│   ├── server.js         All API routes
│   ├── db.js             MongoDB connection
│   ├── createAdmin.js    Creates the first admin
│   └── createAuthority.js  Creates the first authority officer
├── src/                  React frontend
│   ├── components/       Pages and UI components
│   ├── context/          Theme and user context
│   ├── authFetch.js      Adds the JWT token to API calls
│   └── main.jsx          App entry point
└── package.json
```

## Run Locally

**Requirements:** Node.js 18 or higher, a MongoDB Atlas database, a Groq API key.

### 1. Backend

```bash
cd backend
npm install
```

Create a file `backend/.env` (see `backend/.env.example`):

```
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=any_long_random_text
PORT=5000
```

Create the first admin and authority (run once):

```bash
node createAdmin.js
node createAuthority.js
```

Start the server:

```bash
npm run dev
```

Expected output: `MongoDB Connected Successfully` and `SmartTraffic backend running on port 5000`.

### 2. Frontend

In a new terminal, from the main project folder:

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Restore the Database

The folder `backup/` contains a full backup of the database (created with `mongodump`). To restore it into your own MongoDB:

```bash
mongorestore --uri="your_mongodb_connection_string" --nsInclude="smarttraffic.*" backup
```

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `MONGO_URI` | Backend | MongoDB connection string |
| `GROQ_API_KEY` | Backend | AI analysis |
| `JWT_SECRET` | Backend | Signing login tokens |
| `FRONTEND_URL` | Backend (hosting) | Allowed website for CORS |
| `VITE_API_URL` | Frontend (hosting) | Backend URL |

## Deployment

- **Frontend:** Vercel, Vite preset, environment variable `VITE_API_URL` set to the backend URL
- **Backend:** Render, root directory `backend`, start command `npm start`
- **Database:** MongoDB Atlas (free cluster)