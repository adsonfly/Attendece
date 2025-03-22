# Attendance Management System

A full-stack attendance management system for shop owners to register their stores and manage employee attendance.

## Features

- Shop Owner Registration
- Phone-based Authentication
- Employee Attendance Tracking
- Dashboard to view attendance records

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Fastify
- **Database**: MongoDB

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas cloud instance)

## Installation

1. Clone the repository
```
git clone <repository-url>
cd attendance-management
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/attendance_db
JWT_SECRET=your_jwt_secret_key_here
```

## Running the Application

### Development Mode
```
npm run dev
```

### Production Mode
```
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

### User Routes
- `POST /api/users/register` - Register a new shop owner
- `POST /api/users/login` - Login with phone number
- `GET /api/users/profile` - Get user profile (protected)

### Attendance Routes
- `POST /api/attendance/add` - Add attendance record (protected)
- `GET /api/attendance/records` - Get attendance records (protected)

## Project Structure

```
attendance-management/
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── common.js
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── attendanceController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── attendance.js
│   │   └── user.js
│   ├── routes/
│   │   ├── attendance.js
│   │   └── user.js
│   └── server.js
├── views/
│   ├── dashboard.html
│   ├── index.html
│   └── login.html
├── .env
├── package.json
└── README.md
``` 