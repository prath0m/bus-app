# School Bus Payment Tracker

A cross-platform React Native Expo application for school bus owners to manage students, schools, and track monthly payment records.

## Features

- **Authentication** — Signup, login, and JWT-based session management
- **School Management** — Create and manage schools with shift/timing details
- **Student Management** — Add students, assign to schools, track joining dates
- **Payment Tracking** — Record payments (Cash/Online) with flexible periods (Monthly, Quarterly, Half Yearly, Yearly, Custom)
- **Routes** — Organize students by bus routes
- **Payment History** — View historical payment records
- **Profile & Settings** — Manage user profile and app preferences

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 54), TypeScript |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (jsonwebtoken), bcrypt |
| Storage | AsyncStorage (token persistence) |

## Project Structure

```
├── App.tsx                  # Root component & navigation
├── app.json                 # Expo configuration
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── CreateScreen.tsx
│   │   ├── PaymentScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── RoutesScreen.tsx
│   │   ├── StudentDetailScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   └── BottomNavigation.tsx
│   ├── services/
│   │   └── api.ts           # API client & type definitions
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── tailwind.ts
├── backend/
│   ├── server.js            # Express server entry point
│   ├── models/
│   │   ├── User.js
│   │   ├── School.js
│   │   └── Student.js
│   └── routes/
│       ├── auth.js
│       ├── users.js
│       ├── schools.js
│       └── students.js
└── assets/
```

## Prerequisites

- **Node.js** v16+
- **npm** or **yarn**
- **Expo CLI** — `npm install -g expo-cli`
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd app
```

### 2. Install dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside `backend/`:

```env
MONGODB_URI=mongodb://localhost:27017/school-bus-tracker
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

### 4. Start MongoDB

```bash
# Local
mongod

# Or use your MongoDB Atlas connection string in .env
```

### 5. Start the backend server

```bash
cd backend
npm run dev      # development (auto-restart with nodemon)
# or
npm start        # production
```

Server runs at `http://localhost:3000`

### 6. Start the Expo app

```bash
# From the project root
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) or press:
- `i` — open iOS simulator
- `a` — open Android emulator
- `w` — open in web browser

> **Note:** Update `API_BASE_URL` in `src/services/api.ts` with your machine's local IP if testing on a physical device.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/verify` | Verify JWT token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update profile |

### Schools
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schools` | List schools |
| POST | `/api/schools` | Create a school |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List students |
| POST | `/api/students` | Add a student |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status check |

## Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm run web` | Start on web |

### Backend

| Command | Description |
|---------|-------------|
| `npm start` | Start server |
| `npm run dev` | Start with nodemon (auto-reload) |

## Security

- Passwords hashed with **bcrypt**
- JWT token authentication
- **Helmet.js** security headers
- Input validation with **express-validator**
- CORS enabled for mobile client access

## Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Replace `JWT_SECRET` with a strong random string
3. Use MongoDB Atlas for a managed database
4. Update `API_BASE_URL` in `src/services/api.ts` to your production URL
5. Use a process manager like **PM2** for the backend
6. Build the Expo app with `eas build`

## License

MIT
