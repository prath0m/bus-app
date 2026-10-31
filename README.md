# School Bus Payment Tracker

A cross-platform React Native Expo application for school bus owners to manage students, schools, and track monthly payment records — with a parent app for live bus tracking.

## User Roles

| Role | How the account is created | What they see |
|------|---------------------------|---------------|
| **Owner** | On the server only: `cd backend && npm run create-owner -- --first Ramesh --last Patil --email ramesh@example.com --mobile 9876543210 --password secret123` (pass just `--email` to promote an existing account) | Full app: students, schools, payments, plus the **Map** tab |
| **Parent** | Self sign-up in the app. Only allowed if the mobile number matches a student's contact number saved by the owner | Their children, this month's fee status, payment history, live bus location, home location |

Parents are linked to children by phone number (last 10 digits), so an owner just needs to save the parent's number on the student.

## Features

- **Authentication** — Signup, login, and JWT-based session management
- **School Management** — Create and manage schools with shift/timing details
- **Student Management** — Add students, assign to schools, track joining dates
- **Payment Tracking** — Record payments (Cash/Online) with flexible periods (Monthly, Quarterly, Half Yearly, Yearly, Custom)
- **Routes** — Organize students by bus routes
- **Payment History** — View historical payment records
- **Profile & Settings** — Manage user profile and app preferences
- **Live Bus Tracking** — Owner shares the bus's live GPS location from the Map tab; parents see it on a map with distance from home
- **Home Locations** — Parents pin their home on the map; the owner sees every pickup point on the route map

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 57), TypeScript |
| Maps | react-native-maps (Google Maps on Android, Apple Maps on iOS), expo-location |
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

### Maps & location notes

- **Expo Go** works out of the box for maps and location (no API key needed).
- **Standalone / development builds on Android** need a Google Maps API key (enable "Maps SDK for Android" in Google Cloud), added to the `plugins` in `app.json`:
  `["react-native-maps", { "androidGoogleMapsApiKey": "YOUR_KEY" }]`, then run `npx expo prebuild --clean`.
- Live sharing runs while the app is open on the owner's phone (foreground). If the app is closed or loses signal, parents see the bus as offline after 2 minutes.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a parent (mobile must match a student's contact number) |
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

### Parent (parent role only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parent/children` | Children with this month's fee status and the parent's home location |
| GET | `/api/parent/children/:studentId/payments` | Payment history for one child |
| GET | `/api/parent/bus-locations` | Live location of each bus carrying the parent's children |
| PUT | `/api/parent/home-location` | Save home location `{ latitude, longitude, address? }` |

### Location (owner role only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/location/bus` | Update live bus location `{ latitude, longitude, heading?, speed? }` |
| POST | `/api/location/bus/stop` | Stop sharing |
| GET | `/api/location/bus` | Owner's last shared location |
| GET | `/api/location/homes` | Parents' home locations and students still missing one |

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
| `npm run create-owner -- --first … --last … --email … --mobile … --password …` | Create a bus owner account |

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
